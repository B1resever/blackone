create table if not exists one_customer_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references one_users(id),
  document_version text not null,
  document_sha256 text not null,
  document_snapshot jsonb not null,
  account_email text,
  account_phone text,
  network_ip inet,
  accepted_at timestamptz not null default now(),
  method text not null default 'explicit_checkbox',
  unique (user_id, document_sha256)
);
