import { existsSync, readFileSync, rmSync } from 'node:fs';
import { serviceClient } from './db';
import { CREATED_SCREENS_FILE } from './helpers';

/** Delete exactly the screens this run created, and their uploaded media. */
export default async function globalTeardown(): Promise<void> {
  if (!existsSync(CREATED_SCREENS_FILE)) return;

  const ids = readFileSync(CREATED_SCREENS_FILE, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  rmSync(CREATED_SCREENS_FILE);
  if (ids.length === 0) return;

  const client = serviceClient();
  if (!client) {
    console.warn(`Leaving ${ids.length} test screen(s) behind: Supabase env not found.`);
    return;
  }

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
