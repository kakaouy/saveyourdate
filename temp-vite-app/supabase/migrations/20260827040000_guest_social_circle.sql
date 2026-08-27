alter table public.event_guests
  add column if not exists social_circle text not null default '';

update public.event_guests
set social_circle = group_name
where social_circle = '' and group_name <> '';

create index if not exists event_guests_order_social_circle_idx
  on public.event_guests(order_number, social_circle)
  where social_circle <> '';
