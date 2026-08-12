alter table public.event_guests
  add column if not exists guest_type text not null default 'adult';

alter table public.event_guests
  drop constraint if exists event_guests_guest_type_check;

alter table public.event_guests
  add constraint event_guests_guest_type_check
  check (guest_type in ('adult', 'child'));
