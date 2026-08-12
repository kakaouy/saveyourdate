alter table public.event_guests
  add column if not exists social_together_with text not null default '',
  add column if not exists social_separate_from text not null default '',
  add column if not exists preferred_table_name text not null default '';
