import type { LandingCopy } from '@/lib/landing-copy';

/** Homepage copy in German. */
export const DE: LandingCopy = {
  meta: {
    title: 'Digitale Gebetszeitenanzeige für Moscheen',
    description:
      'Fernseher, Tablet oder alter Laptop als Gebetszeitenanzeige für Ihre Moschee. Einrichtung per QR-Code am Handy. Kostenlos, Open Source, ohne App und Konto.',
  },
  nav: {
    howItWorks: "So funktioniert's",
    features: 'Funktionen',
    faq: 'Fragen',
    /** Short on purpose: "Bildschirm einrichten" squeezed the logo out of the phone header. */
    getStarted: 'Loslegen',
    home: 'NextNamaz-Startseite',
    language: 'Sprache',
  },

  hero: {
    /** Breaks as "Gebetszeiten / auf dem Fernseher / Ihrer Moschee." wherever the second line cannot fit whole. */
    titleLine1: 'Gebetszeiten',
    titleLine2: 'auf dem Fernseher Ihrer Moschee.',
    subtitle:
      'In zwei Minuten vom Handy aus eingerichtet: Webseite am Fernseher öffnen, Code scannen, Stadt wählen, und schon erscheinen die Gebetszeiten. Keine App, kein Konto, keine spezielle Box.',
    cta: 'Bildschirm einrichten',
    secondary: "So funktioniert's",
    demoAlt:
      'Ein Fernseher mit der Gebetszeitenanzeige: die Uhr, die heutigen Gebetszeiten und ein Countdown bis zum nächsten Gebet',
  },

  oldWay: {
    title: 'Schluss mit dem Zettelwechsel',
    body: 'In vielen Moscheen hängt neben dem Mihrab ein ausgedruckter Gebetszeitenplan, dazu eine Wanduhr, und jeden Monat muss jemand den Zettel austauschen. NextNamaz lädt die neuen Zeiten jede Nacht. So stimmt die Anzeige jeden Morgen, ohne dass jemand Hand anlegen muss.',
    imageAlt: 'Eine kurze Animation: Jeden Monat nimmt jemand den ausgedruckten Gebetszeitenplan ab und hängt einen neuen auf, bis aus dem Blatt ein Bildschirm wird, der sich selbst aktualisiert',
    before: 'Alltag in vielen Moscheen',
    /** The caption once the sheet has become a screen. */
    after: 'Mit NextNamaz',
  },

  howItWorks: {
    title: 'In drei Schritten eingerichtet',
    subtitle: 'Wer einen QR-Code scannen kann, schafft das auch. Es dauert etwa zwei Minuten.',
    steps: [
      {
        title: 'Seite am Fernseher öffnen',
        description:
          'Öffnen Sie im Browser des Fernsehers nextnamaz.com/s und drücken Sie „Start“. Der Fernseher wird als neuer Bildschirm angelegt und zeigt einen QR-Code.',
        detail: 'Smart-TV, Streaming-Stick, Laptop oder Raspberry Pi',
        sceneAlt:
          'Ein Fernseher an der Wand, im Browser ist nextnamaz.com/s geöffnet und „Start“ ausgewählt, davor eine Fernbedienung',
      },
      {
        title: 'Code mit dem Handy scannen',
        description:
          'Richten Sie die Handykamera auf den Code. Die Einstellungen für genau diesen Bildschirm öffnen sich direkt im Browser Ihres Handys.',
        detail: 'Keine App nötig',
        sceneAlt: 'Der Fernseher zeigt einen QR-Code, davor ein Handy, das den Code im Kamerabild hat',
      },
      {
        title: 'Auswählen, speichern, fertig',
        description:
          'Wählen Sie Ihre Stadt und die Quelle der Zeiten, dann Sprache und Design, auf Wunsch auch eine PIN. Speichern, und Sekunden später zeigt der Fernseher Ihre Gebetszeiten.',
        detail: 'Link für spätere Änderungen aufheben',
        sceneAlt:
          'Der Fernseher zeigt die heutigen Gebetszeiten, davor ein Handy im letzten Einrichtungsschritt, „Turn on the display“ ist angetippt',
      },
    ],
  },

  display: {
    title: 'Probieren Sie die Anzeige selbst aus',
    subtitle:
      'Das sind dieselben Optionen wie in den Einstellungen auf Ihrem Handy. Ändern Sie Sprache, Design oder Fußzeile, und die Anzeige passt sich an, genau wie später Ihr Fernseher.',
    /** Text alternative for the demo TV in the playground. */
    screenAlt: 'Ein Fernseher mit der Gebetszeitenanzeige und den daneben gewählten Einstellungen',
    controls: {
      heading: 'Einstellungen',
      language: 'Sprache',
      theme: 'Design',
      mode: 'Modus',
      colours: 'Farben',
      accent: 'Akzentfarbe',
      line: 'Eigene Fußzeile',
      linePlaceholder: 'Ein Vers, ein Gruß oder der Name Ihrer Moschee',
      prayer: 'Während des Gebets',
      prayerToggle: 'Dunklen Bildschirm zeigen',
      reset: 'Zurücksetzen',
    },
    themes: { default: 'Standard', night: 'Nacht' },
    modes: { light: 'Hell', dark: 'Dunkel' },
    schemes: {
      classic: 'Klassisch',
      ocean: 'Ozean',
      emerald: 'Smaragd',
      royal: 'Königsblau',
      crimson: 'Rubin',
      midnight: 'Mitternacht',
    },
    accents: { amber: 'Bernstein', mint: 'Mint', azure: 'Azur' },
    note: 'Gebetsnamen und Beschriftungen wechseln mit der Sprache, die Zeiten bleiben gleich. Jeder Bildschirm hat seine eigenen Einstellungen.',
  },

  orientation: {
    title: 'Quer- oder Hochformat',
    body: 'Hängen Sie den Fernseher so auf, wie die Wand es erlaubt. Hochkant am Eingang oder im schmalen Flur ordnet sich die Anzeige von selbst neu an.',
    landscape: 'Querformat, im Gebetsraum',
    portrait: 'Hochformat, am Eingang',
  },


  features: {
    title: 'Gemacht für den Alltag in der Moschee',
    subtitle: 'Alles stellen Sie am Handy ein. Auf dem Fernseher wird nichts installiert.',
    imageAlt: 'Eine gezeichnete Wand im Gebetssaal: der Mihrab mit einer Messinglampe darüber, daneben ein hochkant hängender Bildschirm mit den Gebetszeiten',
    rooms: { womens: 'Frauenbereich', main: 'Hauptsaal' },
    poster: {
      kicker: 'Jeden Samstag',
      title: 'Koranunterricht für Kinder',
      details: '10 bis 12 Uhr, 6 bis 14 Jahre',
      action: 'Anmeldung im Büro',
    },
    items: [
      {
        id: 'sources',
        title: 'Zeiten aus Ihrer gewohnten Quelle',
        body: 'Vaktija.ba für Bosnien, Vaktija.eu für Städte in 17 europäischen Ländern, Islamiska Förbundet für Schweden, AlAdhan weltweit oder eine Berechnung für Ihren Standort. Die Zeiten werden täglich neu geladen.',
      },
      {
        id: 'phone',
        title: 'Vom Handy aus ändern',
        body: 'Hauptsaal und Frauenbereich richten Sie getrennt ein. Jeder Bildschirm hat seinen eigenen Link: am Handy öffnen, beliebig ändern, und wenige Sekunden später ist dieser Fernseher auf dem neuesten Stand.',
      },
      {
        id: 'offline',
        title: 'Wenn das Internet ausfällt',
        body: 'Uhr, Countdown und die heutigen Zeiten laufen weiter. Änderungen und die Zeiten für morgen kommen an, sobald die Verbindung wieder steht. Nach einem Stromausfall startet die Anzeige nur mit Internet.',
      },
      {
        id: 'dark',
        title: 'Dunkler Bildschirm zum Gebet',
        body: 'Auf Wunsch wird der Bildschirm ab Beginn jeder Gebetszeit für 5 bis 45 Minuten schwarz, nur eine Uhr bleibt sichtbar. So lenkt an der Wand nichts ab.',
      },
      {
        id: 'announcements',
        title: 'Ankündigungen zwischendurch',
        body: 'Laden Sie bis zu 12 Plakate oder kurze Videos hoch. Der Fernseher zeigt sie im Vollbild oder neben den Zeiten, so oft Sie möchten, von minütlich bis stündlich. Danach kehrt er zur normalen Anzeige zurück. Videos laufen ohne Ton.',
      },
      {
        id: 'screen',
        title: 'Passt zu Ihrem Fernseher',
        body: 'Quer- oder Hochformat, gedreht für hochkant montierte Fernseher und verkleinert für Geräte, die den Bildrand abschneiden.',
      },
      {
        id: 'languages',
        title: 'Neun Sprachen, eigene Begriffe',
        body: 'Englisch, Arabisch, Bosnisch, Schwedisch, Türkisch, Urdu, Deutsch, Französisch und Spanisch. Arabisch und Urdu laufen von rechts nach links. Gebete und Überschriften benennen Sie so, wie es in Ihrer Gemeinde üblich ist.',
      },
      {
        id: 'lock',
        title: 'Code am Bildschirm, PIN auf Wunsch',
        body: 'Von der 10. bis zur 25. Minute nach jedem Gebet erscheint in einer Ecke ein kleiner Code, mit dem jemand vor Ort die Einstellungen öffnen kann. Das lässt sich abschalten, und eine optionale PIN schränkt ein, wer etwas ändern kann.',
      },
      {
        id: 'free',
        title: 'Dauerhaft kostenlos',
        body: 'Keine Kosten, kein Abo, keine Werbung, nichts zu verlängern. So viele Bildschirme, wie Ihre Moschee Wände hat.',
      },
      {
        id: 'open',
        title: 'Open Source',
        body: 'Jede Zeile Code steht unter der AGPL öffentlich auf GitHub. Lesen Sie nach, wie es funktioniert, schlagen Sie Verbesserungen vor oder betreiben Sie es selbst.',
      },
    ],
  },

  devices: {
    title: 'Läuft auf dem, was Sie schon haben',
    body: 'Als Anzeige eignet sich jedes Gerät mit aktuellem Webbrowser und Internetverbindung. Hat Ihr Fernseher keinen Browser oder nur einen veralteten, schließen Sie einen kleinen Stick oder einen alten Laptop an.',
    items: [
      { id: 'tv', label: 'Smart-TV mit Webbrowser' },
      { id: 'stick', label: 'Fire TV Stick oder ein anderer Stick mit Browser' },
      { id: 'pi', label: 'Raspberry Pi oder Mini-PC per HDMI' },
      { id: 'laptop', label: 'Alter Laptop am Fernseher' },
      { id: 'tablet', label: 'Tablet auf einem Ständer, hochkant oder quer' },
    ],
  },

  faq: {
    title: 'Was Moscheen oft fragen',
    items: [
      {
        q: 'Was kostet das, und brauchen wir ein Konto?',
        a: 'Nichts, und nein. Es gibt kein Abo, keine Registrierung, keine E-Mail und kein Passwort. Jeder Bildschirm bekommt bei der Einrichtung seinen eigenen privaten Link, und über diesen Link erreichen Sie seine Einstellungen.',
      },
      {
        q: 'Was müssen wir kaufen?',
        a: 'Oft gar nichts. Sie brauchen einen Fernseher oder Monitor mit Webbrowser und Internetverbindung. Bei neueren Smart-TVs reicht meist der eingebaute Browser. Bleibt die Seite leer oder wird sie fehlerhaft angezeigt, ist der Browser zu alt. Schließen Sie dann einen Streaming-Stick mit Browser, einen Raspberry Pi oder einen alten Laptop an. Eine spezielle Box ist nicht nötig.',
      },
      {
        q: 'Was passiert bei einem Internet- oder Stromausfall?',
        a: 'Fällt das Internet aus, laufen Uhr, Countdown und die heutigen Zeiten weiter, und Ihre Änderungen kommen an, sobald die Verbindung wieder steht. Nach einem Stromausfall braucht die Seite Internet, um neu zu laden. Der Fernseher merkt sich seinen Bildschirm: Rufen Sie nextnamaz.com/s auf, und Ihre Anzeige ist sofort wieder da.',
      },
      {
        q: 'Woher kommen die Zeiten, und stimmen sie?',
        a: 'Aus der Quelle, die Sie wählen: Vaktija.ba, Vaktija.eu, Islamiska Förbundet, AlAdhan oder eine Berechnung, bei der Sie Methode und Asr-Berechnung selbst wählen. Bei der Einrichtung wird die am besten passende Quelle für Ihre Stadt vorgeschlagen, und Sie sehen zuerst die heutigen Zeiten. So können Sie sie mit Ihrem gewohnten Gebetszeitenplan vergleichen.',
      },
      {
        q: 'Können wir später etwas ändern?',
        a: 'Jederzeit. Öffnen Sie den Einstellungslink auf einem beliebigen Handy oder Computer, ändern Sie Quelle, Sprache, Design oder Ankündigungen, und speichern Sie. Wenige Sekunden später zeigt der Fernseher die Änderungen. Haben Sie den Link verloren, bewegen Sie am Fernseher die Maus oder drücken Sie eine Taste, dann erscheint sein Code wieder.',
      },
      {
        q: 'Wer kann an unserem Bildschirm etwas ändern?',
        a: 'Jeder, der den Link hat oder den Code am Fernseher scannt. Behandeln Sie den Link wie einen Schlüssel und geben Sie ihn nur an Personen weiter, denen Sie vertrauen. Für mehr Kontrolle legen Sie eine PIN mit 4 bis 8 Ziffern fest. Eine vergessene PIN lässt sich nicht zurücksetzen, schreiben Sie sie also auf.',
      },
      {
        q: 'Kann jeder Raum einen eigenen Bildschirm haben?',
        a: 'Ja. Richten Sie jeden Fernseher einzeln ein, dann bekommt jeder seinen eigenen Link, eigene Zeiten, eigene Sprache und eigenes Design. Im Hauptsaal kann die Anzeige auf Türkisch laufen und im Frauenbereich auf Deutsch, jeweils mit eigenen Ankündigungen.',
      },
      {
        q: 'Welche Sprachen kann der Bildschirm anzeigen?',
        a: 'Neun: Englisch, Arabisch, Bosnisch, Schwedisch, Türkisch, Urdu, Deutsch, Französisch und Spanisch. Arabisch und Urdu laufen von rechts nach links. Jedes Gebet und jede Überschrift auf der Anzeige können Sie umbenennen. Die Einstellungsseite auf dem Handy, die Einrichtungsseiten auf dem Fernseher und der kleine Hinweis „Scan to manage“ sind auf Englisch.',
      },
      {
        q: 'Gibt es auch Iqama, Freitagsgebet oder das islamische Datum?',
        a: 'Noch nicht. Der Bildschirm zeigt, wann jedes Gebet beginnt, dazu den Sonnenaufgang, jeweils aus der Quelle Ihrer Wahl. Iqama-Zeiten, eine Zeit für das Freitagsgebet, das islamische Datum und selbst eingetragene Zeiten gibt es im Moment nicht. Die Uhr läuft im 24-Stunden-Format, das Datum steht in der Reihenfolge Tag, Monat, Jahr.',
      },
      {
        q: 'Welche Daten speichern Sie?',
        a: 'Zu jedem Bildschirm speichern wir seine Einstellungen, seine Stadt oder Koordinaten, die PIN (falls vergeben) nur in unkenntlich gemachter Form sowie alle Bilder und Videos, die Sie hochladen. Hochgeladene Dateien kann jeder öffnen, der ihre Webadresse kennt. Laden Sie also nichts Privates hoch. Für die Stadtsuche und „Use my location“ wird der Ort bei Open-Meteo und BigDataCloud abgefragt. Seitenaufrufe zählen wir anonym mit Vercel Web Analytics. Da es keine Konten gibt, speichern wir auch keine Namen, E-Mail-Adressen oder Passwörter.',
      },
    ],
  },

  openSource: {
    /** A no-break space keeps "Open Source" on one line. */
    title: 'Für immer kostenlos und Open Source',
    body: 'NextNamaz ist kostenlos und werbefrei. Der vollständige Code steht unter der AGPL offen auf GitHub. So können Moscheen, Gemeinden und Entwickler nachlesen, wie es funktioniert, Änderungen vorschlagen oder es selbst betreiben.',
    link: {
      label: 'Code auf GitHub ansehen',
      href: 'https://github.com/nextnamaz/nextnamaz',
    },
  },

  cta: {
    title: 'Richten Sie Ihren ersten Bildschirm ein',
    subtitle:
      'Das dauert etwa zwei Minuten, und Sie können später alles ändern. Am besten stehen Sie dabei mit dem Handy in der Hand vor dem Fernseher.',
    button: 'Bildschirm einrichten',
    points: ['Für immer kostenlos', 'Open Source', 'Kein Konto nötig'],
  },

  footer: {
    tagline: 'Gebetszeiten für den Fernseher in der Moschee, eingerichtet mit dem Handy.',
    product: {
      heading: 'Produkt',
      links: {
        getStarted: 'Loslegen',
        howItWorks: "So funktioniert's",
        features: 'Funktionen',
        faq: 'Fragen',
      },
    },
    project: {
      heading: 'Projekt',
      links: {
        source: 'Quellcode',
        license: 'Lizenz',
      },
    },
    social: { github: 'NextNamaz auf GitHub', linkedin: 'Ismail Sacic auf LinkedIn' },
    madeBy: {
      label: 'Entwickelt von Ismail Sacic',
      href: 'https://ismail.sacic.dev/',
    },
    copyright: 'Ismail Sacic. NextNamaz ist freie Software.',
    license:
      'Sie dürfen NextNamaz unter den Bedingungen der GNU Affero General Public License, Version 3, nutzen, untersuchen, weitergeben und verändern.',
    /** The feedback form: what people write lands on /admin. */
    feedback: {
      button: 'Feedback senden',
      heading: 'Sagen Sie uns Ihre Meinung',
      intro: 'Hakt etwas, oder fehlt Ihnen etwas? Wir lesen jede Nachricht.',
      message: 'Ihre Nachricht',
      email: 'E-Mail (freiwillig, falls Sie eine Antwort möchten)',
      send: 'Senden',
      sending: 'Wird gesendet …',
      sent: 'Danke! Ihre Nachricht ist angekommen.',
      error: 'Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.',
      close: 'Schließen',
    },
    timesNote:
      'Die Gebetszeiten stammen aus der für den jeweiligen Bildschirm gewählten Quelle oder werden für seinen Standort berechnet. NextNamaz steht in keiner Verbindung zu den Anbietern, deren Gebetszeiten es anzeigen kann.',
  },
};
