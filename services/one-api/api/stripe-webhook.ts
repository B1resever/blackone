import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { postDriverTripFee } from '../src/driver-fees.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const databaseUrl = process.env.DATABASE_URL;
  const signature = req.headers['stripe-signature'];

  if (!stripeKey || !webhookSecret || !databaseUrl) {
    return res.status(503).json({ error: 'webhook_not_configured' });
  }

  if (typeof signature !== 'string') {
    return res.status(400).json({ error: 'invalid_signature' });
  }

  const stripe = new Stripe(stripeKey);
  let event: Stripe.Event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    // Signature errors can include the raw payload; keep passenger data out of logs.
    console.error('ONE Stripe webhook verification failed');
    return res.status(400).json({ error: 'invalid_signature' });
  }

  const sql = neon(databaseUrl);

  try {
    await processStripeEvent(event, sql);

    return res.status(200).json({ received: true });
  } catch {
    console.error('ONE Stripe webhook processing failed');
    return res.status(500).json({ error: 'webhook_processing_failed' });
  }
}

export async function processStripeEvent(event: Stripe.Event, sql: NeonQueryFunction<false, false>) {
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    // Completion can precede settlement for delayed payment methods.
    if (session.payment_status !== 'paid') return;
    const paymentType = session.metadata?.one_payment_type;
    const requestCode = session.metadata?.one_request_code;

    if (paymentType === 'driver_monthly_fee') {
      const driverUserId = session.metadata?.one_driver_user_id;
      const monthKey = session.metadata?.one_month_key;

      if (driverUserId && monthKey) {
        await sql`
          insert into one_driver_fee_ledger (
            driver_user_id,
            reservation_id,
            month_key,
            fee_type,
            gross_amount_minor,
            fee_amount_minor,
            currency,
            status,
            provider_payment_id
          ) values (
            ${driverUserId},
            null,
            ${monthKey},
            'monthly_payment',
            null,
            ${session.amount_total ?? 0},
            ${String(session.currency ?? 'usd').toUpperCase()},
            'paid',
            ${typeof session.payment_intent === 'string' ? session.payment_intent : session.id}
          )
          on conflict (driver_user_id, month_key, fee_type)
          where fee_type = 'monthly_payment'
          do update set
            fee_amount_minor = excluded.fee_amount_minor,
            currency = excluded.currency,
            status = 'paid',
            provider_payment_id = excluded.provider_payment_id,
            updated_at = now()
        `;
      }
    } else if (requestCode) {
      // Keep the payment ledger and booking in one statement. A replay after a
      // recorded refund must not restore either row to paid.
      const paidRows = await sql`
        with recorded_payment as (
          insert into one_payments (
            reservation_id, provider, provider_payment_id, amount_minor, currency, status
          )
          select
            id, 'stripe',
            ${typeof session.payment_intent === 'string' ? session.payment_intent : session.id},
            ${session.amount_total ?? 0},
            ${String(session.currency ?? 'usd').toUpperCase()}, 'paid'
          from one_reservations
          where request_code = ${requestCode}
          on conflict (provider, provider_payment_id)
          where provider_payment_id is not null
          do update set
            status = case when one_payments.status = 'refunded' then 'refunded' else excluded.status end,
            updated_at = now()
          returning reservation_id, status
        )
        update one_reservations r
        set payment_status = 'paid',
            status = case when r.status in ('requested', 'quoted') then 'confirmed' else r.status end,
            updated_at = now()
        where r.id in (select reservation_id from recorded_payment where status = 'paid')
          and r.payment_status <> 'refunded'
        returning r.id, r.status
      `;
      if (paidRows[0]?.id && paidRows[0]?.status === 'completed') {
        await postDriverTripFee(String(paidRows[0].id));
      }
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

    if (paymentIntentId) {
      // Use the same ledger-first order as settlement so concurrent deliveries
      // cannot leave the booking paid while its ledger says refunded.
      await sql`
        with refunded_payment as (
          update one_payments
          set status = 'refunded', updated_at = now()
          where provider = 'stripe'
            and provider_payment_id = ${paymentIntentId}
            and amount_minor <= ${Number(charge.amount_refunded ?? 0)}
          returning reservation_id
        )
        update one_reservations
        set payment_status = 'refunded', updated_at = now()
        where id in (select reservation_id from refunded_payment)
      `;
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const requestCode = intent.metadata?.one_request_code;
    if (requestCode) {
      await sql`
        update one_reservations
        set payment_status = 'failed',
            updated_at = now()
        where request_code = ${requestCode}
          and payment_status not in ('paid', 'refunded')
      `;
    }
  }

}
