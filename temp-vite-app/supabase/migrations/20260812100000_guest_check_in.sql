alter table public.event_guests
  add column if not exists checked_in_at timestamptz;

create index if not exists event_guests_order_checked_in_idx
  on public.event_guests(order_number, checked_in_at);
