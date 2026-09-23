/**
 * Landing page copy. English only, the multi-language translations that live
 * in src/lib/locale are for what a screen displays, not for this page.
 *
 * House rule for this file: no em dashes or en dashes in any string. Use a
 * comma, a colon, or a full stop. It is the single most recognisable tell of
 * machine-written copy.
 *
 * Every claim below was checked against the code. Before adding one, check it
 * too: see the notes on iqamah, offline and manual times in the review that
 * came with this draft.
 */
export const LANDING_COPY = {
  nav: {
    howItWorks: 'How it works',
    features: 'Features',
    faq: 'Questions',
    getStarted: 'Set up a screen',
    /** Accessible name for the logo link. */
    home: 'NextNamaz home',
  },

  hero: {
    titleLine1: 'Prayer times on',
    titleLine2: "your mosque's TV.",
    /** Says what it is in the headline; the subtitle answers how, and the real question: is it an app, an account, a box. */
    subtitle:
      'Set it up from your phone in two minutes. Open a web page on the TV, scan the code, choose your city, and the times appear. No app, no account, no special box.',
    cta: 'Set up a screen',
    secondary: 'See how it works',
    /** Text alternative for the demo TV, which is drawn, not described. */
    demoAlt: "A TV showing the prayer times display: the clock, today's prayer times and a countdown to the next prayer",
  },

  oldWay: {
    title: 'No more swapping the timetable by hand',
    body: 'In many mosques the times live on a printed sheet by the mihrab and a clock on the wall, and someone has to change the sheet every month. NextNamaz loads the new times each night, so the screen is right every morning without anyone touching it.',
    imageAlt: 'A wall clock and a printed monthly timetable beside the mihrab of a small mosque',
    /** The caption on the photograph. */
    before: 'Today in many mosques',
  },

  howItWorks: {
    title: 'Set up in three steps',
    subtitle: 'If you can scan a QR code, you can do this. It takes about two minutes.',
    steps: [
      {
        /** The address lives in the body; as a headline it read like a glitch. */
        title: 'Open the page on the TV',
        description:
          "In the TV's web browser, go to nextnamaz.com/s and press Start. The TV makes a new screen for itself and shows a QR code.",
        detail: 'Smart TV, streaming stick, laptop or Raspberry Pi',
        sceneAlt: 'A TV on a wall showing nextnamaz.com/s in its browser with Start selected, and a remote in front of it',
      },
      {
        title: 'Scan the code with your phone',
        description:
          "Point your phone's camera at the code. It opens the settings for that one screen, right in your phone's browser.",
        detail: 'No app to install',
        sceneAlt: 'The TV showing a QR code, and a phone held up to it with the code framed in its camera',
      },
      {
        title: 'Choose, save, done',
        description:
          'Pick your city and where the times come from, then a language and a look, and a PIN if you want one. Save, and within seconds the TV shows your prayer times.',
        detail: 'Keep the link to change things later',
        sceneAlt: "The TV showing today's prayer times, and a phone on the last setup step with Turn on the display pressed",
      },
    ],
  },

  display: {
    title: 'What the room sees',
    subtitle:
      'This is the real display, in its Classic colours. Here is what each part does.',
    /** Label for a language switch on the demo screen. */
    languagesLabel: 'The same screen in nine languages',
    languagesNote: 'Prayer names and labels change with the language. The times stay the same, and each screen has its own language.',
    callouts: [
      {
        title: 'Clock and date',
        body: "The time to the second and today's date, large enough to read across the hall.",
      },
      {
        title: "Today's times",
        body: 'Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha. Times that have passed today are ticked off. After Isha the ticks clear and Fajr is next.',
      },
      {
        title: 'The time we are in now',
        body: 'Whichever time began most recently stays highlighted until the next one starts. Between sunrise and Dhuhr, that is sunrise.',
      },
      {
        title: 'Next prayer and countdown',
        body: 'The next prayer, its time, and a countdown that turns amber at 15 minutes and red at 5.',
      },
      {
        title: 'Your own line',
        body: "A line of your own along the bottom: a verse, a greeting, or the mosque's name.",
      },
    ],
    /** Optional: one line under the demo about the other looks. */
    themesNote:
      'Two looks to start from: Default, in light or dark with six colour schemes, and Night, a dark board with a single accent colour.',
  },

  features: {
    title: 'Made for how a mosque runs',
    subtitle: 'Everything is set from a phone. Nothing is installed on the TV.',
    imageAlt: 'The prayer hall of Cambridge Central Mosque, its timber columns branching into the ceiling',
    /** Names under the two televisions in the 'Change it from your phone' drawing. */
    rooms: { womens: "Women's section", main: 'Main hall' },
    /** The sample poster in the announcements drawing. */
    poster: {
      kicker: 'Every Saturday',
      title: "Qur'an classes for children",
      details: '10:00 to 12:00, ages 6 to 14',
      action: 'Sign up at the office',
    },
    items: [
      {
        title: 'Times from the source you use',
        body: 'Vaktija.ba for Bosnia, Vaktija.eu for cities in 17 European countries, Islamiska Förbundet for Sweden, AlAdhan worldwide, or a calculation for your location. New times load every day.',
      },
      {
        title: 'Change it from your phone',
        body: "Set up the main hall and the women's section separately. Each screen has its own link: open it on your phone, change anything, and that TV updates within seconds.",
      },
      {
        title: 'If the internet drops',
        body: "The clock, countdown and today's times keep running. Changes and tomorrow's times arrive when it reconnects. After a power cut, it needs internet to start.",
      },
      {
        title: 'A dark screen for prayer',
        body: "Let the screen go black with only a clock for 5 to 45 minutes from each prayer's start time, so nothing on the wall catches the eye.",
      },
      {
        title: 'Announcements between times',
        body: 'Upload up to 12 posters or short videos. As often as you choose, from every minute to once an hour, the TV shows them full screen or beside the times, then goes back. Videos play without sound.',
      },
      {
        title: 'Fits the TV you have',
        body: 'Landscape or portrait, rotated for a TV mounted on its side, and zoomed out for sets that cut off the edges of the picture.',
      },
      {
        title: 'Nine languages, your own words',
        body: 'English, Arabic, Bosnian, Swedish, Turkish, Urdu, German, French and Spanish, with Arabic and Urdu right to left. Rename the prayers and headings to match how your community says them.',
      },
      {
        title: 'A code to reach the settings, and a PIN',
        body: 'From 10 to 25 minutes after each prayer, a small code shows in a corner so someone in the room can open the settings. You can switch it off, and an optional PIN limits who can change anything.',
      },
      {
        title: 'Free, for good',
        body: 'No price, no plan, no ads and nothing to renew. Set up as many screens as your mosque has walls.',
      },
      {
        title: 'Open source',
        body: 'Every line of code is public on GitHub under the AGPL. Read how it works, suggest a change, or run your own copy.',
      },
    ],
  },

  devices: {
    title: 'Runs on what you already have',
    body: 'Anything with an up-to-date web browser and an internet connection can be the display. If your TV has no browser, or its browser is out of date, plug in a small stick or an old laptop.',
    items: [
      'A smart TV with a web browser',
      'A Fire TV Stick or another streaming stick with a browser',
      "A Raspberry Pi or mini PC on the TV's HDMI port",
      'An old laptop plugged into the TV',
      'A tablet on a stand, in portrait or landscape',
    ],
  },

  faq: {
    title: 'Questions mosques ask',
    items: [
      {
        q: 'What does it cost, and do we need an account?',
        a: 'Nothing, and no. There is no subscription, no sign-up, no email and no password. Each screen gets its own private link when you set it up, and that link is how you reach its settings.',
      },
      {
        q: 'What do we need to buy?',
        a: "Often nothing. You need a TV or monitor with a web browser and an internet connection. A recent smart TV's own browser usually works. If the page stays blank or looks broken, that browser is too old: plug in a streaming stick with a browser, a Raspberry Pi or an old laptop. There is no special box.",
      },
      {
        q: 'What happens if the internet goes down, or the power?',
        a: "If the internet drops, the clock, countdown and today's times keep running, and your changes arrive once it is back. After a power cut the page needs internet to load again. The TV remembers its screen, so opening nextnamaz.com/s brings your display straight back.",
      },
      {
        q: 'Where do the times come from, and are they right?',
        a: "From the source you pick: Vaktija.ba, Vaktija.eu, Islamiska Förbundet, AlAdhan, or a calculation with the method and Asr timing you choose. Setup suggests the best fit for your city and shows today's times first, so you can check them against your usual timetable.",
      },
      {
        q: 'Can we change things later?',
        a: 'Whenever you like. Open the settings link on any phone or computer, change the source, language, look or announcements, and save. The TV updates within seconds. If you lose the link, move the mouse or press a key on the TV to bring its code back.',
      },
      {
        q: 'Who can change our screen?',
        a: 'Anyone who has its link, or who scans its code on the TV. Treat the link like a key and share it only with people you trust. For more control, add a PIN of 4 to 8 digits. A forgotten PIN cannot be reset, so write it down.',
      },
      {
        q: 'We have more than one room. Can each have a screen?',
        a: "Yes. Set up each TV on its own and each gets its own link, times, language and look. The main hall can show Turkish and the women's section English, each with its own announcements.",
      },
      {
        q: 'Which languages can the screen show?',
        a: "Nine: English, Arabic, Bosnian, Swedish, Turkish, Urdu, German, French and Spanish. Arabic and Urdu read right to left. You can rename every prayer and heading on the display. The settings page on your phone, the setup screens on the TV and the small 'Scan to manage' caption are in English.",
      },
      {
        q: "Can it show iqamah, Jumu'ah or the Hijri date?",
        a: "Not yet. The screen shows when each prayer begins, plus sunrise, taken from the source you choose. Iqamah times, a Jumu'ah time, the Hijri date and typing in your own times are not available at the moment. The clock is 24-hour and the date reads day/month/year.",
      },
      {
        q: 'What data do you keep?',
        a: "Each screen stores its settings, its city or coordinates, a scrambled copy of its PIN if you set one, and any images or videos you upload. Uploaded files can be opened by anyone who has their web address, so don't upload anything private. City search and 'Use my location' ask Open-Meteo and BigDataCloud to look up the place. Page visits are counted anonymously with Vercel Web Analytics. There are no accounts, so no names, emails or passwords.",
      },
    ],
  },

  openSource: {
    title: 'Free forever, and open source',
    body: 'NextNamaz is free to use, with no ads. The full code is on GitHub under the AGPL-3.0 licence, so any mosque, developer or community can read how it works, suggest changes, or run its own copy.',
    link: {
      label: 'Read the code on GitHub',
      href: 'https://github.com/nextnamaz/nextnamaz',
    },
  },

  cta: {
    title: 'Set up your first screen',
    subtitle: 'It takes about two minutes, and you can change everything later. Stand by the TV with your phone in hand.',
    button: 'Set up a screen',
    /** Three short points under the button. */
    points: ['Free, forever', 'Open source', 'No account needed'],
  },

  footer: {
    tagline: 'Prayer times for the mosque TV, set up from your phone.',
    product: {
      heading: 'Product',
      links: {
        getStarted: 'Set up a screen',
        howItWorks: 'How it works',
        features: 'Features',
        faq: 'Questions',
      },
    },
    project: {
      heading: 'Project',
      links: {
        source: 'Source code',
        license: 'Licence',
      },
    },
    /** Accessible names for the icon-only links. */
    social: { github: 'NextNamaz on GitHub', linkedin: 'Ismail Sacic on LinkedIn' },
    madeBy: {
      label: 'Built by Ismail Sacic',
      href: 'https://ismail.sacic.dev/',
    },
    /** Rendered as `© {year} ` followed by this line. */
    copyright: 'Ismail Sacic. NextNamaz is free software.',
    license:
      'You may use, study, share and change it under the GNU Affero General Public License, version 3.',
    /** Small print. The providers are named on this page, so say plainly that we are not them. */
    timesNote:
      'Prayer times come from the source chosen for each screen, or are calculated for its location. NextNamaz is not affiliated with the timetable providers it can show.',
  },
} as const;
