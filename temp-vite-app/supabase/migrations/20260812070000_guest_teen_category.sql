alter table public.event_guests
  drop constraint if exists event_guests_guest_type_check;

alter table public.event_guests
  add constraint event_guests_guest_type_check
  check (guest_type in ('adult', 'teen', 'child'));
