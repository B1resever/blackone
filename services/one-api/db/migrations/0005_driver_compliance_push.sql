begin;

alter table one_driver_profiles
  add column if not exists available_for_assignment boolean not null default false,
  add column if not exists availability_updated_at timestamptz,
  add column if not exists compliance_status text not null default 'pending',
  add column if not exists compliance_checked_at timestamptz;

create table if not exists one_driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_user_id uuid not null references one_users(id) on delete cascade,
  document_type text not null check (document_type in (
    'driver_license',
    'insurance',
    'vehicle_registration',
    'background_check',
    'profile_photo',
    'other'
  )),
  document_number text,
  file_url text,
  expires_on date,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  review_notes text,
  verified_at timestamptz,
  verified_by uuid references one_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists one_driver_documents_driver_idx
  on one_driver_documents (driver_user_id, document_type, status, created_at desc);

create table if not exists one_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references one_users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios','android','web','unknown')),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists one_push_tokens_user_idx
  on one_push_tokens (user_id, enabled, last_seen_at desc);

commit;
