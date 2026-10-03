begin;

alter table one_users
  add column if not exists password_hash text,
  add column if not exists email_verified_at timestamptz,
  add column if not exists deleted_at timestamptz;

create table if not exists one_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references one_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists one_auth_sessions_user_idx
  on one_auth_sessions (user_id, expires_at desc);

create index if not exists one_auth_sessions_expiry_idx
  on one_auth_sessions (expires_at);

commit;
