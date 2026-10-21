import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: () => ({ insert: async () => ({ error: null }) }) }),
}));

import { sendFeedback } from '@/lib/feedback';

interface WebhookBody {
  content: string;
  allowed_mentions: { parse: string[] };
}

afterEach(() => vi.unstubAllGlobals());

describe('sendFeedback', () => {
  it('posts to Discord without the screen id', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const screenId = '3baaa519-0000-4000-8000-000000000000';

    const result = await sendFeedback({
      message: 'The Asr time is off',
      email: 'a@b.se',
      page: '/s/:id',
      locale: 'sv',
      screenId,
      website: '',
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    const body = JSON.parse(String(init.body)) as WebhookBody;
    expect(body.content).toContain('The Asr time is off');
    expect(body.content).toContain('a@b.se');
    expect(String(init.body)).not.toContain(screenId);
    expect(body.allowed_mentions.parse).toEqual([]);
  });
});
