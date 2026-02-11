-- NextNamaz Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum for member roles
create type member_role as enum ('owner', 'admin', 'viewer');

-- Mosques table (simple - just a name)
create table mosques (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  created_at timestamptz default now()
);

-- Mosque members (who can manage which mosque)
create table mosque_members (
  id uuid primary key default gen_random_uuid(),
  mosque_id uuid references mosques(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role member_role not null default 'owner',
  created_at timestamptz default now(),
  unique(mosque_id, user_id)
);

-- Mosque settings (shared across all screens)
create table mosque_settings (
  mosque_id uuid primary key references mosques(id) on delete cascade,
  prayer_times jsonb not null default '{"fajr":"05:00","sunrise":"06:30","dhuhr":"13:00","asr":"16:30","maghrib":"19:00","isha":"20:30"}',
  locale text not null default 'en',
  display_text jsonb not null default '{}',
  metadata jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Screens (each mosque can have multiple display screens)
create table screens (
  id uuid primary key default gen_random_uuid(),
  mosque_id uuid references mosques(id) on delete cascade not null,
  name text not null default 'Main Screen',
  slug text unique not null,
  short_code text unique not null,
  theme text not null default 'classic',
  theme_config jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_mosque_members_user_id on mosque_members(user_id);
create index idx_mosque_members_mosque_id on mosque_members(mosque_id);
create index idx_screens_mosque_id on screens(mosque_id);
create index idx_mosques_slug on mosques(slug);
create index idx_screens_slug on screens(slug);
create index idx_screens_short_code on screens(short_code);

-- Row Level Security
alter table mosques enable row level security;
alter table mosque_members enable row level security;
alter table mosque_settings enable row level security;
alter table screens enable row level security;

-- Mosques: anyone can view (for display pages)
create policy "Mosques are viewable by everyone" on mosques
  for select using (true);

create policy "Authenticated users can create mosques" on mosques
  for insert with check (auth.uid() is not null);

create policy "Members can update their mosque" on mosques
  for update using (
    exists (
      select 1 from mosque_members
      where mosque_members.mosque_id = mosques.id
      and mosque_members.user_id = auth.uid()
      and mosque_members.role in ('owner', 'admin')
    )
  );

create policy "Owners can delete their mosque" on mosques
  for delete using (
    exists (
      select 1 from mosque_members
      where mosque_members.mosque_id = mosques.id
      and mosque_members.user_id = auth.uid()
      and mosque_members.role = 'owner'
    )
  );

-- Helper functions (SECURITY DEFINER to avoid RLS recursion on mosque_members)
create or replace function get_my_mosque_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select mosque_id from mosque_members where user_id = auth.uid();
$$;

create or replace function has_mosque_role(p_mosque_id uuid, p_roles member_role[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from mosque_members
    where mosque_id = p_mosque_id
    and user_id = auth.uid()
    and role = any(p_roles)
  );
$$;

create or replace function mosque_has_no_members(p_mosque_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from mosque_members where mosque_id = p_mosque_id
  );
$$;

-- Mosque members
create policy "Members can view mosque members" on mosque_members
  for select using (
    mosque_id in (select get_my_mosque_ids())
  );

create policy "Owners and admins can add members" on mosque_members
  for insert with check (
    has_mosque_role(mosque_id, array['owner','admin']::member_role[])
    or mosque_has_no_members(mosque_id)
  );

create policy "Owners can update members" on mosque_members
  for update using (
    has_mosque_role(mosque_id, array['owner']::member_role[])
  );

create policy "Owners can delete members" on mosque_members
  for delete using (
    has_mosque_role(mosque_id, array['owner']::member_role[])
  );

-- Mosque settings: anyone can view (for display)
create policy "Settings are viewable by everyone" on mosque_settings
  for select using (true);

create policy "Members can insert settings" on mosque_settings
  for insert with check (
    exists (
      select 1 from mosque_members
      where mosque_members.mosque_id = mosque_settings.mosque_id
      and mosque_members.user_id = auth.uid()
      and mosque_members.role in ('owner', 'admin')
    )
  );

create policy "Members can update settings" on mosque_settings
  for update using (
    exists (
      select 1 from mosque_members
      where mosque_members.mosque_id = mosque_settings.mosque_id
      and mosque_members.user_id = auth.uid()
      and mosque_members.role in ('owner', 'admin')
    )
  );

-- Screens: anyone can view (for display)
create policy "Screens are viewable by everyone" on screens
  for select using (true);

create policy "Members can create screens" on screens
  for insert with check (
    exists (
      select 1 from mosque_members
      where mosque_members.mosque_id = screens.mosque_id
      and mosque_members.user_id = auth.uid()
      and mosque_members.role in ('owner', 'admin')
    )
  );

create policy "Members can update screens" on screens
  for update using (
    exists (
      select 1 from mosque_members
      where mosque_members.mosque_id = screens.mosque_id
      and mosque_members.user_id = auth.uid()
      and mosque_members.role in ('owner', 'admin')
    )
  );

create policy "Members can delete screens" on screens
  for delete using (
    exists (
      select 1 from mosque_members
      where mosque_members.mosque_id = screens.mosque_id
      and mosque_members.user_id = auth.uid()
      and mosque_members.role in ('owner', 'admin')
    )
  );

-- Realtime
alter publication supabase_realtime add table mosque_settings;
alter publication supabase_realtime add table screens;

-- Auto-generate short_code for new screens
create or replace function generate_short_code()
returns trigger as $$
declare
  new_code text;
  conflict_found boolean;
begin
  if new.short_code is not null then
    return new;
  end if;

  loop
    new_code := substr(
      replace(replace(encode(extensions.gen_random_bytes(6), 'base64'), '/', ''), '+', ''),
      1, 6
    );
    select exists(select 1 from screens where short_code = new_code) into conflict_found;
    exit when not conflict_found;
  end loop;

  new.short_code := new_code;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_screen_generate_short_code
  before insert on screens
  for each row execute function generate_short_code();

-- Auto-create mosque_settings when a mosque is created
create or replace function create_mosque_settings()
returns trigger as $$
begin
  insert into mosque_settings (mosque_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_mosque_created
  after insert on mosques
  for each row execute procedure create_mosque_settings();
