import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The key to /admin. Derived from the service-role key, so there is no second
 * secret to store, and rotating that key rotates this one. Print it with
 * `node scripts/admin-link.mjs`.
 */
export function adminKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createHmac('sha256', key).update('nextnamaz:admin').digest('hex').slice(0, 32);
}

export function isAdminKey(presented: string | undefined): boolean {
  if (!presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(adminKey());
  return a.length === b.length && timingSafeEqual(a, b);
}
