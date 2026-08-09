alter table public.event_guests
  add column if not exists invited_by text not null default '',
  add column if not exists companion_of_id uuid references public.event_guests(id) on delete set null;

create index if not exists event_guests_companion_of_idx
  on public.event_guests(companion_of_id);
