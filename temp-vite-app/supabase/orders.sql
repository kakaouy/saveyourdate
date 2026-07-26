create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_email text not null,
  whatsapp text not null,
  plan text not null,
  model_name text not null,
  language text not null default 'es'
    check (language in ('es', 'en', 'pt')),
  payment_operation text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'payment_reported', 'payment_validated')),
  status_token_hash text unique not null,
  approval_token_hash text unique not null,
  approval_token_used_at timestamptz,
  order_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists language text not null default 'es';

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
