begin;

create table if not exists one_driver_document_files (
  document_id uuid primary key references one_driver_documents(id) on delete cascade,
  file_name text not null,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 2500000),
  sha256 text not null,
  content bytea not null,
  created_at timestamptz not null default now()
);

create index if not exists one_driver_document_files_sha_idx
  on one_driver_document_files (sha256);

commit;
