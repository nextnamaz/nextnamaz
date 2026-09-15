import { describe, expect, it } from 'vitest';
import {
  PIN_LOCKOUT_MS,
  PIN_MAX_ATTEMPTS,
  clearPinFailures,
  hashPin,
  isUnlocked,
  pinLockedFor,
  recordPinFailure,
  unlockCookieName,
  unlockToken,
  verifyPin,
} from '@/lib/pin';
import { PIN_RE } from '@/lib/screen-settings';

// secret() reads this lazily, so setting it after the imports is fine.
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'unit-test-secret';

const ID = '11111111-2222-4333-8444-555555555555';

describe('PIN_RE', () => {
  it('accepts four to eight digits and nothing else', () => {
    for (const ok of ['1234', '00000000', '4711']) expect(PIN_RE.test(ok)).toBe(true);
    for (const bad of ['123', '123456789', '12a4', ' 1234', '', '١٢٣٤']) expect(PIN_RE.test(bad)).toBe(false);
  });
});

describe('hashPin / verifyPin', () => {
  it('stores a salted scrypt hash, never the digits', () => {
    const stored = hashPin('2468');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(stored).not.toContain('2468');
    expect(hashPin('2468')).not.toBe(stored);
  });

  it('verifies the right PIN and refuses everything else', () => {
    const stored = hashPin('2468');
    expect(verifyPin('2468', stored)).toBe(true);
    expect(verifyPin('2469', stored)).toBe(false);
    expect(verifyPin('', stored)).toBe(false);
  });

  it('refuses malformed stored values instead of throwing', () => {
    for (const junk of ['', 'plain', 'scrypt$', 'scrypt$salt', 'md5$a$b']) {
      expect(verifyPin('2468', junk)).toBe(false);
    }
  });
});

describe('unlock token', () => {
  it('is bound to the screen and to the hash, so a changed PIN invalidates it', () => {
    const a = hashPin('1111');
    const b = hashPin('2222');
    expect(unlockToken(ID, a)).toBe(unlockToken(ID, a));
    expect(unlockToken(ID, a)).not.toBe(unlockToken(ID, b));
    expect(unlockToken(ID, a)).not.toBe(unlockToken('99999999-2222-4333-8444-555555555555', a));
    expect(unlockToken(ID, a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('isUnlocked: no PIN means open; otherwise only the matching cookie', () => {
    const stored = hashPin('1111');
    const jar = new Map<string, string>();
    const get = (n: string) => jar.get(n);
    expect(isUnlocked(ID, null, get)).toBe(true);
    expect(isUnlocked(ID, stored, get)).toBe(false);
    jar.set(unlockCookieName(ID), 'not-a-token');
    expect(isUnlocked(ID, stored, get)).toBe(false);
    jar.set(unlockCookieName(ID), unlockToken(ID, stored));
    expect(isUnlocked(ID, stored, get)).toBe(true);
    // The PIN changes: every browser holding the old token is out.
    expect(isUnlocked(ID, hashPin('1111'), get)).toBe(false);
  });
});

describe('guess limiting', () => {
  it('locks the screen for a minute after five misses, then forgets', () => {
    const id = 'aaaaaaaa-2222-4333-8444-555555555555';
    const t0 = 1_000_000;
    clearPinFailures(id);
    expect(pinLockedFor(id, t0)).toBe(0);
    for (let i = 0; i < PIN_MAX_ATTEMPTS - 1; i += 1) recordPinFailure(id, t0);
    expect(pinLockedFor(id, t0)).toBe(0);
    recordPinFailure(id, t0);
    expect(pinLockedFor(id, t0)).toBe(PIN_LOCKOUT_MS);
    expect(pinLockedFor(id, t0 + PIN_LOCKOUT_MS)).toBe(0);
    recordPinFailure(id, t0);
    clearPinFailures(id);
    expect(pinLockedFor(id, t0)).toBe(0);
  });
});
