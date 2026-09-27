-- B1 Reserve / ONE operational schema
-- Safe foundation for development branch. Apply only after DATABASE_URL is verified.

create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending','approved','suspended','inactive')),
  online boolean not null default false,
  stripe_connect_account_id text,
  created_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references drivers(id) on delete set null,
  make text not null,
  model text not null,
  year integer,
  color text,
  plate text,
  capacity integer not null default 4,
  class text not null default 'luxury_suv',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  customer_id uuid references customers(id) on delete set null,
  ride_type text not null,
  pickup_address text not null,
  destination_address text not null,
  pickup_at timestamptz not null,
  passenger_count integer not null default 1,
  distance_miles numeric(10,2) not null default 0,
  duration_minutes integer not null default 0,
  estimated_tolls numeric(10,2) not null default 0,
  quoted_total numeric(10,2) not null default 0,
  currency text not null default 'USD',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded','failed')),
  trip_status text not null default 'requested' check (trip_status in ('requested','quoted','confirmed','assigned','driver_en_route','arrived','passenger_onboard','completed','cancelled')),
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trip_assignments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  driver_id uuid not null references drivers(id) on delete restrict,
  vehicle_id uuid references vehicles(id) on delete set null,
  driver_pay numeric(10,2) not null default 0,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  unique(reservation_id)
);

create table if not exists reservation_events (
  id bigserial primary key,
  reservation_id uuid not null references reservations(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reservations_pickup_at_idx on reservations(pickup_at);
create index if not exists reservations_trip_status_idx on reservations(trip_status);
create index if not exists drivers_status_online_idx on drivers(status, online);
create index if not exists reservation_events_reservation_id_idx on reservation_events(reservation_id);
