import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!databaseUrl || !stripeKey) {
    return res.status(503).json({ error: 'payments_not_configured' });
  }

  const sql = neon(databaseUrl);
  const rows = await sql`
    select id, request_code, quote_amount_minor, quote_currency, status
    from one_reservations
    where request_code = ${parsed.data.requestCode}
    limit 1
  `;
  const reservation = rows[0];

  if (!reservation) return res.status(404).json({ error: 'reservation_not_found' });
  if (!reservation.quote_amount_minor || !reservation.quote_currency) {
    return res.status(409).json({
      error: 'quote_not_confirmed',
      message: 'BLACK ONE must confirm the final quote before payment.',
    });
  }

  const stripe = new Stripe(stripeKey);
  const intent = await stripe.paymentIntents.create({
    amount: Number(reservation.quote_amount_minor),
    currency: String(reservation.quote_currency).toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: {
      one_request_code: String(reservation.request_code),
      one_reservation_id: String(reservation.id),
    },
  });

  await sql`
    update one_reservations
    set stripe_payment_intent_id = ${intent.id},
        payment_status = 'payment_intent_created',
        updated_at = now()
    where id = ${reservation.id}
  `;

  return res.status(200).json({
    clientSecret: intent.client_secret,
    requestCode: reservation.request_code,
  });
}
