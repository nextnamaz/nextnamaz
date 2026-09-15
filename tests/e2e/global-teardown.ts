import { existsSync, readFileSync, rmSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { CREATED_SCREENS_FILE } from './helpers';

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

/** Delete exactly the screens this run created, and their uploaded media. */
export default async function globalTeardown(): Promise<void> {
  if (!existsSync(CREATED_SCREENS_FILE)) return;

  const ids = readFileSync(CREATED_SCREENS_FILE, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  rmSync(CREATED_SCREENS_FILE);
  if (ids.length === 0) return;

  const env = { ...envFromFile(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(`Leaving ${ids.length} test screen(s) behind: Supabase env not found.`);
    return;
  }

  const client = createClient(url, key);
  for (const id of ids) {
    const { data } = await client.storage.from('slides').list(id);
    if (data && data.length > 0) {
      await client.storage.from('slides').remove(data.map((f) => `${id}/${f.name}`));
    }
  }
  const { error } = await client.from('screens').delete().in('id', ids);
  if (error) console.warn(`Could not delete test screens: ${error.message}`);
  else console.log(`Cleaned up ${ids.length} test screen(s).`);
}
