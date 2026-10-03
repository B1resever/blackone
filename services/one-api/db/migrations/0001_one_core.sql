begin;

create extension if not exists pgcrypto;

create table if not exists one_markets (
  id text primary key,
  country_code char(2) not null,
  name text not null,
  currency char(3) not null,
  time_zone text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists one_vehicle_classes (
  id text primary key,
  name text not null,
  max_passengers integer,
  max_luggage integer,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists one_users (
  id uuid primary key default gen_random_uuid(),
  auth_subject text unique,
  role text not null check (role in ('passenger','driver','admin','dispatcher')),
  full_name text not null,
  email text,
  phone text,
  locale text not null default 'en',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_users_email_lower_idx
  on one_users (lower(email))
  where email is not null;

create table if not exists one_driver_profiles (
  user_id uuid primary key references one_users(id) on delete cascade,
  onboarding_status text not null default 'started',
  verification_status text not null default 'pending',
  home_market_id text references one_markets(id),
  driver_fee_model text not null default 'monthly_cap',
  monthly_cap_amount_minor bigint,
  percent_per_trip numeric(7,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists one_driver_vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_user_id uuid not null references one_users(id),
  vehicle_class_id text not null references one_vehicle_classes(id),
  make text not null,
  model text not null,
  vehicle_year integer,
  color text,
  plate_country char(2),
  plate_region text,
  plate_number text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists one_market_rates (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references one_markets(id),
  vehicle_class_id text not null references one_vehicle_classes(id),
  ride_type text not null check (ride_type in ('one-way','hourly','round-trip')),
  currency char(3) not null,
  base_amount_minor bigint not null default 0,
  minimum_amount_minor bigint not null default 0,
  per_distance_minor bigint,
  distance_unit text check (distance_unit in ('mile','km')),
  per_minute_minor bigint,
  hourly_amount_minor bigint,
  active boolean not null default false,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists one_reservations (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  passenger_user_id uuid references one_users(id),
  market_id text not null references one_markets(id),
  ride_type text not null check (ride_type in ('one-way','hourly','round-trip')),
  pickup_text text not null,
  dropoff_text text,
  pickup_date_text text not null,
  pickup_time_text text not null,
  passenger_count integer not null check (passenger_count > 0),
  vehicle_class_id text not null references one_vehicle_classes(id),
  guest_full_name text,
  guest_email text,
  guest_phone text,
  notes text,
  status text not null default 'requested',
  quote_amount_minor bigint,
  quote_currency char(3),
  quote_confirmed_at timestamptz,
  payment_status text not null default 'not_started',
  stripe_payment_intent_id text,
  assigned_driver_user_id uuid references one_users(id),
  assigned_vehicle_id uuid references one_driver_vehicles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists one_reservations_market_status_idx
  on one_reservations (market_id, status, created_at desc);

create index if not exists one_reservations_driver_idx
  on one_reservations (assigned_driver_user_id, created_at desc)
  where assigned_driver_user_id is not null;

create table if not exists one_trip_events (
  id bigserial primary key,
  reservation_id uuid not null references one_reservations(id) on delete cascade,
  actor_user_id uuid references one_users(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists one_trip_events_reservation_idx
  on one_trip_events (reservation_id, created_at);

create table if not exists one_payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references one_reservations(id),
  provider text not null default 'stripe',
  provider_payment_id text,
  amount_minor bigint not null,
  currency char(3) not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists one_driver_fee_ledger (
  id uuid primary key default gen_random_uuid(),
  driver_user_id uuid not null references one_users(id),
  reservation_id uuid references one_reservations(id),
  month_key date not null,
  fee_type text not null check (fee_type in ('percentage','monthly_payment','adjustment')),
  gross_amount_minor bigint,
  fee_amount_minor bigint not null,
  currency char(3) not null,
  created_at timestamptz not null default now()
);

insert into one_markets (id, country_code, name, currency, time_zone, active)
values
  ('south-florida', 'US', 'South Florida', 'USD', 'America/New_York', true),
  ('buenos-aires', 'AR', 'Buenos Aires', 'ARS', 'America/Argentina/Buenos_Aires', true)
on conflict (id) do update set
  country_code = excluded.country_code,
  name = excluded.name,
  currency = excluded.currency,
  time_zone = excluded.time_zone;

insert into one_vehicle_classes (id, name, max_passengers, max_luggage, sort_order)
values
  ('confort', 'CONFORT', 4, 2, 10),
  ('xl', 'XL', 7, 6, 20),
  ('suv-black', 'SUV BLACK', 6, 6, 30),
  ('ultra-exclusive', 'ULTRA EXCLUSIVE', null, null, 40)
on conflict (id) do update set
  name = excluded.name,
  max_passengers = excluded.max_passengers,
  max_luggage = excluded.max_luggage,
  sort_order = excluded.sort_order;

commit;
