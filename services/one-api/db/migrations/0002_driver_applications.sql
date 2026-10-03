begin;

create table if not exists one_driver_applications (
  id uuid primary key default gen_random_uuid(),
  application_code text not null unique,
  market_id text not null references one_markets(id),
  full_name text not null,
  email text not null,
  phone text not null,
  license_region text not null,
  vehicle_year integer not null,
  vehicle_make text not null,
  vehicle_model text not null,
  plate_number text,
  status text not null default 'submitted',
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists one_driver_applications_status_idx
  on one_driver_applications (market_id, status, created_at desc);

commit;
