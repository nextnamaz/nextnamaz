import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminKey } from '@/lib/admin-key';
import { screenStats } from '@/lib/admin-stats';
import type { ScreenStatRow, Tally } from '@/lib/admin-stats';
import { NOINDEX_METADATA } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  ...NOINDEX_METADATA,
  // The key is in the address; never send it on to another site.
  referrer: 'no-referrer',
};

interface AdminPageProps {
  searchParams: Promise<{ key?: string | string[] }>;
}

const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Stockholm' }) : '—';

/**
 * The owner's view: how many screens and mosques, which are on air, and what
 * people wrote in. Behind a key derived from the service-role key
 * (scripts/admin-link.mjs); without it the page does not exist.
 */
export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { key } = await searchParams;
  if (!isAdminKey(typeof key === 'string' ? key : undefined)) notFound();

  const db = createAdminClient();
  const [screens, events, feedback] = await Promise.all([
    db.from('screens').select('*').order('created_at', { ascending: false }),
    db.from('screen_events').select('*').order('created_at', { ascending: false }).limit(50),
    db.from('feedback').select('*').order('created_at', { ascending: false }).limit(200),
  ]);
  const rows: ScreenStatRow[] = screens.data ?? [];
  const s = screenStats(rows);
  const migrated = !events.error && !feedback.error;

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 font-sans text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">NextNamaz in numbers</h1>

      {!migrated && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The statistics tables are not in the database yet, so activity and feedback are not being recorded.
          Apply <code>supabase/migrations/20260924_stats_and_feedback.sql</code> after a backup.
        </p>
      )}
      {screens.error && <p className="text-sm text-red-700">Could not read screens: {screens.error.message}</p>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Screens" value={s.total} />
        <Stat label="Set up (mosques)" value={s.configured} />
        <Stat label="On air, 24 h" value={s.onAirDay} />
        <Stat label="On air, 7 days" value={s.onAirWeek} />
        <Stat label="New, 7 days" value={s.newWeek} />
        <Stat label="New, 30 days" value={s.newMonth} />
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Breakdown title="Prayer source" rows={s.bySource} />
        <Breakdown title="Theme" rows={s.byTheme} />
        <Breakdown title="Screen language" rows={s.byLanguage} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Feedback ({feedback.data?.length ?? 0})</h2>
        {feedback.data?.length ? (
          <ul className="space-y-3">
            {feedback.data.map((f) => (
              <li key={f.id} className="rounded-lg border p-4">
                <p className="whitespace-pre-wrap text-[15px]">{f.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {when(f.created_at)} · {f.page ?? '—'} · {f.locale ?? '—'}
                  {f.email && (
                    <>
                      {' · '}
                      <a className="underline" href={`mailto:${f.email}`}>
                        {f.email}
                      </a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
        {events.data?.length ? (
          <Table
            head={['When', 'What', 'Screen']}
            rows={events.data.map((e) => [when(e.created_at), e.kind, e.screen_id?.slice(0, 8) ?? '—'])}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Screens</h2>
        {/* Ids cut short: the full id is the screen's password, and this page may end up in a screenshot. */}
        <Table
          head={['Screen', 'Created', 'Last on air', 'Set up', 'Source', 'Theme']}
          rows={(screens.data ?? []).map((r) => [
            r.id.slice(0, 8),
            when(r.created_at),
            when(r.last_seen_at),
            r.configured ? 'yes' : 'no',
            r.prayer_source,
            r.theme,
          ])}
        />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Tally[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.key} className="flex justify-between gap-4 border-b py-1">
            <span>{r.key}</span>
            <span className="tabular-nums text-muted-foreground">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/50 text-xs text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-2">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
