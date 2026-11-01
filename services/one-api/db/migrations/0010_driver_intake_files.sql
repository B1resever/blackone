begin;

alter table one_driver_applications add column if not exists intake_details jsonb not null default '{}'::jsonb;
alter table one_driver_profiles add column if not exists intake_details jsonb not null default '{}'::jsonb;
alter table one_driver_vehicles add column if not exists passenger_capacity integer check (passenger_capacity between 1 and 20);

-- Small private onboarding images. Read access is enforced by the authenticated API.
create table if not exists one_driver_document_files (
  document_id uuid primary key references one_driver_documents(id) on delete cascade,
  mime_type text not null check (mime_type in ('image/jpeg','image/png')),
  contents bytea not null check (octet_length(contents) between 1 and 2097152),
  created_at timestamptz not null default now()
);
commit;
