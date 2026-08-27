alter table public.event_layout_elements
  drop constraint if exists event_layout_elements_element_type_check;

alter table public.event_layout_elements
  add constraint event_layout_elements_element_type_check
  check (element_type in (
    'entrance', 'dance-floor', 'gourmet', 'hydration',
    'stage', 'dj', 'cake', 'gifts', 'buffet',
    'wall', 'door', 'window', 'column', 'stairs',
    'restroom', 'kitchen', 'emergency',
    'photo-booth', 'fountain', 'plant', 'divider', 'custom'
  ));
