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

/** Store a message from the feedback form, for the owner to read on /admin. */
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
  return { ok: true };
}
