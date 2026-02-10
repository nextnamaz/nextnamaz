import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import { z } from 'zod';

const errorSchema = z.object({
  screen_id: z.string().uuid().nullable(),
  device_id: z.string().min(1).max(100),
  error_type: z.enum(['render_crash', 'unhandled_error', 'unhandled_rejection', 'network_error']),
  message: z.string().min(1).max(2000),
  stack: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

const batchSchema = z.object({
  errors: z.array(errorSchema).min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = batchSchema.parse(body);

    const supabase = await createClient();
    const rows = parsed.errors.map((e) => ({
      ...e,
      metadata: (e.metadata ?? {}) as Json,
    }));
    const { error } = await supabase
      .from('display_error_logs')
      .insert(rows);

    if (error) {
      return NextResponse.json({ error: 'Failed to insert' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
