alter table public.event_tables
  add column if not exists rotation_degrees integer not null default 0,
  add column if not exists is_locked boolean not null default false;
