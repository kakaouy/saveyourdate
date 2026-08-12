alter table public.event_guests
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_opened_at timestamptz,
  add column if not exists responded_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists transport_option text not null default '',
  add column if not exists transport_stop text not null default '',
  add column if not exists menu_choice text not null default '',
  add column if not exists accessibility_needs text not null default '',
  add column if not exists guest_notes text not null default '';

create index if not exists event_guests_invitation_followup_idx
  on public.event_guests(order_number, status, invitation_sent_at, invitation_opened_at);

create index if not exists event_guests_active_idx
  on public.event_guests(order_number, created_at)
  where archived_at is null;
