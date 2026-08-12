create table if not exists public.event_layout_spaces (
  id uuid primary key default gen_random_uuid(),
  order_number text not null references public.orders(order_number) on delete cascade,
  space_name text not null,
  canvas_width integer not null default 1200 check (canvas_width between 700 and 2400),
  canvas_height integer not null default 700 check (canvas_height between 480 and 1800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_number, space_name)
);

alter table public.event_layout_spaces enable row level security;
revoke all on public.event_layout_spaces from anon, authenticated;
grant select, insert, update, delete on public.event_layout_spaces to service_role;
