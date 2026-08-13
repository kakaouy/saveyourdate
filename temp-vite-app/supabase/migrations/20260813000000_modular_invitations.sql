create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_roles text[] not null default array['host']::text[],
  can_manage_multiple_events boolean not null default false,
  can_self_approve boolean not null default false,
  requires_platform_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_roles_valid check (
    account_roles <@ array['host', 'organizer', 'venue', 'supplier', 'platform_admin']::text[]
  )
);

alter table public.event_admins drop constraint if exists event_admins_role_check;
alter table public.event_admins add constraint event_admins_role_check
  check (role in ('admin', 'editor', 'viewer'));

alter table public.admin_activity_log drop constraint if exists admin_activity_log_actor_role_check;
alter table public.admin_activity_log add constraint admin_activity_log_actor_role_check
  check (actor_role in ('owner', 'admin', 'editor', 'viewer'));

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique(account_id, email)
);

create table if not exists public.account_modules (
  account_id uuid not null references public.accounts(id) on delete cascade,
  module text not null check (module in (
    'invitation', 'guests_rsvp', 'tables', 'check_in', 'messaging',
    'collaborative_album', 'suppliers'
  )),
  source text not null default 'plan' check (source in ('role', 'plan', 'addon', 'manual')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (account_id, module)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  order_number text unique references public.orders(order_number) on delete set null,
  owner_account_id uuid not null references public.accounts(id),
  name text not null,
  event_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_account_access (
  event_id uuid not null references public.events(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  access_role text not null default 'viewer' check (access_role in ('owner', 'admin', 'editor', 'viewer')),
  supplier_modules text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  primary key (event_id, account_id),
  constraint event_supplier_modules_valid check (
    supplier_modules <@ array[
      'invitation', 'guests_rsvp', 'tables', 'check_in', 'messaging',
      'collaborative_album', 'suppliers'
    ]::text[]
  )
);

create table if not exists public.invitation_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid unique not null references public.events(id) on delete cascade,
  template_id text not null,
  schema_version integer not null default 1,
  palette_id text not null,
  locale text not null default 'es' check (locale in ('es', 'en', 'pt')),
  workflow_status text not null default 'draft' check (workflow_status in (
    'draft', 'in_review', 'changes_requested', 'approved', 'published'
  )),
  sections jsonb not null default '[]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  approved_by_account_id uuid references public.accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invitation_revisions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitation_documents(id) on delete cascade,
  revision integer not null,
  document jsonb not null,
  created_by_account_id uuid references public.accounts(id),
  created_at timestamptz not null default now(),
  unique(invitation_id, revision)
);

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

create table if not exists public.account_resources (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  kind text not null check (kind in ('invitation_setup', 'venue', 'schedule', 'supplier', 'copy', 'gifts')),
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, kind, name)
);

create index if not exists events_owner_account_idx on public.events(owner_account_id);
create index if not exists event_account_access_account_idx on public.event_account_access(account_id);
create index if not exists invitation_documents_status_idx on public.invitation_documents(workflow_status);
create index if not exists invitation_revisions_invitation_idx on public.invitation_revisions(invitation_id, revision desc);
create index if not exists invitation_review_events_invitation_idx on public.invitation_review_events(invitation_id, created_at desc);
create index if not exists account_resources_account_idx on public.account_resources(account_id, kind, name);

alter table public.accounts enable row level security;
alter table public.account_members enable row level security;
alter table public.account_modules enable row level security;
alter table public.events enable row level security;
alter table public.event_account_access enable row level security;
alter table public.invitation_documents enable row level security;
alter table public.invitation_revisions enable row level security;
alter table public.invitation_review_events enable row level security;
alter table public.account_resources enable row level security;

revoke all on public.accounts, public.account_members, public.account_modules,
  public.events, public.event_account_access, public.invitation_documents,
  public.invitation_revisions, public.invitation_review_events from anon, authenticated;
revoke all on public.account_resources from anon, authenticated;

grant select, insert, update, delete on public.accounts, public.account_members,
  public.account_modules, public.events, public.event_account_access,
  public.invitation_documents, public.invitation_revisions,
  public.invitation_review_events to service_role;
grant select, insert, update, delete on public.account_resources to service_role;
