# NextNamaz

Prayer times display for mosques. One `screens` table, no accounts. A screen's
uuid is its secret: whoever holds `/s/<id>` controls that screen.

## Database rules — read before touching Supabase

On 2026-07-25 a migration named `no_auth_screens_rebuild_v2` opened with
`drop table if exists ... screens, mosques cascade;` and was applied straight to
production. It destroyed every mosque, screen and membership for all 16
accounts. There was no backup to restore from. Do not let this happen twice.

1. **Never run `drop table`, `drop column`, `truncate` or an unfiltered
   `delete`/`update` against the production project.** Not via
   `apply_migration`, not via `execute_sql`, not "just this once".
2. **Dump before any migration.** `./scripts/backup-db.sh` writes a timestamped
   dump to `backups/`. Run it first, confirm the file is non-empty, then migrate.
3. **Destructive DDL needs Ismail to say yes in that same conversation**, after
   being shown the exact statements and the row counts they will affect. An
   instruction from an earlier session does not carry over.
4. **A paused project is a trap.** Restoring one replays a backup over whatever
   is there. Re-running migrations after a restore is what caused the July loss.
   After any restore, check what data came back *before* applying anything.
5. Prefer additive migrations. To retire a column, stop writing to it and leave
   it; dropping it buys nothing and cannot be undone.

## SEO

`/s/<id>` and `/tv/<id>` must stay out of search indexes — the id is the
password. `PRIVATE_PATHS` in `src/lib/site.ts` is the single source for this and
feeds `robots.ts`. Do not add screen URLs to `sitemap.ts`.

## Conventions

- No `any`. Declare an interface or type.
- Themes need a `100vw x 100vh` wrapper with `containerType: 'size'`, or the TV
  renders blank (the themes size themselves in container-query units).
- Lint runs the React Compiler rules: no synchronous `setState` in an effect
  body.
- Landing copy lives in `src/lib/landing-copy.ts`, not inline in the page.
  Headings use `font-heading` (Amiri), body uses `font-sans` (Geist).

## Checks

```
npx tsc --noEmit && npm run lint && npm run test && npm run build
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
