-- Migration: Drop old tables and create new schema
-- WARNING: This drops all existing data. Run on a fresh database or backup first.

-- Drop old triggers
drop trigger if exists on_mosque_created on mosques;
drop function if exists create_mosque_settings();

-- Remove from realtime
alter publication supabase_realtime drop table if exists prayer_times;
alter publication supabase_realtime drop table if exists announcements;
alter publication supabase_realtime drop table if exists mosque_settings;

-- Drop old tables
drop table if exists announcements cascade;
drop table if exists prayer_times cascade;
drop table if exists mosque_settings cascade;
drop table if exists mosque_members cascade;
drop table if exists screens cascade;
drop table if exists mosques cascade;

-- Drop old enum if exists
drop type if exists member_role cascade;

-- Now run the new schema
-- (paste contents of schema.sql here, or run schema.sql separately)
