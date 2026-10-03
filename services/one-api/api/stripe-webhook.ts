import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

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
      const requestCode = session.metadata?.one_request_code;

      if (requestCode) {
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
        `;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('ONE Stripe webhook processing failed', error);
    return res.status(500).json({ error: 'webhook_processing_failed' });
  }
}
