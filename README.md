# NextNamaz

Prayer time display for mosques. No accounts, no sign-in — a TV and a phone.

## How it works

1. **TV**: open `/s` (or press "Get Started" on the home page) and tap Start.
   The TV creates a screen with a secret id and shows a QR code.
2. **Phone**: scan the QR → lands on `/s/<id>`, the settings page for that
   screen. Set prayer times, language, and theme. Save.
3. **TV**: switches to the prayer display (`/tv/<id>`) instantly and stays in
   sync — every save on the phone broadcasts a refresh to the TV.

The settings URL is the key: bookmark it to manage the screen from anywhere,
forever. Wiggle the mouse (or press any remote key) on the TV to bring the QR
back, or to start over with a new screen.

## Stack

Next.js 16 · Supabase (Postgres + Realtime broadcast) · Tailwind CSS 4 · Vercel

All database access goes through the Next.js server with the service-role key.
The `screens` table has RLS enabled with no policies, so the public anon key
can't read or write anything — possession of a screen's uuid is the only
credential. The anon key is used solely for realtime broadcast channels.

## Themes

Themes live in `src/components/display/themes/` and are listed in
`THEME_REGISTRY`. Each exports a component plus a definition describing its
configurable fields. Themes size themselves against the whole viewport, so they
must render inside a container with `container-type: size` and a real width and
height — the settings thumbnails do this by rendering the theme at stage size
and scaling it down with a CSS transform.

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # add your Supabase keys
npm run dev
```

Create a Supabase project and run `supabase/schema.sql` in the SQL editor.

## Tests

```bash
npm test          # unit + hook tests (vitest, jsdom)
npm run test:e2e  # end-to-end tests (playwright)
```

Unit tests live in `tests/unit/` and cover the logic a wrong answer would ruin
a prayer display with: the blackout schedule, the announcement slideshow's
timing, the JSONB coercion that stands between raw database rows and the TV,
the save-payload validation, city matching, locale text and every prayer-time
source. They use fake timers and stubbed fetches, so they are fast and
deterministic — no network, no wall-clock dependency.

End-to-end tests in `tests/e2e/` drive the real app in Chrome against the real
database: pairing a TV, the three-step wizard, saving settings, uploading an
announcement, and the rotated display. They run serially on their own port
(`E2E_PORT`, default 3100), and a teardown deletes exactly the screens and
uploads the run created. The browser-side geocoder is stubbed and the wizard
picks the local astronomical source, so no third-party API is called.

## Author

**Ismail Sacic** — [LinkedIn](https://www.linkedin.com/in/ismailsacic)

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
