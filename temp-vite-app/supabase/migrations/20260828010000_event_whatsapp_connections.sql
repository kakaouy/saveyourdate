create table if not exists public.event_whatsapp_connections (
  order_number text primary key references public.orders(order_number) on delete cascade,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'pending', 'connected', 'error')),
  waba_id text,
  phone_number_id text,
  display_phone_number text,
  verified_name text,
  access_token_ciphertext text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  last_verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_whatsapp_connections enable row level security;

-- This table contains encrypted credentials. It is intentionally available
-- only through server-side endpoints authenticated with the service role.
revoke all on public.event_whatsapp_connections from anon, authenticated;
grant select, insert, update, delete on public.event_whatsapp_connections to service_role;

