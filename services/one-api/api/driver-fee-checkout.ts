import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({ error: 'driver_unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!databaseUrl || !stripeKey) return res.status(503).json({ error: 'payments_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      p.driver_fee_model,
      p.monthly_cap_amount_minor,
      p.home_market_id,
      m.currency,
      m.time_zone
    from one_driver_profiles p
    join one_markets m on m.id = p.home_market_id
    where p.user_id = ${user.id}
    limit 1
  `;

  const profile = rows[0];
  if (!profile) return res.status(404).json({ error: 'driver_profile_not_found' });
  if (profile.driver_fee_model !== 'monthly_cap') {
    return res.status(409).json({ error: 'monthly_payment_not_available' });
  }

  const monthRows = await sql`
    select (date_trunc('month', now() at time zone ${String(profile.time_zone)})::date) as month_key
  `;
  const monthKey = String(monthRows[0].month_key);

  const totals = await sql`
    select coalesce(sum(fee_amount_minor), 0) as total
    from one_driver_fee_ledger
    where driver_user_id = ${user.id}
      and month_key = ${monthKey}
      and fee_type in ('percentage','monthly_payment')
      and status in ('posted','paid')
  `;

  const cap = Number(profile.monthly_cap_amount_minor ?? 0);
  const covered = Number(totals[0]?.total ?? 0);
  const remaining = Math.max(0, cap - covered);

  if (!remaining) {
    return res.status(409).json({ error: 'monthly_cap_already_covered' });
  }

  const stripe = new Stripe(stripeKey);
  const successUrl = process.env.ONE_PAYMENT_SUCCESS_URL ?? 'https://blackonetransportation.com/payment-success';
  const cancelUrl = process.env.ONE_PAYMENT_CANCEL_URL ?? 'https://blackonetransportation.com/payment-cancelled';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email ?? undefined,
    success_url: successUrl + (successUrl.includes('?') ? '&' : '?') + 'driver_fee=1',
    cancel_url: cancelUrl + (cancelUrl.includes('?') ? '&' : '?') + 'driver_fee=1',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: String(profile.currency).toLowerCase(),
        unit_amount: remaining,
        product_data: {
          name: 'ONE driver monthly platform fee',
          description: 'BLACK ONE · ' + monthKey,
        },
      },
    }],
    metadata: {
      one_payment_type: 'driver_monthly_fee',
      one_driver_user_id: user.id,
      one_month_key: monthKey,
    },
    payment_intent_data: {
      metadata: {
        one_payment_type: 'driver_monthly_fee',
        one_driver_user_id: user.id,
        one_month_key: monthKey,
      },
    },
  });

  return res.status(200).json({
    checkoutUrl: session.url,
    monthKey,
    amountMinor: remaining,
    currency: profile.currency,
  });
}
