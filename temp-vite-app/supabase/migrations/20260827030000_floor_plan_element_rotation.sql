alter table public.event_layout_elements
  add column if not exists rotation_degrees integer not null default 0;

alter table public.event_layout_elements
  drop constraint if exists event_layout_elements_rotation_degrees_check;

alter table public.event_layout_elements
  add constraint event_layout_elements_rotation_degrees_check
  check (rotation_degrees >= -359 and rotation_degrees <= 359);
