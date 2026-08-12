alter table public.event_guests
  add column if not exists seat_number integer;

alter table public.event_guests
  drop constraint if exists event_guests_seat_number_check;

alter table public.event_guests
  add constraint event_guests_seat_number_check
  check (seat_number between 1 and 30);
