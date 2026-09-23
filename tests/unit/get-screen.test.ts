import { beforeEach, describe, expect, it, vi } from 'vitest';

interface Result {
  data: { id: string } | null;
  error: { message: string } | null;
}

let result: Result = { data: null, error: null };

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }),
  }),
}));

const { getScreen } = await import('@/lib/screens');
const ID = '755a07f7-7ca2-4c01-9d32-27037af84eea';

describe('getScreen', () => {
  beforeEach(() => {
    result = { data: null, error: null };
  });

  it('returns the screen when it exists', async () => {
    result = { data: { id: ID }, error: null };
    await expect(getScreen(ID)).resolves.toEqual({ id: ID });
  });

  it('returns null only when the screen does not exist', async () => {
    await expect(getScreen(ID)).resolves.toBeNull();
  });

  // A TV that reads a passing error as "deleted" forgets its screen and falls back to setup.
  it('throws on a database error instead of reporting the screen gone', async () => {
    result = { data: null, error: { message: 'connection timeout' } };
    await expect(getScreen(ID)).rejects.toThrow('connection timeout');
  });

  it('returns null for a malformed id without asking the database', async () => {
    await expect(getScreen('not-an-id')).resolves.toBeNull();
  });
});
