interface LandingTranslations {
  nav: {
    signIn: string;
    getStarted: string;
  };
  hero: {
    badge: string;
    title: string;
    titleBreak: string;
    subtitle: string;
    cta: string;
    examples: string;
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: {
      title: string;
      description: string;
    }[];
  };
  themes: {
    title: string;
    subtitle: string;
  };
  features: {
    title: string;
    items: {
      title: string;
      description: string;
    }[];
  };
  network: {
    title: string;
    subtitle: string;
    points: {
      title: string;
      description: string;
    }[];
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  footer: {
    signIn: string;
    getStarted: string;
  };
}

const en: LandingTranslations = {
  nav: {
    signIn: 'Sign In',
    getStarted: 'Get Started',
  },
  hero: {
    badge: 'Open for all mosques',
    title: 'Your mosque deserves',
    titleBreak: 'a better prayer display.',
    subtitle: 'Most mosques still use printed paper or cheap LED boards for prayer times. NextNamaz turns any TV, tablet, or old laptop into a beautiful, always-updated display.',
    cta: 'Set up your mosque',
    examples: 'See it in action',
  },
  story: {
    title: 'Why I built this',
    paragraphs: [
      'I noticed the same problem at mosques everywhere. Prayer times taped to a wall, or a tiny LED sign that nobody can read from the back row. Updating them meant someone had to manually change numbers every few weeks.',
      'I thought, every mosque already has a TV or can get one cheaply. Why not use it? So I built NextNamaz, a simple tool where you enter your prayer times once, pick a theme, and open a link on your screen. That\'s it.',
      'No apps to install. No special hardware. Just a URL that shows your prayer times, beautifully. NextNamaz is open source, you can check out the code on GitHub.',
    ],
  },
  howItWorks: {
    title: 'Three steps. Literally.',
    subtitle: 'You don\'t need to be technical. If you can fill in a form, you can do this.',
    steps: [
      { title: 'Register your mosque', description: 'Create an account and give your mosque a name. You\'ll get your own dashboard to manage everything.' },
      { title: 'Enter prayer times & pick a look', description: 'Type in your Fajr, Dhuhr, Asr, Maghrib, Isha times. Choose a display theme that fits your mosque. Dark, light, or traditional.' },
      { title: 'Open the link on a screen', description: 'You get a unique URL. Open it on any TV browser, Fire Stick, Chromecast, tablet, or old laptop. Plug it in and walk away.' },
    ],
  },
  themes: {
    title: 'Looks good on any screen',
    subtitle: 'A few of the display themes. They work in landscape and portrait, and adapt to the screen size automatically.',
  },
  features: {
    title: 'The small details that matter',
    items: [
      { title: 'Update from your phone', description: 'Change prayer times from the dashboard on your phone. Every connected screen updates instantly, no need to walk to the TV.' },
      { title: 'Works offline', description: 'Once loaded, the display keeps running even if the internet drops. Prayer times are cached locally so the screen never goes blank.' },
      { title: 'Multiple screens, one account', description: 'Got a main hall, a women\'s section, and a basement? Set up a screen for each, all managed from one place.' },
    ],
  },
  network: {
    title: 'Connect mosques across your whole country',
    subtitle: 'NextNamaz is not just for one mosque. Imagine every mosque in a city, a region, or an entire country connected to the same system. A central organization can push khutba topics, important announcements, and warnings to every screen at once.',
    points: [
      { title: 'Shared khutba topics', description: 'A central body sets the Friday khutba topic and it appears on every mosque display automatically. No phone calls, no WhatsApp groups.' },
      { title: 'Announcements and warnings', description: 'Need to notify all mosques about a schedule change, an event, or an emergency? Push it once and every screen shows it instantly.' },
      { title: 'Synced prayer times by city', description: 'Mosques in the same city share the same calculation. When times change, every display updates together. No mosque falls out of sync.' },
      { title: 'Each mosque stays independent', description: 'Mosques keep control of their own screens, themes, and iqamah times. The network adds coordination without taking away freedom.' },
    ],

  },
  cta: {
    title: 'Your mosque can have this running today.',
    subtitle: 'Takes about 2 minutes to set up, and you can always change everything later.',
    button: 'Create your display',
  },
  footer: {
    signIn: 'Sign In',
    getStarted: 'Get Started',
  },
};

const bs: LandingTranslations = {
  nav: {
    signIn: 'Prijava',
    getStarted: 'Započni',
  },
  hero: {
    badge: 'Otvoreno za sve džamije',
    title: 'Vaša džamija zaslužuje',
    titleBreak: 'bolji prikaz namaza.',
    subtitle: 'Većina džamija još koristi papir ili jeftine LED table za namaska vremena. NextNamaz pretvara bilo koji TV, tablet ili stari laptop u lijep, uvijek ažuriran displej.',
    cta: 'Postavite svoju džamiju',
    examples: 'Pogledajte uživo',
  },
  story: {
    title: 'Zašto sam ovo napravio',
    paragraphs: [
      'Primijetio sam isti problem u džamijama svugdje. Namaska vremena zalijepljena na zid, ili mali LED znak koji niko ne može pročitati iz zadnjeg safa. Ažuriranje je značilo da neko mora ručno mijenjati brojeve svake sedmice.',
      'Pomislio sam, svaka džamija već ima TV ili ga može jeftino nabaviti. Zašto ga ne iskoristiti? Tako sam napravio NextNamaz, jednostavan alat gdje unesete namaska vremena, odaberete temu i otvorite link na ekranu. To je sve.',
      'Nema instalacije aplikacija. Nema posebnog hardvera. Samo URL koji prikazuje vaša namaska vremena, lijepo. NextNamaz je open source, možete pogledati kod na GitHubu.',
    ],
  },
  howItWorks: {
    title: 'Tri koraka. Bukvalno.',
    subtitle: 'Ne trebate biti tehnički potkovani. Ako možete popuniti formular, možete i ovo.',
    steps: [
      { title: 'Registrujte svoju džamiju', description: 'Kreirajte račun i dajte ime svojoj džamiji. Dobićete vlastitu kontrolnu tablu za upravljanje svime.' },
      { title: 'Unesite vremena i odaberite izgled', description: 'Upišite Sabah, Podne, Ikindiju, Akšam, Jaciju. Odaberite temu koja odgovara vašoj džamiji. Tamna, svijetla ili tradicionalna.' },
      { title: 'Otvorite link na ekranu', description: 'Dobijete jedinstveni URL. Otvorite ga na TV pregledniku, Fire Sticku, Chromecastu, tabletu ili starom laptopu. Uključite i idite.' },
    ],
  },
  themes: {
    title: 'Izgleda dobro na svakom ekranu',
    subtitle: 'Nekoliko tema za prikaz. Rade u pejzažnom i portretnom modu i automatski se prilagođavaju veličini ekrana.',
  },
  features: {
    title: 'Mali detalji koji su bitni',
    items: [
      { title: 'Ažurirajte s telefona', description: 'Promijenite namaska vremena s kontrolne table na telefonu. Svaki povezani ekran se odmah ažurira, nema potrebe hodati do TV-a.' },
      { title: 'Radi offline', description: 'Jednom učitan, displej nastavlja raditi čak i ako internet padne. Namaska vremena su keširana lokalno tako da ekran nikad ne ostane prazan.' },
      { title: 'Više ekrana, jedan račun', description: 'Imate glavnu salu, ženski dio i podrum? Postavite ekran za svaki, sve upravljano s jednog mjesta.' },
    ],
  },
  network: {
    title: 'Povežite džamije širom cijele zemlje',
    subtitle: 'NextNamaz nije samo za jednu džamiju. Zamislite da je svaka džamija u gradu, regiji ili cijeloj zemlji povezana na isti sistem. Centralna organizacija može slati teme hutbe, važna obavještenja i upozorenja na svaki ekran odjednom.',
    points: [
      { title: 'Zajedničke teme hutbe', description: 'Centralno tijelo postavi temu za džumu hutbu i ona se automatski pojavi na svakom displeju. Bez telefoniranja, bez WhatsApp grupa.' },
      { title: 'Obavještenja i upozorenja', description: 'Trebate obavijestiti sve džamije o promjeni rasporeda, događaju ili hitnom slučaju? Pošaljite jednom i svaki ekran to prikaže odmah.' },
      { title: 'Sinhronizovana vremena po gradu', description: 'Džamije u istom gradu dijele isti proračun. Kada se vremena promijene, svaki displej se ažurira zajedno. Nijedna džamija ne ispadne iz sinhronizacije.' },
      { title: 'Svaka džamija ostaje nezavisna', description: 'Džamije zadržavaju kontrolu nad svojim ekranima, temama i ikametskim vremenima. Mreža dodaje koordinaciju bez oduzimanja slobode.' },
    ],

  },
  cta: {
    title: 'Vaša džamija može imati ovo danas.',
    subtitle: 'Traje oko 2 minute za postavljanje, i uvijek možete sve promijeniti kasnije.',
    button: 'Kreirajte svoj displej',
  },
  footer: {
    signIn: 'Prijava',
    getStarted: 'Započni',
  },
};

const sv: LandingTranslations = {
  nav: {
    signIn: 'Logga in',
    getStarted: 'Kom igång',
  },
  hero: {
    badge: 'Öppet för alla moskéer',
    title: 'Din moské förtjänar',
    titleBreak: 'en bättre bönetidsdisplay.',
    subtitle: 'De flesta moskéer använder fortfarande papperslappar eller billiga LED-skyltar för bönetider. NextNamaz förvandlar vilken TV, surfplatta eller gammal laptop som helst till en snygg, alltid uppdaterad display.',
    cta: 'Sätt upp din moské',
    examples: 'Se det live',
  },
  story: {
    title: 'Varför jag byggde detta',
    paragraphs: [
      'Jag såg samma problem i moskéer överallt. Bönetider tejpade på väggen, eller en liten LED-skylt som ingen kan läsa från bakersta raden. Att uppdatera dem innebar att någon manuellt behövde ändra siffror varje vecka.',
      'Jag tänkte, varje moské har redan en TV eller kan skaffa en billigt. Varför inte använda den? Så jag byggde NextNamaz, ett enkelt verktyg där du anger bönetider, väljer ett tema och öppnar en länk på skärmen. Det är allt.',
      'Inga appar att installera. Ingen speciell hårdvara. Bara en URL som visar dina bönetider, snyggt. NextNamaz är open source, du kan kolla koden på GitHub.',
    ],
  },
  howItWorks: {
    title: 'Tre steg. Bokstavligen.',
    subtitle: 'Du behöver inte vara teknisk. Om du kan fylla i ett formulär kan du göra detta.',
    steps: [
      { title: 'Registrera din moské', description: 'Skapa ett konto och ge din moské ett namn. Du får en egen kontrollpanel för att hantera allt.' },
      { title: 'Ange bönetider & välj utseende', description: 'Skriv in Fajr, Dhuhr, Asr, Maghrib, Isha. Välj ett displaytema som passar din moské. Mörkt, ljust eller traditionellt.' },
      { title: 'Öppna länken på en skärm', description: 'Du får en unik URL. Öppna den i en TV-webbläsare, Fire Stick, Chromecast, surfplatta eller gammal laptop. Koppla in och gå.' },
    ],
  },
  themes: {
    title: 'Ser bra ut på alla skärmar',
    subtitle: 'Några av displaytemana. De fungerar i liggande och stående läge och anpassar sig automatiskt.',
  },
  features: {
    title: 'De små detaljerna som spelar roll',
    items: [
      { title: 'Uppdatera från mobilen', description: 'Ändra bönetider från kontrollpanelen på din telefon. Varje ansluten skärm uppdateras direkt, du behöver inte gå till TV:n.' },
      { title: 'Fungerar offline', description: 'När displayen väl laddats fortsätter den fungera även om internet försvinner. Bönetiderna cachas lokalt så skärmen aldrig blir tom.' },
      { title: 'Flera skärmar, ett konto', description: 'Har du en huvudsal, en kvinnosektion och en källare? Sätt upp en skärm för varje, allt hanteras från ett ställe.' },
    ],
  },
  network: {
    title: 'Koppla ihop moskéer i hela landet',
    subtitle: 'NextNamaz handlar inte bara om en moské. Tänk dig att varje moské i en stad, en region eller ett helt land är kopplad till samma system. En central organisation kan skicka khutba-ämnen, viktiga meddelanden och varningar till varje skärm samtidigt.',
    points: [
      { title: 'Gemensamma khutba-ämnen', description: 'En central instans sätter fredagens khutba-ämne och det visas automatiskt på varje moskédisplay. Inga telefonsamtal, inga WhatsApp-grupper.' },
      { title: 'Meddelanden och varningar', description: 'Behöver du meddela alla moskéer om en schemaändring, ett evenemang eller en nödsituation? Skicka en gång och varje skärm visar det direkt.' },
      { title: 'Synkade bönetider per stad', description: 'Moskéer i samma stad delar samma beräkning. När tiderna ändras uppdateras varje display tillsammans. Ingen moské hamnar ur synk.' },
      { title: 'Varje moské förblir självständig', description: 'Moskéer behåller kontrollen över sina egna skärmar, teman och iqamah-tider. Nätverket lägger till samordning utan att ta bort frihet.' },
    ],

  },
  cta: {
    title: 'Din moské kan ha detta igång idag.',
    subtitle: 'Tar ungefär 2 minuter att sätta upp, och du kan alltid ändra allt senare.',
    button: 'Skapa din display',
  },
  footer: {
    signIn: 'Logga in',
    getStarted: 'Kom igång',
  },
};

type SupportedLocale = 'en' | 'bs' | 'sv';

const translations: Record<SupportedLocale, LandingTranslations> = { en, bs, sv };

export type { LandingTranslations, SupportedLocale };

export function detectLocale(acceptLanguage: string | null): SupportedLocale {
  if (!acceptLanguage) return 'en';

  const preferred = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=');
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) {
    const code = lang.split('-')[0];
    if (code === 'bs' || code === 'hr' || code === 'sr') return 'bs';
    if (code === 'sv') return 'sv';
    if (code === 'en') return 'en';
  }

  return 'en';
}

export function getTranslations(locale: SupportedLocale): LandingTranslations {
  return translations[locale];
}
