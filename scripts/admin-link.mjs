// Prints the private /admin link. Reads SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Must derive the key exactly like src/lib/admin-key.ts.
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
const admin = createHmac('sha256', key).update('nextnamaz:admin').digest('hex').slice(0, 32);
console.log(`https://www.nextnamaz.com/admin?key=${admin}`);
