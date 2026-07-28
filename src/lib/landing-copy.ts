/**
 * Landing page copy. English only — the multi-language translations that live
 * in src/lib/locale are for what a screen displays, not for this page.
 */
export const LANDING_COPY = {
  nav: {
    getStarted: 'Get Started',
  },
  hero: {
    badge: 'Open for all mosques',
    title: 'Your mosque deserves',
    titleBreak: 'a better prayer display.',
    subtitle:
      'Most mosques still use printed paper or cheap LED boards for prayer times. NextNamaz turns any TV, tablet, or old laptop into a beautiful, always-updated display.',
    cta: 'Set up your screen',
    examples: 'See it in action',
  },
  story: {
    title: 'Why I built this',
    paragraphs: [
      'I noticed the same problem at mosques everywhere. Prayer times taped to a wall, or a tiny LED sign that nobody can read from the back row. Updating them meant someone had to manually change numbers every few weeks.',
      'I thought, every mosque already has a TV or can get one cheaply. Why not use it? So I built NextNamaz, a simple tool where you enter your prayer times once, pick a theme, and open a link on your screen. That\'s it.',
      'No apps to install. No accounts. No special hardware. Just a URL that shows your prayer times, beautifully. NextNamaz is open source, you can check out the code on GitHub.',
    ],
  },
  howItWorks: {
    title: 'Three steps. Literally.',
    subtitle: 'You don\'t need to be technical. If you can scan a QR code, you can do this.',
    steps: [
      {
        title: 'Open the link on a screen',
        description:
          'Open NextNamaz on any TV browser, Fire Stick, Chromecast, tablet, or old laptop and press Start. The screen shows a QR code.',
      },
      {
        title: 'Scan it with your phone',
        description:
          'The code opens the settings for that screen. Choose where prayer times come from, the language, and a theme.',
      },
      {
        title: 'Save, and you are done',
        description:
          'The TV switches to your prayer display straight away. Keep the link to change anything later, from anywhere.',
      },
    ],
  },
  themes: {
    title: 'Looks good on any screen',
    subtitle:
      'A few of the display themes. They work in landscape and portrait, and adapt to the screen size automatically.',
  },
  features: {
    title: 'The small details that matter',
    items: [
      {
        title: 'Update from your phone',
        description:
          'Change prayer times from your phone. The screen updates instantly, no need to walk over to the TV.',
      },
      {
        title: 'Works offline',
        description:
          'Once loaded, the display keeps running even if the internet drops. Prayer times are cached locally so the screen never goes blank.',
      },
      {
        title: 'As many screens as you like',
        description:
          'Got a main hall, a women\'s section, and a basement? Set up each one separately — every screen gets its own link.',
      },
    ],
  },
  network: {
    title: 'Connect mosques across your whole country',
    subtitle:
      'NextNamaz is not just for one mosque. Imagine every mosque in a city, a region, or an entire country connected to the same system. A central organization could push khutba topics, important announcements, and warnings to every screen at once.',
    points: [
      {
        title: 'Shared khutba topics',
        description:
          'A central body sets the Friday khutba topic and it appears on every mosque display automatically. No phone calls, no WhatsApp groups.',
      },
      {
        title: 'Announcements and warnings',
        description:
          'Need to notify all mosques about a schedule change, an event, or an emergency? Push it once and every screen shows it instantly.',
      },
      {
        title: 'Synced prayer times by city',
        description:
          'Mosques in the same city share the same calculation. When times change, every display updates together. No mosque falls out of sync.',
      },
      {
        title: 'Each mosque stays independent',
        description:
          'Mosques keep control of their own screens, themes, and iqamah times. The network adds coordination without taking away freedom.',
      },
    ],
  },
  cta: {
    title: 'Your mosque can have this running today.',
    subtitle: 'Takes about 2 minutes to set up, and you can always change everything later.',
    button: 'Create your display',
  },
  footer: {
    getStarted: 'Get Started',
  },
};
