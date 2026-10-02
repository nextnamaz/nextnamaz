import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

function envFromFile(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync('.env.local')) return out;
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const [, name, value] = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim()) ?? [];
    // An empty value is a legitimate assignment, so test it against undefined, not truthiness.
    if (name === undefined || value === undefined) continue;
    out[name] = value.replace(/^["']|["']$/g, '');
  }
  return out;
}

/** A service-role client for the suite's own screens, or null without Supabase env. */
export function serviceClient(): SupabaseClient | null {
  const env = { ...envFromFile(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
}
