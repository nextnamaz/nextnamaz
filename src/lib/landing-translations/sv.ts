import type { LandingCopy } from '@/lib/landing-copy';

/** Homepage copy in Swedish. */
export const SV: LandingCopy = {
  meta: {
    title: 'Bönetider på tv-skärm för moskéer',
    description:
      'Visa bönetider på moskéns tv, surfplatta eller gamla dator. Sätt upp skärmen med mobilen via en QR-kod. Gratis, öppen källkod, ingen app och inget konto.',
  },
  nav: {
    howItWorks: 'Så funkar det',
    features: 'Funktioner',
    faq: 'Frågor',
    getStarted: 'Kom igång',
    home: 'NextNamaz startsida',
    language: 'Språk',
  },

  hero: {
    titleLine1: 'Bönetider på',
    titleLine2: 'tv:n i din moské.',
    subtitle:
      'Du sätter upp allt med mobilen på två minuter. Öppna en webbsida på tv:n, skanna koden och välj din stad, så dyker tiderna upp. Ingen app, inget konto, ingen särskild box.',
    cta: 'Kom igång',
    secondary: 'Se hur det funkar',
    demoAlt: 'En tv som visar bönetidsskärmen: klockan, dagens bönetider och en nedräkning till nästa bön',
  },

  oldWay: {
    title: 'Slipp byta schemat för hand',
    body: 'I många moskéer finns en klocka på väggen och ett utskrivet schema vid mihraben, och varje månad måste någon byta schemat. NextNamaz hämtar nya tider varje natt, så skärmen visar rätt varje morgon utan att någon behöver röra den.',
    imageAlt: 'En väggklocka och ett utskrivet månadsschema bredvid mihraben i en liten moské',
    before: 'I många moskéer i dag',
  },

  howItWorks: {
    title: 'Klart i tre steg',
    subtitle: 'Kan du skanna en QR-kod så klarar du det här. Det tar ungefär två minuter.',
    steps: [
      {
        title: 'Öppna sidan på tv:n',
        description:
          'Gå till nextnamaz.com/s i tv:ns webbläsare och tryck på Start. Då visar tv:n en QR-kod för sin nya skärm.',
        detail: 'Smart-tv, streamingsticka, bärbar dator eller Raspberry Pi',
        sceneAlt: 'En tv på väggen med nextnamaz.com/s öppen i webbläsaren och Start markerat, med en fjärrkontroll framför',
      },
      {
        title: 'Skanna koden med mobilen',
        description:
          'Rikta mobilens kamera mot koden. Då öppnas inställningarna för just den skärmen, direkt i mobilens webbläsare.',
        detail: 'Ingen app att ladda ner',
        sceneAlt: 'Tv:n visar en QR-kod, och någon håller upp en mobil med koden mitt i kamerabilden',
      },
      {
        title: 'Välj, spara, klart',
        description:
          'Välj stad och källa för tiderna, sedan språk och utseende, och en PIN-kod om du vill. Spara, så visar tv:n bönetiderna inom några sekunder.',
        detail: 'Spara länken, så kan du ändra senare',
        sceneAlt: 'Tv:n visar dagens bönetider, och på mobilen har någon tryckt på ”Turn on the display” i sista steget',
      },
    ],
  },

  display: {
    title: 'Testa skärmen själv',
    subtitle:
      'Här är samma val som du får i inställningarna på mobilen. Byt språk, utseende eller texten längst ner, så ändras skärmen på samma sätt som din tv gör.',
    /** Text alternative for the demo TV in the playground. */
    screenAlt: 'En tv som visar bönetiderna med inställningarna du har valt bredvid',
    controls: {
      heading: 'Skärminställningar',
      language: 'Språk',
      theme: 'Tema',
      mode: 'Läge',
      colours: 'Färger',
      accent: 'Accentfärg',
      line: 'Egen text längst ner',
      linePlaceholder: 'En vers, en hälsning eller moskéns namn',
      prayer: 'Under bönen',
      prayerToggle: 'Visa mörk skärm',
      reset: 'Börja om',
    },
    themes: { default: 'Standard', night: 'Natt' },
    modes: { light: 'Ljust', dark: 'Mörkt' },
    schemes: {
      classic: 'Klassisk',
      ocean: 'Havsblå',
      emerald: 'Smaragd',
      royal: 'Kungsblå',
      crimson: 'Rubin',
      midnight: 'Midnatt',
    },
    accents: { amber: 'Bärnsten', mint: 'Mint', azure: 'Azur' },
    note: 'Bönernas namn och rubrikerna följer språket, men tiderna är desamma. Varje skärm har sina egna inställningar.',
  },

  orientation: {
    title: 'Liggande eller stående',
    body: 'Häng tv:n så som väggen tillåter. Står den på högkant vid entrén eller i en smal korridor ordnar skärmen om sig själv så att allt får plats.',
    landscape: 'Liggande, i bönesalen',
    portrait: 'Stående, vid entrén',
  },

  /** A whole day played through on the screen, in twenty seconds. */
  day: {
    title: 'Ett helt dygn på tjugo sekunder',
    body: 'Se hur skärmen följer dagen helt av sig själv. Varje bön lyser upp när det är dags, och nedräkningen visar alltid nästa. Ingen behöver röra den.',
    play: 'Spela',
    pause: 'Pausa',
    scrub: 'Tid på dygnet',
  },

  features: {
    title: 'Byggd för moskéns vardag',
    subtitle: 'Allt sköts från mobilen. Inget installeras på tv:n.',
    imageAlt: 'Bönesalen i Cambridge Central Mosque, där träpelarna grenar ut sig upp i taket',
    rooms: { womens: 'Kvinnoavdelningen', main: 'Stora salen' },
    poster: {
      kicker: 'Varje lördag',
      title: 'Koranskola för\u00a0barn',
      details: 'Kl. 10.00 till 12.00, 6 till 14 år',
      action: 'Anmälan på kontoret',
    },
    items: [
      {
        id: 'sources',
        title: 'Tider från källan du använder',
        body: 'Vaktija.ba för Bosnien, Vaktija.eu för städer i 17 europeiska länder, Islamiska Förbundet för Sverige, AlAdhan för hela världen, eller en beräkning för din plats. Nya tider hämtas varje dag.',
      },
      {
        id: 'phone',
        title: 'Ändra med mobilen',
        body: 'Sätt upp skärmarna i stora salen och på kvinnoavdelningen var för sig. Varje skärm har en egen länk: öppna den på mobilen, ändra vad du vill, så uppdateras just den tv:n inom några sekunder.',
      },
      {
        id: 'offline',
        title: 'Om internet går ner',
        body: 'Klockan och nedräkningen fortsätter att gå och dagens tider ligger kvar. Ändringar och morgondagens tider kommer när uppkopplingen är tillbaka. Efter ett strömavbrott behöver skärmen internet för att starta.',
      },
      {
        id: 'dark',
        title: 'Mörk skärm under bönen',
        body: 'Låt skärmen bli svart, med bara en klocka, i 5 till 45 minuter från det att varje bön börjar, så att inget på väggen drar till sig blicken.',
      },
      {
        id: 'announcements',
        title: 'Meddelanden mellan bönerna',
        body: 'Ladda upp högst 12 affischer eller korta videoklipp. Så ofta du vill, från en gång i minuten till en gång i timmen, visar tv:n dem i helskärm eller bredvid tiderna och växlar sedan tillbaka. Klippen spelas upp utan ljud.',
      },
      {
        id: 'screen',
        title: 'Passar tv:n du har',
        body: 'Liggande eller stående, roterad för en tv som sitter på högkant, och utzoomad för tv-apparater som skär av bildens kanter.',
      },
      {
        id: 'languages',
        title: 'Nio språk, era egna ord',
        body: 'Engelska, arabiska, bosniska, svenska, turkiska, urdu, tyska, franska och spanska, där arabiska och urdu skrivs från höger till vänster. Byt namn på bönerna och rubrikerna så att de heter som hos er.',
      },
      {
        id: 'lock',
        title: 'En kod på skärmen, och en PIN-kod',
        body: 'Mellan 10 och 25 minuter efter varje bön visas en liten kod i ett hörn, så att någon i salen kan öppna inställningarna. Du kan stänga av den, och en valfri PIN-kod begränsar vem som kan ändra något.',
      },
      {
        id: 'free',
        title: 'Gratis för alltid',
        body: 'Ingen kostnad, inget abonnemang, ingen reklam och inget att förnya. Sätt upp så många skärmar som moskén har väggar.',
      },
      {
        id: 'open',
        title: 'Öppen källkod',
        body: 'Varenda rad kod ligger öppet på GitHub under AGPL. Se hur det fungerar, föreslå en ändring eller kör en egen kopia.',
      },
    ],
  },

  devices: {
    title: 'Funkar med det du redan har',
    body: 'Allt som har en uppdaterad webbläsare och internet kan användas som skärm. Saknar tv:n webbläsare, eller är webbläsaren för gammal, kopplar du in en liten streamingsticka eller en gammal bärbar dator.',
    items: [
      { id: 'tv', label: 'En smart-tv med webbläsare' },
      { id: 'stick', label: 'En Fire TV Stick eller annan streamingsticka med webbläsare' },
      { id: 'pi', label: 'En Raspberry Pi eller minidator kopplad till tv:ns HDMI-ingång' },
      { id: 'laptop', label: 'En gammal bärbar dator kopplad till tv:n' },
      { id: 'tablet', label: 'En surfplatta i ett ställ, stående eller liggande' },
    ],
  },

  faq: {
    title: 'Vanliga frågor från moskéer',
    items: [
      {
        q: 'Vad kostar det? Behövs ett konto?',
        a: 'Ingenting, och nej. Det finns inget abonnemang, ingen registrering, ingen e-post och inget lösenord. Varje skärm får en egen privat länk när du sätter upp den, och det är med den länken du kommer åt skärmens inställningar.',
      },
      {
        q: 'Vad behöver vi köpa?',
        a: 'Ofta ingenting. Du behöver en tv eller datorskärm med webbläsare och internet. Webbläsaren i en nyare smart-tv brukar fungera. Om sidan är tom eller ser trasig ut är webbläsaren för gammal. Koppla då in en streamingsticka med webbläsare, en Raspberry Pi eller en gammal bärbar dator. Det behövs ingen särskild box.',
      },
      {
        q: 'Vad händer om internet eller strömmen försvinner?',
        a: 'Om internet går ner fortsätter klockan och nedräkningen att gå, dagens tider ligger kvar och dina ändringar kommer fram när uppkopplingen är tillbaka. Efter ett strömavbrott behöver sidan internet för att laddas igen. Tv:n kommer ihåg vilken skärm den är, så när du öppnar nextnamaz.com/s visas din skärm direkt igen.',
      },
      {
        q: 'Var kommer tiderna ifrån, och stämmer de?',
        a: 'Från källan du väljer: Vaktija.ba, Vaktija.eu, Islamiska Förbundet, AlAdhan, eller en beräkning där du själv väljer metod och hur Asr räknas. När du sätter upp skärmen föreslås det som passar din stad bäst, och dagens tider visas först, så att du kan jämföra dem med schemat ni brukar följa.',
      },
      {
        q: 'Kan vi ändra i efterhand?',
        a: 'När du vill. Öppna länken till inställningarna på valfri mobil eller dator, ändra källa, språk, utseende eller meddelanden och spara. Tv:n uppdateras inom några sekunder. Har du tappat bort länken kan du röra på musen eller trycka på en knapp vid tv:n, så visas tv:ns kod igen.',
      },
      {
        q: 'Vem kan ändra vår skärm?',
        a: 'Alla som har länken, eller som skannar koden på tv:n. Se länken som en nyckel och dela den bara med personer du litar på. Vill du ha mer kontroll kan du lägga till en PIN-kod på 4 till 8 siffror. En bortglömd PIN-kod går inte att återställa, så skriv upp den.',
      },
      {
        q: 'Vi har flera salar. Kan varje sal ha en egen skärm?',
        a: 'Ja. Sätt upp varje tv för sig, så får var och en egen länk, egna tider, eget språk och eget utseende. Stora salen kan visa turkiska och kvinnoavdelningen svenska, med egna meddelanden på varje skärm.',
      },
      {
        q: 'Vilka språk kan skärmen visa?',
        a: 'Nio: engelska, arabiska, bosniska, svenska, turkiska, urdu, tyska, franska och spanska. Arabiska och urdu läses från höger till vänster. Du kan byta namn på varje bön och rubrik på skärmen. Inställningssidan på mobilen, sidorna som tv:n visar när du sätter upp den och den lilla texten ”Scan to manage” är på engelska.',
      },
      {
        q: 'Kan skärmen visa iqamah, fredagsbönen eller hijridatum?',
        a: 'Inte än. Skärmen visar när varje bön börjar, plus soluppgången, enligt källan du väljer. Iqamah-tider, en tid för fredagsbönen, hijridatum och möjligheten att skriva in egna tider finns inte just nu. Klockan visar 24-timmarstid och datumet skrivs dag/månad/år.',
      },
      {
        q: 'Vilka uppgifter sparar ni?',
        a: 'För varje skärm sparas inställningarna, staden eller koordinaterna, PIN-koden i oläsbar form om du har valt en, och de bilder och videoklipp du laddar upp. Uppladdade filer kan öppnas av alla som har webbadressen till dem, så ladda inte upp något privat. När du söker efter en stad eller trycker på ”Use my location” slås platsen upp hos Open-Meteo och BigDataCloud. Sidbesök räknas anonymt med Vercel Web Analytics. Det finns inga konton, och därför inga namn, e-postadresser eller lösenord.',
      },
    ],
  },

  openSource: {
    title: 'Alltid gratis, med öppen källkod',
    body: 'NextNamaz är gratis att använda och helt utan reklam. Hela koden finns på GitHub under licensen AGPL-3.0, så att vilken moské, utvecklare eller förening som helst kan se hur den fungerar, föreslå ändringar eller köra en egen kopia.',
    link: {
      label: 'Se koden på GitHub',
      href: 'https://github.com/nextnamaz/nextnamaz',
    },
  },

  cta: {
    title: 'Sätt upp din första skärm',
    subtitle: 'Det tar ungefär två minuter, och du kan ändra allt i efterhand. Ställ dig vid tv:n med mobilen i handen.',
    button: 'Kom igång',
    points: ['Gratis för alltid', 'Öppen källkod', 'Inget konto behövs'],
  },

  footer: {
    tagline: 'Bönetider på moskéns tv, som du sätter upp med mobilen.',
    product: {
      heading: 'Produkt',
      links: {
        getStarted: 'Kom igång',
        howItWorks: 'Så funkar det',
        features: 'Funktioner',
        faq: 'Frågor',
      },
    },
    project: {
      heading: 'Projekt',
      links: {
        source: 'Källkod',
        license: 'Licens',
      },
    },
    social: { github: 'NextNamaz på GitHub', linkedin: 'Ismail Sacic på LinkedIn' },
    madeBy: {
      label: 'Byggd av Ismail Sacic',
      href: 'https://ismail.sacic.dev/',
    },
    copyright: 'Ismail Sacic. NextNamaz är fri programvara.',
    license:
      'Du får använda, studera, dela och ändra den enligt GNU Affero General Public License, version\u00a03.',
    /** The feedback form: what people write lands on /admin. */
    feedback: {
      button: 'Tyck till',
      heading: 'Vad tycker du?',
      intro: 'Har något krånglat, eller saknar du något? Vi läser varje meddelande.',
      message: 'Ditt meddelande',
      email: 'E-post (valfritt, om du vill ha svar)',
      send: 'Skicka',
      sending: 'Skickar…',
      sent: 'Tack! Vi har fått ditt meddelande.',
      error: 'Det gick inte att skicka. Försök igen.',
      close: 'Stäng',
    },
    timesNote:
      'Bönetiderna kommer från den källa som valts för varje skärm, eller räknas fram för skärmens plats. NextNamaz har ingen koppling till någon av källorna.',
  },
};
