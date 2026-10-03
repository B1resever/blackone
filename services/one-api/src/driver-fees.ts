import { neon } from '@neondatabase/serverless';

type FeePostResult = {
  posted: boolean;
  reason: string;
  feeAmountMinor: number;
  currency: string | null;
};

export async function postDriverTripFee(reservationId: string): Promise<FeePostResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      r.id,
      r.assigned_driver_user_id,
      r.quote_amount_minor,
      r.quote_currency,
      r.status,
      r.payment_status,
      p.driver_fee_model,
      p.monthly_cap_amount_minor,
      p.percent_per_trip,
      p.fee_exempt_until,
      m.time_zone,
      m.currency
    from one_reservations r
    join one_driver_profiles p on p.user_id = r.assigned_driver_user_id
    join one_markets m on m.id = r.market_id
    where r.id = ${reservationId}
    limit 1
  `;

  const row = rows[0];
  if (!row?.assigned_driver_user_id) {
    return { posted: false, reason: 'driver_not_assigned', feeAmountMinor: 0, currency: null };
  }

  const currency = String(row.quote_currency ?? row.currency ?? '');
  if (row.status !== 'completed') {
    return { posted: false, reason: 'trip_not_completed', feeAmountMinor: 0, currency };
  }
  if (row.payment_status !== 'paid') {
    return { posted: false, reason: 'trip_not_paid', feeAmountMinor: 0, currency };
  }

  const grossAmountMinor = Number(row.quote_amount_minor ?? 0);
  if (!grossAmountMinor || grossAmountMinor < 0) {
    return { posted: false, reason: 'gross_amount_missing', feeAmountMinor: 0, currency };
  }

  const exemptUntil = row.fee_exempt_until ? new Date(String(row.fee_exempt_until)) : null;
  if (exemptUntil && exemptUntil.getTime() > Date.now()) {
    return { posted: false, reason: 'fee_exempt', feeAmountMinor: 0, currency };
  }

  const percent = Number(row.percent_per_trip ?? 0);
  if (!percent || percent <= 0) {
    return { posted: false, reason: 'fee_percent_missing', feeAmountMinor: 0, currency };
  }

  const monthRows = await sql`
    select
      (date_trunc('month', now() at time zone ${String(row.time_zone)})::date) as month_key
  `;
  const monthKey = String(monthRows[0].month_key);
  let feeAmountMinor = Math.round(grossAmountMinor * percent);

  if (row.driver_fee_model === 'monthly_cap') {
    const cap = Number(row.monthly_cap_amount_minor ?? 0);
    if (!cap || cap <= 0) {
      return { posted: false, reason: 'monthly_cap_missing', feeAmountMinor: 0, currency };
    }

    const totals = await sql`
      select coalesce(sum(fee_amount_minor), 0) as total
      from one_driver_fee_ledger
      where driver_user_id = ${row.assigned_driver_user_id}
        and month_key = ${monthKey}
        and fee_type in ('percentage','monthly_payment')
        and status in ('posted','paid')
    `;

    const alreadyCovered = Number(totals[0]?.total ?? 0);
    const remaining = Math.max(0, cap - alreadyCovered);
    feeAmountMinor = Math.min(feeAmountMinor, remaining);

    if (feeAmountMinor <= 0) {
      return { posted: false, reason: 'monthly_cap_reached', feeAmountMinor: 0, currency };
    }
  }

  const inserted = await sql`
    insert into one_driver_fee_ledger (
      driver_user_id,
      reservation_id,
      month_key,
      fee_type,
      gross_amount_minor,
      fee_amount_minor,
      currency,
      status
    ) values (
      ${row.assigned_driver_user_id},
      ${row.id},
      ${monthKey},
      'percentage',
      ${grossAmountMinor},
      ${feeAmountMinor},
      ${currency},
      'posted'
    )
    on conflict do nothing
    returning id
  `;

  return {
    posted: Boolean(inserted[0]),
    reason: inserted[0] ? 'posted' : 'already_posted',
    feeAmountMinor: inserted[0] ? feeAmountMinor : 0,
    currency,
  };
}
