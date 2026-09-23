# NextNamaz

Prayer times for the mosque TV, set up from your phone. Free, open source, no
accounts: a TV with a browser and a phone are all it takes.

**[www.nextnamaz.com](https://www.nextnamaz.com)**

## How it works

1. **TV**: open `nextnamaz.com/s` in the TV's browser and press Start. The TV
   creates a screen with a secret id and shows a QR code.
2. **Phone**: scan the code. It opens `/s/<id>`, that screen's settings, and a
   short setup: where the times come from, the language, the look, and an
   optional PIN.
3. **TV**: switches to the prayer display (`/tv/<id>`) within seconds of
   saving, and stays in sync: every save on the phone broadcasts a refresh.

The settings link is the key. Keep it to change the screen from anywhere. On
the TV, move the mouse or press a key to bring the code back. A small code
also shows in a corner for a while after each prayer, so someone in the room
can reach the settings on a TV with no remote (it can be switched off).

## What a screen can do

- **Times from a real source**: Vaktija.ba (Bosnia and Herzegovina),
  Vaktija.eu (cities in 17 European countries), Islamiska Förbundet (Sweden),
  AlAdhan (national calculation conventions), or a local astronomical
  calculation. The setup suggests the best fit for the city. Times refresh
  every day; if a source is down, the last good day is shown.
- **Nine languages** on the display: English, Arabic, Bosnian, Swedish,
  Turkish, Urdu, German, French and Spanish, with Arabic and Urdu right to
  left. The prayer names and the display's headings can be renamed.
- **Two themes**: Default (light or dark, six colour schemes) and Night.
- **A dark screen during prayer**, with only a clock, for 5 to 45 minutes from
  each prayer's start.
- **Announcements**: up to 12 images or muted videos, shown full screen or
  beside the times between prayers.
- **Any mounting**: landscape or portrait, rotated, and zoomed out for TVs
  that crop the edges.
- **An optional PIN** on the settings.

## Stack

Next.js 16 · Supabase (Postgres + Realtime broadcast) · Tailwind CSS 4 · Vercel

All database access goes through the Next.js server with the service-role key.
The `screens` table has RLS enabled with no policies, so the public anon key
can't read or write anything: possession of a screen's uuid is the only
credential. The anon key is used solely for realtime broadcast channels.

## Themes

Themes live in `src/components/display/themes/` and are listed in
`THEME_REGISTRY`. Each exports a component plus a definition describing its
configurable fields. Themes size themselves against the whole viewport, so they
must render inside a container with `container-type: size` and a real width and
height. The settings thumbnails do this by rendering the theme at stage size
and scaling it down with a CSS transform.

## The landing page

`src/app/page.tsx` composes the sections in `src/components/landing/`. All of
its words live in `src/lib/landing-copy.ts`. Every TV on the page runs the
real Default theme, on the visitor's clock with sample times. The photographs
in `public/landing/` are from Unsplash, under the Unsplash License; each is
credited in the component that uses it.

## Getting started

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
timing, which row the display highlights, the JSONB coercion that stands
between raw database rows and the TV, the save-payload validation, city
matching, locale text and every prayer-time source. They use fake timers and
stubbed fetches, so they are fast and deterministic: no network, no wall-clock
dependency.

End-to-end tests in `tests/e2e/` drive the real app in Chrome against the real
database: pairing a TV, the setup wizard, saving settings, uploading an
announcement, and the rotated display. They run serially on their own port
(`E2E_PORT`, default 3100), and a teardown deletes exactly the screens and
uploads the run created. The browser-side geocoder is stubbed and the wizard
picks the local astronomical source, so no third-party API is called.

## Author

**Ismail Sacic**: [ismail.sacic.dev](https://ismail.sacic.dev/) ·
[LinkedIn](https://www.linkedin.com/in/ismail-sacic)

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
