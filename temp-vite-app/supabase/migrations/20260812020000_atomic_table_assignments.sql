create or replace function public.assign_event_guests_batch(
  p_order_number text,
  p_assignments jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_count integer;
  invalid_count integer;
  over_capacity_count integer;
begin
  if jsonb_typeof(p_assignments) <> 'array' or jsonb_array_length(p_assignments) = 0 then
    raise exception 'La distribución sugerida está vacía.';
  end if;

  create temporary table assignment_batch (
    guest_id uuid primary key,
    table_id uuid not null
  ) on commit drop;

  insert into assignment_batch (guest_id, table_id)
  select
    (item->>'guest_id')::uuid,
    (item->>'table_id')::uuid
  from jsonb_array_elements(p_assignments) item;

  get diagnostics assignment_count = row_count;
  if assignment_count <> jsonb_array_length(p_assignments) then
    raise exception 'La distribución contiene invitados repetidos.';
  end if;

  select count(*) into invalid_count
  from assignment_batch batch
  left join event_guests guest
    on guest.id = batch.guest_id
    and guest.order_number = p_order_number
    and guest.status = 'Confirmado'
    and guest.archived_at is null
  left join event_tables event_table
    on event_table.id = batch.table_id
    and event_table.order_number = p_order_number
  where guest.id is null or event_table.id is null;

  if invalid_count > 0 then
    raise exception 'La distribución contiene invitados o mesas inválidos.';
  end if;

  select count(*) into over_capacity_count
  from event_tables event_table
  join (
    select target.table_id, sum(target.confirmed) as occupied
    from (
      select
        coalesce(batch.table_id, guest.table_id) as table_id,
        greatest(0, coalesce(guest.confirmed, 0)) as confirmed
      from event_guests guest
      left join assignment_batch batch on batch.guest_id = guest.id
      where guest.order_number = p_order_number
        and guest.status = 'Confirmado'
        and guest.archived_at is null
        and coalesce(batch.table_id, guest.table_id) is not null
    ) target
    group by target.table_id
  ) occupancy on occupancy.table_id = event_table.id
  where event_table.order_number = p_order_number
    and occupancy.occupied > event_table.capacity;

  if over_capacity_count > 0 then
    raise exception 'La distribución supera la capacidad de una o más mesas.';
  end if;

  update event_guests guest
  set table_id = batch.table_id, updated_at = now()
  from assignment_batch batch
  where guest.id = batch.guest_id
    and guest.order_number = p_order_number
    and guest.status = 'Confirmado'
    and guest.archived_at is null;

  return assignment_count;
end;
$$;

revoke all on function public.assign_event_guests_batch(text, jsonb) from public;
grant execute on function public.assign_event_guests_batch(text, jsonb) to service_role;
