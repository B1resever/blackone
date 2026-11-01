begin;
alter table one_reservations
  add column if not exists driver_offer_token_hash text,
  add column if not exists driver_offer_expires_at timestamptz,
  add column if not exists driver_offer_amount_minor bigint check (driver_offer_amount_minor > 0),
  add column if not exists driver_offer_summary text;
create unique index if not exists one_reservations_driver_offer_token_idx
  on one_reservations(driver_offer_token_hash) where driver_offer_token_hash is not null;
commit;
