begin;

create table if not exists one_account_events (
  id bigserial primary key,
  target_user_id uuid references one_users(id) on delete set null,
  actor_user_id uuid references one_users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists one_account_events_target_idx
  on one_account_events (target_user_id, created_at desc);

create index if not exists one_account_events_actor_idx
  on one_account_events (actor_user_id, created_at desc);

commit;
