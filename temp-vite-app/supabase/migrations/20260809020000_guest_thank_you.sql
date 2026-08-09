alter table public.event_guests
  add column if not exists thanked_at timestamptz;
