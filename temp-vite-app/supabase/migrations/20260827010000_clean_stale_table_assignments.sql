-- Remove table references that can no longer be shown in the active seating plan.
-- Future writes are also normalized so archived or non-confirmed guests cannot
-- retain a stale seat after RSVP or admin changes.

update public.event_guests
set table_id = null,
    seat_number = null,
    updated_at = now()
where table_id is not null
  and (archived_at is not null or status <> 'Confirmado');

create or replace function public.normalize_event_guest_table_assignment()
returns trigger
language plpgsql
as $$
begin
  if new.archived_at is not null or new.status <> 'Confirmado' or new.table_id is null then
    new.table_id := null;
    new.seat_number := null;
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_event_guest_table_assignment_trigger on public.event_guests;
create trigger normalize_event_guest_table_assignment_trigger
before insert or update of status, archived_at, table_id, seat_number
on public.event_guests
for each row
execute function public.normalize_event_guest_table_assignment();
