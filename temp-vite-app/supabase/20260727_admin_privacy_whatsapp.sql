begin;

create table if not exists public.event_deletion_receipts (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  reason text not null check (reason in ('owner_request', 'retention_expired')),
  event_date date,
  deleted_at timestamptz not null default now()
);

create index if not exists event_deletion_receipts_order_idx
  on public.event_deletion_receipts(order_number, deleted_at desc);

alter table public.event_deletion_receipts enable row level security;
revoke all on public.event_deletion_receipts from anon, authenticated;
grant select, insert on public.event_deletion_receipts to service_role;

create index if not exists event_guests_order_status_idx
  on public.event_guests(order_number, status, created_at);

create index if not exists event_guests_pending_reminder_idx
  on public.event_guests(order_number, reminded_at, created_at)
  where status = 'Pendiente';

create index if not exists admin_sessions_active_order_idx
  on public.admin_sessions(order_number, login_email)
  where revoked_at is null;

create table if not exists public.whatsapp_message_log (
  id uuid primary key default gen_random_uuid(),
  order_number text not null references public.orders(order_number) on delete cascade,
  guest_id uuid references public.event_guests(id) on delete set null,
  message_id text unique not null,
  status text not null default 'accepted'
    check (status in ('accepted', 'sent', 'delivered', 'read', 'failed')),
  status_at timestamptz not null default now(),
  error_detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_message_order_idx
  on public.whatsapp_message_log(order_number, created_at desc);

alter table public.whatsapp_message_log enable row level security;
revoke all on public.whatsapp_message_log from anon, authenticated;
grant select, insert, update on public.whatsapp_message_log to service_role;

commit;
