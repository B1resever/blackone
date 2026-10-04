import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!(await isAdminAuthorized(req))) return res.status(401).json({ error: 'unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const databaseUrl = process.env.DATABASE_URL;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!databaseUrl || !stripeKey) return res.status(503).json({ error: 'payments_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select id, request_code, status, payment_status
    from one_reservations
    where request_code = ${parsed.data.requestCode}
    limit 1
  `;
  const reservation = rows[0];
  if (!reservation) return res.status(404).json({ error: 'reservation_not_found' });
  if (reservation.status !== 'cancelled') return res.status(409).json({ error: 'cancel_before_refund' });
  if (reservation.payment_status === 'refunded') return res.status(200).json({ refunded: true, alreadyRefunded: true });
  if (reservation.payment_status !== 'paid') return res.status(409).json({ error: 'payment_not_refundable' });

  const payments = await sql`
    select id, provider_payment_id, amount_minor, currency
    from one_payments
    where reservation_id = ${reservation.id}
      and provider = 'stripe'
      and status = 'paid'
    order by created_at desc
    limit 1
  `;
  const payment = payments[0];
  if (!payment?.provider_payment_id) return res.status(409).json({ error: 'stripe_payment_missing' });

  const stripe = new Stripe(stripeKey);
  let paymentIntentId = String(payment.provider_payment_id);
  if (paymentIntentId.startsWith('cs_')) {
    const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
    paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : '';
  }
  if (!paymentIntentId.startsWith('pi_')) return res.status(409).json({ error: 'stripe_payment_intent_missing' });

  const refund = await stripe.refunds.create(
    { payment_intent: paymentIntentId, reason: 'requested_by_customer' },
    { idempotencyKey: 'one-refund-' + String(reservation.id) },
  );

  await sql`
    update one_payments
    set status = 'refunded',
        updated_at = now()
    where id = ${payment.id}
  `;
  await sql`
    update one_reservations
    set payment_status = 'refunded',
        updated_at = now()
    where id = ${reservation.id}
  `;
  await sql`
    insert into one_trip_events (reservation_id, event_type, payload)
    values (
      ${reservation.id},
      'payment_refunded',
      jsonb_build_object('stripe_refund_id', ${refund.id}, 'amount_minor', ${refund.amount}, 'currency', ${refund.currency})
    )
  `;

  return res.status(200).json({
    refunded: true,
    refundId: refund.id,
    amountMinor: refund.amount,
    currency: refund.currency.toUpperCase(),
  });
}
