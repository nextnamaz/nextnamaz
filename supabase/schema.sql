-- NextNamaz schema — no accounts, no sign-in.
--
-- One table. Each screen is a standalone display unit whose uuid doubles as
-- its secret: whoever has the settings URL (/s/<id>) can manage the screen.
-- The app talks to this table exclusively through the Next.js server using
-- the service-role key. RLS is enabled with NO policies, so the anon key
-- cannot read or write anything (this prevents enumerating screen ids via
-- the public REST API, which would leak the secret URLs).
--
-- Realtime: live phone -> TV updates use broadcast channels (screen:<id>),
-- which need no table access, so no realtime publication is required. The
-- server sends the broadcast after each save (see src/lib/actions.ts).

create table if not exists screens (
  id uuid primary key default gen_random_uuid(),
  prayer_times jsonb not null default '{
    "fajr": "05:00",
    "sunrise": "06:30",
    "dhuhr": "13:00",
    "asr": "16:30",
    "maghrib": "19:00",
    "isha": "20:30"
  }'::jsonb,
  locale text not null default 'en',
  -- per-key overrides for on-screen text (prayer names + labels); empty keys
  -- fall back to the locale's preset translations
  display_text jsonb not null default '{}'::jsonb,
  -- where times come from: manual | adhan | aladhan | vaktija_ba | vaktija_eu |
  -- islamiska_forbundet. Non-manual sources are fetched live on the TV daily;
  -- prayer_times then holds the last fetched day as an offline fallback.
  prayer_source text not null default 'manual',
  prayer_source_config jsonb not null default '{}'::jsonb,
  theme text not null default 'default',
  theme_config jsonb not null default '{}'::jsonb,
  -- physical screen fit: {rotation: 0|90|180|270, zoom: 0.8..1}. Rotation is
  -- for wall-mounted TVs whose OS can't rotate; zoom compensates overscan.
  display_config jsonb not null default '{}'::jsonb,
  -- false until the first save from the phone; the TV shows the setup QR
  -- until this flips
  configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Optional settings PIN: an scrypt hash ("scrypt$salt$hash"), never the
  -- digits. Null means anyone with the link may edit. See src/lib/pin.ts.
  pin text,

  -- Retired, still present on the live table. Nothing reads or writes it: it
  -- is not in the generated Row type and no query mentions it. Left in place
  -- deliberately: dropping a column cannot be undone and buys nothing, and
  -- this file being out of step with production is how the July data loss
  -- started. Do not resurrect it for a new feature; add a new column instead.
  name text not null default ''
);

alter table screens enable row level security;

-- Also still present from the pre-rebuild app, and likewise left alone:
--   public.profiles                     (16 rows, one per auth.users row)
--   auth.users                          (16 rows)
--   functions handle_new_user, ensure_unique_mosque_slug,
--             ensure_unique_screen_slug, invalidate_yearly_times_cache
-- The functions reference tables that no longer exist, so calling them
-- errors. They remain reachable at /rest/v1/rpc/<name> by the anon role.
-- See CLAUDE.md before removing any of it.

-- Statistics and feedback: see migrations/20260924_stats_and_feedback.sql

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
