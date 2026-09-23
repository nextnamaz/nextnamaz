-- Statistics and feedback. ADDITIVE ONLY: one new column, two new tables.
-- Nothing is dropped, renamed or rewritten. Take ./scripts/backup-db.sh first.

-- When the TV last loaded its display. Written at most every 10 minutes per
-- screen, so "active today" and "active this week" can be counted.
alter table screens add column if not exists last_seen_at timestamptz;

-- What happened to a screen and when: created, configured (first save), saved.
create table if not exists screen_events (
  id bigint generated always as identity primary key,
  screen_id uuid references screens(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists screen_events_created_at_idx on screen_events (created_at desc);
alter table screen_events enable row level security;

-- Messages sent from the feedback form. The email is optional (for a reply).
create table if not exists feedback (
  id bigint generated always as identity primary key,
  message text not null,
  email text,
  page text,
  locale text,
  screen_id uuid references screens(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_at_idx on feedback (created_at desc);
alter table feedback enable row level security;

-- RLS on with no policies, like screens: only the server's service role reads
-- or writes these tables; the public anon key cannot touch them.
