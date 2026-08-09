alter table public.event_tables
  add column if not exists layout_width integer not null default 140,
  add column if not exists layout_height integer not null default 70;

create table if not exists public.event_layout_elements (
  id uuid primary key default gen_random_uuid(),
  order_number text not null references public.orders(order_number) on delete cascade,
  element_type text not null default 'custom' check (element_type in ('entrance', 'dance-floor', 'gourmet', 'hydration', 'custom')),
  label text not null,
  space_name text not null default 'Espacio 1',
  position_x integer not null default 40,
  position_y integer not null default 90,
  element_width integer not null default 150,
  element_height integer not null default 80,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_layout_elements_order_number_idx
  on public.event_layout_elements(order_number);

alter table public.event_layout_elements enable row level security;
