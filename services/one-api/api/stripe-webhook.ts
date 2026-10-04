import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
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

  if (!stripeKey || !webhookSecret || !databaseUrl || typeof signature !== 'string') {
    return res.status(503).json({ error: 'webhook_not_configured' });
  }

  const stripe = new Stripe(stripeKey);
  let event: Stripe.Event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('ONE Stripe webhook verification failed', error);
    return res.status(400).json({ error: 'invalid_signature' });
  }

  const sql = neon(databaseUrl);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
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
        await sql`
          update one_reservations
          set payment_status = 'paid',
              status = case when status in ('requested', 'quoted') then 'confirmed' else status end,
              updated_at = now()
          where request_code = ${requestCode}
        `;

        await sql`
          insert into one_payments (
            reservation_id,
            provider,
            provider_payment_id,
            amount_minor,
            currency,
            status
          )
          select
            id,
            'stripe',
            ${typeof session.payment_intent === 'string' ? session.payment_intent : session.id},
            ${session.amount_total ?? 0},
            ${String(session.currency ?? 'usd').toUpperCase()},
            'paid'
          from one_reservations
          where request_code = ${requestCode}
          on conflict (provider, provider_payment_id)
          where provider_payment_id is not null
          do update set
            reservation_id = excluded.reservation_id,
            amount_minor = excluded.amount_minor,
            currency = excluded.currency,
            status = excluded.status,
            updated_at = now()
        `;

        const paidRows = await sql`
          select id, status
          from one_reservations
          where request_code = ${requestCode}
          limit 1
        `;
        if (paidRows[0]?.id && paidRows[0]?.status === 'completed') {
          await postDriverTripFee(String(paidRows[0].id));
        }
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
        `;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('ONE Stripe webhook processing failed', error);
    return res.status(500).json({ error: 'webhook_processing_failed' });
  }
}
