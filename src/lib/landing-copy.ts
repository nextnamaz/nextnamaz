/**
 * Landing page copy. English only, the multi-language translations that live
 * in src/lib/locale are for what a screen displays, not for this page.
 *
 * House rule for this file: no em-dashes or en-dashes in any string. Use a
 * comma, a colon, or a full stop. It is the single most recognisable tell of
 * machine-written copy.
 */
export const LANDING_COPY = {
  nav: {
    getStarted: 'Set up a screen',
  },
  hero: {
    title: 'Put prayer times',
    titleBreak: 'on your mosque TV.',
    /**
     * Twenty words, and the first three answer the question people actually
     * have: is this an app, a box, a subscription? It is a web page.
     */
    subtitle:
      "It's a web page. Open it on the TV, scan the code with your phone, done. No app, no account.",
    cta: 'Set up a screen',
    examples: 'How it works',
  },
  howItWorks: {
    title: 'Three steps.',
    subtitle: 'If you can scan a QR code, you can do this.',
    steps: [
      {
        /** The address itself, not "the link": that is the whole instruction. */
        title: 'Open nextnamaz.com/s on the TV',
        description:
          'Any TV browser, Fire Stick, Chromecast, tablet or old laptop. Press Start and a QR code appears.',
      },
      {
        title: 'Scan the code with your phone',
        description:
          "It opens that screen's settings. Choose where the times come from, the language and a theme.",
      },
      {
        title: 'Save',
        description:
          'The TV switches over instantly. Keep the link to change anything later, from anywhere.',
      },
    ],
  },
  features: {
    title: 'Built for how mosques actually work',
    items: [
      {
        title: 'Update from your phone',
        description:
          'Change times from wherever you are. The screen updates instantly, so nobody has to walk over to the TV.',
      },
      {
        title: 'Keeps running offline',
        description:
          'Times are cached on the screen. If the internet drops, the display stays up.',
      },
      {
        title: 'One link per screen',
        description:
          "Main hall, women's section, basement: set up each one separately. Every screen gets its own link.",
      },
    ],
  },
  cta: {
    title: 'Set up your first screen.',
    subtitle: 'Takes about two minutes. You can change everything later.',
    button: 'Set up a screen',
  },
  footer: {
    getStarted: 'Set up a screen',
    openSource: 'Open source',
  },
};
