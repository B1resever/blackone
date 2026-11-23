-- Intake records are requests only. They do not reserve inventory or create payments.
create table if not exists b1_vip_hourly_requests (
  request_id uuid primary key,
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  vehicle_key text not null check (vehicle_key in ('maybach-tifanni', 'desert-sand', 'cadillac-escalade')),
  pickup_at timestamptz not null,
  pickup_address text not null check (length(pickup_address) between 3 and 180),
  destination_address text not null check (length(destination_address) between 3 and 180),
  duration_hours smallint not null check (duration_hours between 3 and 24),
  passengers smallint not null check (passengers between 1 and 15),
  guest_full_name text not null check (length(guest_full_name) between 2 and 120),
  guest_email text not null check (length(guest_email) <= 160),
  guest_phone text not null check (length(guest_phone) between 7 and 35),
  quote jsonb not null check (jsonb_typeof(quote) = 'object'),
  radius_miles double precision not null check (radius_miles between 0 and 30),
  status text not null default 'requested' check (status in ('requested', 'cancelled')),
  created_at timestamptz not null default statement_timestamp()
);

create index if not exists b1_vip_hourly_requests_status_created_idx
  on b1_vip_hourly_requests (status, created_at desc);

-- One shared durable counter bounds provider calls across serverless instances.
create table if not exists b1_vip_hourly_route_budget (
  id boolean primary key default true check (id),
  bucket_hour bigint not null,
  used_calls integer not null check (used_calls > 0)
);
