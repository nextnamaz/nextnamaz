'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { UUID_RE } from '@/lib/screens';

const feedbackSchema = z.object({
  message: z.string().trim().min(3).max(4000),
  email: z.union([z.literal(''), z.string().trim().email().max(200)]),
  page: z.string().max(200),
  locale: z.string().max(10),
  screenId: z.string().regex(UUID_RE).nullable(),
  /** Hidden from people; a bot that fills every field fills this too. */
  website: z.string(),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;

type FeedbackResult = { ok: true } | { ok: false };

/** Posts each new message to Ismail's Discord. Low stakes: the worst a leak allows is spam. */
const DISCORD_WEBHOOK =
  'https://discord.com/api/webhooks/1562157308039921797/6eR5Gp1vSw-j83TkmX-VL3q5ODiA93Cv0dJoPZ-xJN3TZCRE6Pl7po7uwKPP8iI7kINY';

/** Never the screen id: it is the screen's password. Failure only logs, the message is already stored. */
async function notifyDiscord(message: string, email: string, page: string, locale: string): Promise<void> {
  const meta = [page, locale, email].filter(Boolean).join(' · ');
  try {
    const res = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**New feedback** (${meta})\n${message}`.slice(0, 2000),
        allowed_mentions: { parse: [] },
      }),
    });
    if (!res.ok) console.error('notifyDiscord failed:', res.status);
  } catch (err) {
    console.error('notifyDiscord failed:', err);
  }
}

/** Store a message from the feedback form, for the owner to read on /admin and in Discord. */
export async function sendFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  // A bot that filled the trap is told it worked, so it has nothing to learn.
  if (input.website) return { ok: true };
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { message, email, page, locale, screenId } = parsed.data;
  const { error } = await createAdminClient()
    .from('feedback')
    .insert({ message, email: email || null, page, locale, screen_id: screenId });
  if (error) {
    console.error('sendFeedback failed:', error.message);
    return { ok: false };
  }
  await notifyDiscord(message, email, page, locale);
  return { ok: true };
}
