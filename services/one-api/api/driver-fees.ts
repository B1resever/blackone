import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({ error: 'driver_unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      p.driver_fee_model,
      p.monthly_cap_amount_minor,
      p.percent_per_trip,
      p.fee_exempt_until,
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

  const monthRows = await sql`
    select (date_trunc('month', now() at time zone ${String(profile.time_zone)})::date) as month_key
  `;
  const monthKey = String(monthRows[0].month_key);

  const ledger = await sql`
    select
      id,
      reservation_id,
      fee_type,
      gross_amount_minor,
      fee_amount_minor,
      currency,
      status,
      created_at
    from one_driver_fee_ledger
    where driver_user_id = ${user.id}
      and month_key = ${monthKey}
    order by created_at desc
  `;

  const covered = ledger
    .filter((row) => ['posted','paid'].includes(String(row.status)))
    .reduce((sum, row) => sum + Number(row.fee_amount_minor ?? 0), 0);

  const cap = Number(profile.monthly_cap_amount_minor ?? 0);
  const exemptUntil = profile.fee_exempt_until ? String(profile.fee_exempt_until) : null;

  return res.status(200).json({
    marketId: profile.home_market_id,
    currency: profile.currency,
    feeModel: profile.driver_fee_model,
    percentPerTrip: Number(profile.percent_per_trip ?? 0),
    monthlyCapAmountMinor: cap || null,
    monthKey,
    coveredAmountMinor: covered,
    remainingAmountMinor: cap ? Math.max(0, cap - covered) : null,
    feeExemptUntil: exemptUntil,
    isExempt: exemptUntil ? new Date(exemptUntil).getTime() > Date.now() : false,
    ledger,
  });
}
