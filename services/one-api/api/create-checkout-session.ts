import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  email: z.string().email().max(254).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
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
    select
      id,
      request_code,
      quote_amount_minor,
      quote_currency,
      guest_full_name,
      guest_email,
      passenger_user_id,
      status,
      payment_status
    from one_reservations
    where request_code = ${parsed.data.requestCode}
    limit 1
  `;

  const reservation = rows[0];
  if (!reservation) return res.status(404).json({ error: 'reservation_not_found' });

  const sessionUser = await getSessionUser(req);
  const sessionOwnsReservation =
    sessionUser &&
    reservation.passenger_user_id &&
    String(reservation.passenger_user_id) === sessionUser.id;
  const emailOwnsReservation =
    parsed.data.email &&
    reservation.guest_email &&
    String(reservation.guest_email).toLowerCase() === parsed.data.email.toLowerCase();

  if (!sessionOwnsReservation && !emailOwnsReservation) {
    return res.status(403).json({ error: 'reservation_payment_not_authorized' });
  }

  const amountMinor = Number(reservation.quote_amount_minor ?? 0);
  const currency = String(reservation.quote_currency ?? '').toLowerCase();
  if (!amountMinor || !currency) {
    return res.status(409).json({
      error: 'quote_not_confirmed',
      message: 'BLACK ONE must confirm the final quote before payment.',
    });
  }

  if (reservation.payment_status === 'paid') {
    return res.status(409).json({ error: 'already_paid' });
  }

  const stripe = new Stripe(stripeKey);
  const successUrl =
    parsed.data.successUrl ??
    process.env.ONE_PAYMENT_SUCCESS_URL ??
    'https://blackonetransportation.com/payment-success';
  const cancelUrl =
    parsed.data.cancelUrl ??
    process.env.ONE_PAYMENT_CANCEL_URL ??
    'https://blackonetransportation.com/payment-cancelled';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: reservation.guest_email ? String(reservation.guest_email) : undefined,
    success_url: successUrl + (successUrl.includes('?') ? '&' : '?') + 'request_code=' + encodeURIComponent(String(reservation.request_code)),
    cancel_url: cancelUrl + (cancelUrl.includes('?') ? '&' : '?') + 'request_code=' + encodeURIComponent(String(reservation.request_code)),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amountMinor,
          product_data: {
            name: 'ONE scheduled ride',
            description: 'BLACK ONE reservation ' + String(reservation.request_code),
          },
        },
      },
    ],
    metadata: {
      one_request_code: String(reservation.request_code),
      one_reservation_id: String(reservation.id),
    },
    payment_intent_data: {
      metadata: {
        one_request_code: String(reservation.request_code),
        one_reservation_id: String(reservation.id),
      },
    },
  });

  await sql`
    update one_reservations
    set payment_status = 'checkout_created',
        updated_at = now()
    where id = ${reservation.id}
  `;

  return res.status(200).json({
    checkoutUrl: session.url,
    requestCode: reservation.request_code,
  });
}
