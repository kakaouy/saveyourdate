-- Incremental migration for installations that already applied the modular invitation schema.
create table if not exists public.invitation_review_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitation_documents(id) on delete cascade,
  action text not null check (action in ('submitted', 'changes_requested', 'approved', 'published')),
  comment text,
  actor_type text not null default 'account' check (actor_type in ('account', 'platform')),
  created_by_account_id uuid references public.accounts(id),
  created_at timestamptz not null default now(),
  constraint invitation_review_comment_required check (
    action <> 'changes_requested' or length(trim(coalesce(comment, ''))) > 0
  )
);

create index if not exists invitation_review_events_invitation_idx
  on public.invitation_review_events(invitation_id, created_at desc);

alter table public.invitation_review_events enable row level security;
revoke all on public.invitation_review_events from anon, authenticated;
grant select, insert, update, delete on public.invitation_review_events to service_role;
