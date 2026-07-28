import { createAdminClient } from '@/lib/supabase/admin';

// Hit daily by Vercel Cron (see vercel.json) so the free-tier Supabase
// project always has activity and never hits the 7-day inactivity pause.
export async function GET() {
  const { error } = await createAdminClient()
    .from('screens')
    .select('id')
    .limit(1);
  return Response.json({ ok: !error });
}
