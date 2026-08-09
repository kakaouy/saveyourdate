alter table public.event_guests
  add column if not exists invited_by text not null default '',
  add column if not exists companion_of_id uuid references public.event_guests(id) on delete set null;

create index if not exists event_guests_companion_of_idx
  on public.event_guests(companion_of_id);

alter table public.event_tables
  add column if not exists space_name text not null default 'Espacio 1',
  add column if not exists position_x integer not null default 24,
  add column if not exists position_y integer not null default 24;
