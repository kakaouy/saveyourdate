alter table public.event_tables
  drop constraint if exists event_tables_table_shape_check;

alter table public.event_tables
  add constraint event_tables_table_shape_check
  check (table_shape in ('round', 'rectangular', 'square', 'living'));
