import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Optional PIN on a screen's settings.
 *
 * A screen's URL is its secret; the PIN is a second one for mosques that
 * hand the link around. Nothing here imports from Next, so it can be tested
 * without a request in flight; the server actions supply the cookie jar.
 *
 * Storage: `scrypt$<salt>$<hash>` in screens.pin, never the digits.
 * Proof: an HMAC over the id and that stored hash, held in an httpOnly
 * cookie. Binding it to the hash means changing the PIN invalidates every
 * browser that knew the old one, with no server-side session to keep.
 */

const KEY_LEN = 32;

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(pin, salt, KEY_LEN).toString('hex')}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const candidate = scryptSync(pin, salt, KEY_LEN);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return key;
}

/** What a browser holds once it has entered the right PIN. */
export function unlockToken(id: string, storedHash: string): string {
  return createHmac('sha256', secret()).update(`unlock:${id}:${storedHash}`).digest('hex');
}

export function unlockCookieName(id: string): string {
  return `nn_unlock_${id.slice(0, 8)}`;
}

export const UNLOCK_MAX_AGE_S = 60 * 60 * 24 * 30;

export function unlockCookie(id: string, storedHash: string) {
  return {
    name: unlockCookieName(id),
    value: unlockToken(id, storedHash),
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: `/s/${id}`,
    maxAge: UNLOCK_MAX_AGE_S,
  };
}

/**
 * Whether this request may edit the screen. `getCookie` is whatever reads the
 * request's cookies; keeping it a function is what keeps Next out of here.
 */
export function isUnlocked(
  id: string,
  storedHash: string | null,
  getCookie: (name: string) => string | undefined
): boolean {
  if (!storedHash) return true;
  const presented = getCookie(unlockCookieName(id));
  if (!presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(unlockToken(id, storedHash));
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- Guessing ---------------------------------------------------------------
// A four-digit PIN has ten thousand values, so guessing has to cost something.
// Five misses buy a minute. The counter is per server instance, which on a
// serverless host means it is not airtight; it is a speed bump, and it turns
// an afternoon of guessing into a week of it.

export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 60_000;

const attempts = new Map<string, { misses: number; lockedUntil: number }>();

/** Milliseconds until this screen accepts another try; 0 when it does now. */
export function pinLockedFor(id: string, now = Date.now()): number {
  const a = attempts.get(id);
  return a && a.lockedUntil > now ? a.lockedUntil - now : 0;
}

export function recordPinFailure(id: string, now = Date.now()): void {
  const a = attempts.get(id) ?? { misses: 0, lockedUntil: 0 };
  a.misses += 1;
  if (a.misses >= PIN_MAX_ATTEMPTS) {
    a.lockedUntil = now + PIN_LOCKOUT_MS;
    a.misses = 0;
  }
  attempts.set(id, a);
}

export function clearPinFailures(id: string): void {
  attempts.delete(id);
}
