-- NextNamaz schema — no accounts, no auth.
--
-- One table. Each screen is a standalone display unit whose uuid doubles as
-- its secret: whoever has the settings URL (/s/<id>) can manage the screen.
-- The app talks to this table exclusively through the Next.js server using
-- the service-role key. RLS is enabled with NO policies, so the anon key
-- cannot read or write anything (this prevents enumerating screen ids via
-- the public REST API, which would leak the secret URLs).
--
-- Realtime: live phone -> TV updates use broadcast channels (screen:<id>),
-- which need no table access, so no realtime publication is required.

-- Reset: remove the pre-rebuild schema if present (no-ops on a fresh project).
drop table if exists mosque_yearly_times, display_error_logs, mosque_settings,
  mosque_members, screens, mosques cascade;
drop type if exists member_role cascade;
drop function if exists get_my_mosque_ids, has_mosque_role, mosque_has_no_members,
  generate_short_code, create_mosque_settings, upsert_yearly_times cascade;

create table screens (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
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
  -- where times come from: manual | adhan | vaktija_ba | vaktija_eu |
  -- islamiska_forbundet. Non-manual sources are fetched live on the TV daily;
  -- prayer_times then holds the last fetched day as an offline fallback.
  prayer_source text not null default 'manual',
  prayer_source_config jsonb not null default '{}'::jsonb,
  theme text not null default 'default',
  theme_config jsonb not null default '{}'::jsonb,
  -- false until the first save from the phone; the TV shows the setup QR
  -- until this flips
  configured boolean not null default false,
  -- reserved for an optional per-screen 4-digit PIN (not used yet)
  pin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table screens enable row level security;
