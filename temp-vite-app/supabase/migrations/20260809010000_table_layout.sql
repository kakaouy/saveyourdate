alter table public.event_tables
  add column if not exists space_name text not null default 'Espacio 1',
  add column if not exists position_x integer not null default 24,
  add column if not exists position_y integer not null default 24;
