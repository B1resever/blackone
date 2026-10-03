import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      u.id as driver_user_id,
      u.full_name,
      u.email,
      p.home_market_id,
      p.driver_fee_model,
      p.monthly_cap_amount_minor,
      p.percent_per_trip,
      p.fee_exempt_until,
      m.currency,
      m.time_zone
    from one_users u
    join one_driver_profiles p on p.user_id = u.id
    join one_markets m on m.id = p.home_market_id
    where u.role = 'driver'
      and u.status = 'active'
    order by p.home_market_id, u.full_name
  `;

  const drivers = [];
  for (const row of rows) {
    const monthRows = await sql`
      select (date_trunc('month', now() at time zone ${String(row.time_zone)})::date) as month_key
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
        provider_payment_id,
        created_at
      from one_driver_fee_ledger
      where driver_user_id = ${row.driver_user_id}
        and month_key = ${monthKey}
      order by created_at desc
    `;

    const covered = ledger
      .filter((entry) => ['posted','paid'].includes(String(entry.status)))
      .reduce((sum, entry) => sum + Number(entry.fee_amount_minor ?? 0), 0);
    const cap = Number(row.monthly_cap_amount_minor ?? 0);

    drivers.push({
      driverUserId: row.driver_user_id,
      fullName: row.full_name,
      email: row.email,
      marketId: row.home_market_id,
      feeModel: row.driver_fee_model,
      currency: row.currency,
      percentPerTrip: Number(row.percent_per_trip ?? 0),
      monthlyCapAmountMinor: cap || null,
      feeExemptUntil: row.fee_exempt_until,
      isExempt: row.fee_exempt_until ? new Date(String(row.fee_exempt_until)).getTime() > Date.now() : false,
      monthKey,
      coveredAmountMinor: covered,
      remainingAmountMinor: cap ? Math.max(0, cap - covered) : null,
      ledger,
    });
  }

  return res.status(200).json({ drivers });
}
