begin;

create unique index if not exists one_payments_provider_payment_unique_idx
  on one_payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create index if not exists one_driver_vehicles_driver_status_idx
  on one_driver_vehicles (driver_user_id, status, updated_at desc);

commit;
