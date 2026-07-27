create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_email text not null,
  whatsapp text not null,
  default_phone_country_code text not null default '+598',
  plan text not null,
  model_name text not null,
  language text not null default 'es'
    check (language in ('es', 'en', 'pt')),
  payment_operation text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'payment_reported', 'payment_validated', 'published')),
  status_token_hash text unique not null,
  approval_token_hash text unique not null,
  approval_token_used_at timestamptz,
  invitation_url text,
  sheet_url text,
  delivered_at timestamptz,
  order_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists language text not null default 'es';

alter table public.orders
  add column if not exists default_phone_country_code text not null default '+598';

alter table public.orders
  add column if not exists invitation_url text,
  add column if not exists sheet_url text,
  add column if not exists delivered_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending_payment', 'payment_reported', 'payment_validated', 'published'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_language_check'
  ) then
    alter table public.orders
      add constraint orders_language_check
      check (language in ('es', 'en', 'pt'));
  end if;
end
$$;

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

alter table public.orders enable row level security;

revoke all on public.orders from anon, authenticated;

grant select, insert, update on public.orders to service_role;

create table if not exists public.admin_login_codes (
  id uuid primary key default gen_random_uuid(),
  order_number text not null references public.orders(order_number) on delete cascade,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_codes_order_idx
  on public.admin_login_codes(order_number, created_at desc);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  order_number text not null references public.orders(order_number) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_token_idx
  on public.admin_sessions(token_hash);

alter table public.admin_login_codes enable row level security;
alter table public.admin_sessions enable row level security;

revoke all on public.admin_login_codes, public.admin_sessions from anon, authenticated;
grant select, insert, update on public.admin_login_codes, public.admin_sessions to service_role;

create table if not exists public.event_guests (
  id uuid primary key default gen_random_uuid(),
  invite_token uuid unique not null default gen_random_uuid(),
  order_number text not null references public.orders(order_number) on delete cascade,
  name text not null,
  group_name text not null default '',
  email text not null default '',
  phone text not null default '',
  phone_country_code text not null default '+598',
  seats integer not null default 1 check (seats between 1 and 20),
  confirmed integer not null default 0 check (confirmed between 0 and 20),
  status text not null default 'Pendiente'
    check (status in ('Confirmado', 'Pendiente', 'No asiste')),
  food text not null default '—',
  song text not null default '—',
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_guests
  add column if not exists invite_token uuid unique not null default gen_random_uuid();

alter table public.event_guests
  add column if not exists phone_country_code text not null default '+598';

create index if not exists event_guests_order_idx
  on public.event_guests(order_number, created_at);

alter table public.event_guests enable row level security;
revoke all on public.event_guests from anon, authenticated;
grant select, insert, update, delete on public.event_guests to service_role;

create table if not exists public.event_tables (
  id uuid primary key default gen_random_uuid(),
  order_number text not null references public.orders(order_number) on delete cascade,
  name text not null,
  capacity integer not null default 8 check (capacity between 1 and 30),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_tables_order_idx
  on public.event_tables(order_number, created_at);

alter table public.event_guests
  add column if not exists table_id uuid references public.event_tables(id) on delete set null;

create index if not exists event_guests_table_idx
  on public.event_guests(table_id);

alter table public.event_tables enable row level security;
revoke all on public.event_tables from anon, authenticated;
grant select, insert, update, delete on public.event_tables to service_role;
