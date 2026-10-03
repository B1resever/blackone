begin;

alter table one_driver_profiles
  add column if not exists fee_exempt_until timestamptz;

alter table one_driver_fee_ledger
  add column if not exists status text not null default 'posted',
  add column if not exists provider_payment_id text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists one_driver_fee_trip_unique_idx
  on one_driver_fee_ledger (reservation_id)
  where reservation_id is not null and fee_type = 'percentage';

create unique index if not exists one_driver_fee_monthly_payment_unique_idx
  on one_driver_fee_ledger (driver_user_id, month_key, fee_type)
  where fee_type = 'monthly_payment';

create index if not exists one_driver_fee_ledger_driver_month_idx
  on one_driver_fee_ledger (driver_user_id, month_key, created_at desc);

commit;
