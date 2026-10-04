begin;

alter table one_reservations
  add column if not exists ride_code text,
  add column if not exists ride_code_verified_at timestamptz;

create unique index if not exists one_reservations_ride_code_unique_idx
  on one_reservations (ride_code)
  where ride_code is not null;

create table if not exists one_trip_messages (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references one_reservations(id) on delete cascade,
  sender_user_id uuid not null references one_users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists one_trip_messages_reservation_idx
  on one_trip_messages (reservation_id, created_at asc);

create table if not exists one_driver_locations (
  id bigserial primary key,
  reservation_id uuid not null references one_reservations(id) on delete cascade,
  driver_user_id uuid not null references one_users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  heading_degrees double precision,
  speed_mps double precision,
  created_at timestamptz not null default now()
);

create index if not exists one_driver_locations_reservation_idx
  on one_driver_locations (reservation_id, created_at desc);

commit;
