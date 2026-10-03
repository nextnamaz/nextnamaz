import type { LandingLocale } from '@/lib/landing-locales';
import type { WizardSource } from '@/lib/prayer-sources/match';

/**
 * The words of the phone setup, in the same languages as the homepage.
 * Each language is written as a native speaker would say it, not
 * translated word for word. The settings after setup stay in English.
 */
export interface SetupCopy {
  steps: { times: string; language: string; theme: string; pin: string };
  stepOf: (n: number, total: number, title: string) => string;
  location: {
    title: string;
    body: string;
    cityLabel: string;
    placeholder: string;
    noResults: string;
    orAtMosque: string;
    useLocation: string;
    finding: string;
    allowHint: string;
    geoError: string;
  };
  source: {
    confirmTitle: string;
    chooseTitle: string;
    change: string;
    yes: string;
    use: string;
    different: string;
    recommended: string;
    from: (name: string) => string;
    today: string;
    fetching: string;
    fetchError: string;
    groupLabel: string;
    calculateTitle: string;
    subtitles: Record<WizardSource, string>;
    asrStandard: string;
    asrHanafi: string;
  };
  language: { title: string; body: string };
  theme: { title: string; body: string; names: Record<string, { name: string; description: string }> };
  pin: {
    optional: string;
    title: string;
    body: string;
    label: string;
    placeholder: string;
    hint: string;
    error: string;
  };
  nav: { back: string; next: string; lock: string; skip: string };
  done: { title: string; body: string; open: string };
}

const en: SetupCopy = {
  steps: { times: 'Prayer times', language: 'Language', theme: 'Theme', pin: 'PIN' },
  stepOf: (n, total, title) => `Step ${n} of ${total}: ${title}`,
  location: {
    title: 'Which city is the mosque in?',
    body: 'Type the name, then tap your city in the list.',
    cityLabel: 'City',
    placeholder: 'Type your city',
    noResults: 'No city found. Try another spelling.',
    orAtMosque: 'or, if you are at the mosque',
    useLocation: 'Use my location',
    finding: 'Finding your location…',
    allowHint: 'If your phone asks, tap Allow. Or just type the city.',
    geoError: 'Couldn’t get your location. Type the city above instead.',
  },
  source: {
    confirmTitle: 'Are these your mosque’s times?',
    chooseTitle: 'Which times does your mosque follow?',
    change: 'Change',
    yes: 'Yes, use these times',
    use: 'Use these times',
    different: 'No, our times are different',
    recommended: 'Recommended',
    from: (name) => `From ${name}`,
    today: 'Today',
    fetching: 'Fetching today’s times…',
    fetchError: 'Couldn’t fetch times from this source right now.',
    groupLabel: 'Prayer time source',
    calculateTitle: 'Calculate the times',
    subtitles: {
      vaktija_ba: 'Official takvim of the Islamic Community in Bosnia',
      vaktija_eu: 'Bosnian takvim for cities across Europe',
      islamiska_forbundet: 'Official Swedish prayer timetable',
      aladhan: 'Worldwide service with the conventions of 20+ national authorities.',
      adhan: 'No external source. Computed astronomically for your exact location.',
    },
    asrStandard: 'Asr · Standard (Shafi’i, Maliki, Hanbali)',
    asrHanafi: 'Asr · Hanafi (later)',
  },
  language: {
    title: 'Which language should the TV show?',
    body: 'The prayer names and labels change; the times stay the same. You can reword anything later in the settings.',
  },
  theme: {
    title: 'Pick a look for your display',
    body: 'Every look works in landscape and portrait. Colours and the line at the bottom can be changed later in the settings.',
    names: {
      default: { name: 'Default', description: 'Clean table layout with next prayer panel' },
      sky: { name: 'Sky', description: 'Changes with the sky outside' },
      paper: { name: 'Paper', description: 'White space, one gold detail' },
      ivory: { name: 'Ivory', description: 'Ivory and gold, framed like a mihrab' },
      globe: { name: 'Globe', description: 'The Earth right now, with your mosque on it' },
    },
  },
  pin: {
    optional: 'Optional',
    title: 'Lock the settings with a PIN?',
    body: 'Anyone who scans the code on the TV can open these settings. With a PIN they also need a number only you know.',
    label: 'PIN, 4 to 8 digits',
    placeholder: 'No PIN',
    hint: 'Not sure? Skip it. You can add a PIN any time in the settings.',
    error: 'A PIN is 4 to 8 digits',
  },
  nav: { back: 'Back', next: 'Continue', lock: 'Lock and turn on the TV', skip: 'Skip and turn on the TV' },
  done: {
    title: 'Your screen is live',
    body: 'The TV has switched to your prayer display. Keep this page’s link. It’s the remote control for that screen, from any phone or computer.',
    open: 'Open the settings',
  },
};

const sv: SetupCopy = {
  steps: { times: 'Bönetider', language: 'Språk', theme: 'Utseende', pin: 'PIN-kod' },
  stepOf: (n, total, title) => `Steg ${n} av ${total}: ${title}`,
  location: {
    title: 'Vilken stad ligger moskén i?',
    body: 'Skriv namnet och tryck sedan på din stad i listan.',
    cityLabel: 'Stad',
    placeholder: 'Skriv din stad',
    noResults: 'Hittade ingen stad. Prova att stava på ett annat sätt.',
    orAtMosque: 'eller, om du är i moskén',
    useLocation: 'Använd min plats',
    finding: 'Letar efter din plats…',
    allowHint: 'Om telefonen frågar, tryck Tillåt. Eller skriv bara staden.',
    geoError: 'Kunde inte hitta din plats. Skriv staden ovanför i stället.',
  },
  source: {
    confirmTitle: 'Är det här er moskés tider?',
    chooseTitle: 'Vilka tider följer er moské?',
    change: 'Ändra',
    yes: 'Ja, använd de här tiderna',
    use: 'Använd de här tiderna',
    different: 'Nej, våra tider är annorlunda',
    recommended: 'Rekommenderas',
    from: (name) => `Från ${name}`,
    today: 'Idag',
    fetching: 'Hämtar dagens tider…',
    fetchError: 'Kunde inte hämta tider från den här källan just nu.',
    groupLabel: 'Källa för bönetider',
    calculateTitle: 'Räkna ut tiderna',
    subtitles: {
      vaktija_ba: 'Islamiska gemenskapen i Bosniens officiella takvim',
      vaktija_eu: 'Bosnisk takvim för städer i hela Europa',
      islamiska_forbundet: 'Officiellt svenskt bönetidsschema',
      aladhan: 'Global tjänst med beräkningsreglerna från fler än 20 nationella myndigheter.',
      adhan: 'Ingen extern källa. Räknas ut astronomiskt för just er plats.',
    },
    asrStandard: 'Asr · Standard (shafi’i, maliki, hanbali)',
    asrHanafi: 'Asr · Hanafi (senare)',
  },
  language: {
    title: 'Vilket språk ska TV:n visa?',
    body: 'Bönernas namn och texterna byts, tiderna är desamma. Formuleringarna kan du ändra senare i inställningarna.',
  },
  theme: {
    title: 'Välj utseende för skärmen',
    body: 'Alla utseenden fungerar både liggande och stående. Färger och raden längst ner kan du ändra senare i inställningarna.',
    names: {
      default: { name: 'Standard', description: 'Tydlig tabell med en ruta för nästa bön' },
      sky: { name: 'Himmel', description: 'Skiftar med himlen utanför' },
      paper: { name: 'Papper', description: 'Mycket luft och en guldig detalj' },
      ivory: { name: 'Elfenben', description: 'Elfenben och guld, inramat som en mihrab' },
      globe: { name: 'Jordglob', description: 'Jorden just nu, med moskén utsatt' },
    },
  },
  pin: {
    optional: 'Valfritt',
    title: 'Låsa inställningarna med en PIN-kod?',
    body: 'Alla som skannar koden på TV:n kan öppna de här inställningarna. Med en PIN-kod behöver de också ett nummer som bara du kan.',
    label: 'PIN-kod, 4 till 8 siffror',
    placeholder: 'Ingen PIN-kod',
    hint: 'Osäker? Hoppa över. Du kan lägga till en PIN-kod när som helst i inställningarna.',
    error: 'En PIN-kod har 4 till 8 siffror',
  },
  nav: { back: 'Tillbaka', next: 'Fortsätt', lock: 'Lås och starta TV:n', skip: 'Hoppa över och starta TV:n' },
  done: {
    title: 'Din skärm är igång',
    body: 'TV:n visar nu era bönetider. Spara länken till den här sidan. Den är fjärrkontrollen till skärmen, från vilken telefon eller dator som helst.',
    open: 'Öppna inställningarna',
  },
};

const bs: SetupCopy = {
  steps: { times: 'Vaktovi', language: 'Jezik', theme: 'Izgled', pin: 'PIN' },
  stepOf: (n, total, title) => `Korak ${n} od ${total}: ${title}`,
  location: {
    title: 'U kojem gradu je džamija?',
    body: 'Upišite naziv, pa dodirnite svoj grad na listi.',
    cityLabel: 'Grad',
    placeholder: 'Upišite svoj grad',
    noResults: 'Nema takvog grada. Pokušajte ga napisati drugačije.',
    orAtMosque: 'ili, ako ste u džamiji',
    useLocation: 'Koristi moju lokaciju',
    finding: 'Tražim vašu lokaciju…',
    allowHint: 'Ako vas telefon pita, dodirnite Dozvoli. Ili samo upišite grad.',
    geoError: 'Lokacija nije pronađena. Upišite grad gore.',
  },
  source: {
    confirmTitle: 'Jesu li ovo vaktovi vaše džamije?',
    chooseTitle: 'Koju vaktiju prati vaša džamija?',
    change: 'Promijeni',
    yes: 'Da, koristi ove vaktove',
    use: 'Koristi ove vaktove',
    different: 'Ne, naši vaktovi su drugačiji',
    recommended: 'Preporučeno',
    from: (name) => `Izvor: ${name}`,
    today: 'Danas',
    fetching: 'Učitavam današnje vaktove…',
    fetchError: 'Vaktovi iz ovog izvora se trenutno ne mogu učitati.',
    groupLabel: 'Izvor vaktova',
    calculateTitle: 'Izračunaj vaktove',
    subtitles: {
      vaktija_ba: 'Zvanični takvim Islamske zajednice u BiH',
      vaktija_eu: 'Bosanski takvim za gradove širom Evrope',
      islamiska_forbundet: 'Zvanični švedski raspored namaza',
      aladhan: 'Svjetski servis s pravilima više od 20 nacionalnih institucija.',
      adhan: 'Bez vanjskog izvora. Vaktovi se računaju astronomski, tačno za vaše mjesto.',
    },
    asrStandard: 'Ikindija · Standardno (šafijski, malikijski, hanbelijski)',
    asrHanafi: 'Ikindija · Hanefijski (kasnije)',
  },
  language: {
    title: 'Na kojem jeziku da piše na TV-u?',
    body: 'Mijenjaju se nazivi namaza i natpisi, vaktovi ostaju isti. Svaki natpis možete kasnije promijeniti u postavkama.',
  },
  theme: {
    title: 'Odaberite izgled ekrana',
    body: 'Svaki izgled radi i kad je TV položen i kad je uspravan. Boje i red na dnu možete kasnije promijeniti u postavkama.',
    names: {
      default: { name: 'Klasični', description: 'Pregledna tabela s poljem za sljedeći namaz' },
      sky: { name: 'Nebeska', description: 'Mijenja boju s nebom, od zore do jacije' },
      paper: { name: 'Bijela', description: 'Puno bijelog prostora i jedan zlatni detalj' },
      ivory: { name: 'Zlatna', description: 'Mihrab, levhe i zlato na boji slonovače' },
      globe: { name: 'Globus', description: 'Zemlja kakva je sada, s vašom džamijom na njoj' },
    },
  },
  pin: {
    optional: 'Neobavezno',
    title: 'Zaključati postavke PIN-om?',
    body: 'Svako ko skenira kod na TV-u može otvoriti ove postavke. S PIN-om mu treba i broj koji samo vi znate.',
    label: 'PIN, od 4 do 8 cifara',
    placeholder: 'Bez PIN-a',
    hint: 'Niste sigurni? Preskočite. PIN možete dodati kad god hoćete u postavkama.',
    error: 'PIN ima od 4 do 8 cifara',
  },
  nav: { back: 'Nazad', next: 'Dalje', lock: 'Zaključaj i upali TV', skip: 'Preskoči i upali TV' },
  done: {
    title: 'Vaš ekran radi',
    body: 'Na TV-u su sada vaši vaktovi. Sačuvajte link ove stranice: to je daljinski upravljač za taj ekran, s bilo kojeg telefona ili računara.',
    open: 'Otvori postavke',
  },
};

const de: SetupCopy = {
  steps: { times: 'Gebetszeiten', language: 'Sprache', theme: 'Design', pin: 'PIN' },
  stepOf: (n, total, title) => `Schritt ${n} von ${total}: ${title}`,
  location: {
    title: 'In welcher Stadt ist die Moschee?',
    body: 'Geben Sie den Namen ein und tippen Sie dann in der Liste auf Ihre Stadt.',
    cityLabel: 'Stadt',
    placeholder: 'Stadt eingeben',
    noResults: 'Keine Stadt gefunden. Versuchen Sie eine andere Schreibweise.',
    orAtMosque: 'oder, wenn Sie in der Moschee sind',
    useLocation: 'Meinen Standort verwenden',
    finding: 'Standort wird gesucht…',
    allowHint: 'Wenn Ihr Handy fragt, tippen Sie auf Erlauben. Oder geben Sie einfach die Stadt ein.',
    geoError: 'Standort nicht gefunden. Geben Sie die Stadt oben ein.',
  },
  source: {
    confirmTitle: 'Sind das die Zeiten Ihrer Moschee?',
    chooseTitle: 'Nach welchen Zeiten richtet sich Ihre Moschee?',
    change: 'Ändern',
    yes: 'Ja, diese Zeiten verwenden',
    use: 'Diese Zeiten verwenden',
    different: 'Nein, unsere Zeiten sind anders',
    recommended: 'Empfohlen',
    from: (name) => `Von ${name}`,
    today: 'Heute',
    fetching: 'Die heutigen Zeiten werden geladen…',
    fetchError: 'Diese Quelle ist gerade nicht erreichbar.',
    groupLabel: 'Quelle der Gebetszeiten',
    calculateTitle: 'Zeiten berechnen',
    subtitles: {
      vaktija_ba: 'Offizieller Takvim der Islamischen Gemeinschaft in Bosnien',
      vaktija_eu: 'Bosnischer Takvim für Städte in ganz Europa',
      islamiska_forbundet: 'Offizieller schwedischer Gebetszeitenplan',
      aladhan: 'Weltweiter Dienst mit den Regeln von über 20 nationalen Behörden.',
      adhan: 'Keine externe Quelle. Astronomisch berechnet, genau für Ihren Ort.',
    },
    asrStandard: 'Asr · Standard (schafiitisch, malikitisch, hanbalitisch)',
    asrHanafi: 'Asr · Hanafitisch (später)',
  },
  language: {
    title: 'Welche Sprache soll der Fernseher zeigen?',
    body: 'Gebetsnamen und Beschriftungen ändern sich, die Zeiten bleiben gleich. Jeden Text können Sie später in den Einstellungen anpassen.',
  },
  theme: {
    title: 'Wählen Sie ein Design für den Bildschirm',
    body: 'Jedes Design funktioniert im Quer- und im Hochformat. Farben und die Zeile unten lassen sich später in den Einstellungen ändern.',
    names: {
      default: { name: 'Standard', description: 'Übersichtliche Tabelle mit Feld für das nächste Gebet' },
      sky: { name: 'Himmel', description: 'Folgt dem Himmel draußen' },
      paper: { name: 'Papier', description: 'Viel Weißraum, ein goldenes Detail' },
      ivory: { name: 'Elfenbein', description: 'Elfenbein und Gold, gerahmt wie ein Mihrab' },
      globe: { name: 'Globus', description: 'Die Erde, wie sie gerade aussieht, mit Ihrer Moschee darauf' },
    },
  },
  pin: {
    optional: 'Optional',
    title: 'Einstellungen mit einer PIN sperren?',
    body: 'Wer den Code auf dem Fernseher scannt, kann diese Einstellungen öffnen. Mit einer PIN braucht man zusätzlich eine Zahl, die nur Sie kennen.',
    label: 'PIN, 4 bis 8 Ziffern',
    placeholder: 'Keine PIN',
    hint: 'Unsicher? Einfach überspringen. Eine PIN können Sie jederzeit in den Einstellungen hinzufügen.',
    error: 'Eine PIN hat 4 bis 8 Ziffern',
  },
  nav: { back: 'Zurück', next: 'Weiter', lock: 'Sperren und Fernseher starten', skip: 'Überspringen und Fernseher starten' },
  done: {
    title: 'Ihr Bildschirm läuft',
    body: 'Der Fernseher zeigt jetzt Ihre Gebetszeiten. Bewahren Sie den Link dieser Seite auf: Er ist die Fernbedienung für diesen Bildschirm, von jedem Handy oder Computer aus.',
    open: 'Einstellungen öffnen',
  },
};

const ar: SetupCopy = {
  steps: { times: 'مواقيت الصلاة', language: 'اللغة', theme: 'المظهر', pin: 'الرمز السري' },
  stepOf: (n, total, title) => `الخطوة ${n} من ${total}: ${title}`,
  location: {
    title: 'في أي مدينة يقع المسجد؟',
    body: 'اكتب اسم المدينة، ثم اضغط عليها في القائمة.',
    cityLabel: 'المدينة',
    placeholder: 'اكتب اسم مدينتك',
    noResults: 'لم نجد هذه المدينة. جرّب كتابتها بطريقة أخرى.',
    orAtMosque: 'أو إن كنت في المسجد الآن',
    useLocation: 'استخدم موقعي',
    finding: 'جارٍ تحديد موقعك…',
    allowHint: 'إن سألك الهاتف فاضغط «سماح». أو اكتب اسم المدينة فقط.',
    geoError: 'تعذّر تحديد موقعك. اكتب اسم المدينة في الأعلى.',
  },
  source: {
    confirmTitle: 'هل هذه مواقيت مسجدكم؟',
    chooseTitle: 'أي مواقيت يتّبعها مسجدكم؟',
    change: 'تغيير',
    yes: 'نعم، استخدم هذه المواقيت',
    use: 'استخدم هذه المواقيت',
    different: 'لا، مواقيتنا مختلفة',
    recommended: 'مُوصى به',
    from: (name) => `المصدر: ${name}`,
    today: 'اليوم',
    fetching: 'جارٍ جلب مواقيت اليوم…',
    fetchError: 'تعذّر جلب المواقيت من هذا المصدر الآن.',
    groupLabel: 'مصدر مواقيت الصلاة',
    calculateTitle: 'احسب المواقيت',
    subtitles: {
      vaktija_ba: 'التقويم الرسمي للمشيخة الإسلامية في البوسنة',
      vaktija_eu: 'تقويم بوسني لمدن في أنحاء أوروبا',
      islamiska_forbundet: 'جدول مواقيت الصلاة الرسمي في السويد',
      aladhan: 'خدمة عالمية بطرق الحساب المعتمدة لدى أكثر من 20 هيئة وطنية.',
      adhan: 'بلا مصدر خارجي. تُحسب فلكيًا لموقعك بالضبط.',
    },
    asrStandard: 'العصر · الجمهور (الشافعي والمالكي والحنبلي)',
    asrHanafi: 'العصر · الحنفي (متأخر)',
  },
  language: {
    title: 'بأي لغة تظهر الشاشة؟',
    body: 'تتغيّر أسماء الصلوات والعبارات، وتبقى المواقيت كما هي. يمكنك تعديل أي نص لاحقًا من الإعدادات.',
  },
  theme: {
    title: 'اختر مظهر الشاشة',
    body: 'كل مظهر يعمل أفقيًا وعموديًا. يمكنك تغيير الألوان والسطر السفلي لاحقًا من الإعدادات.',
    names: {
      default: { name: 'الافتراضي', description: 'جدول واضح مع خانة للصلاة القادمة' },
      sky: { name: 'سماوي', description: 'يتغيّر مع لون السماء في الخارج' },
      paper: { name: 'ورقي', description: 'مساحة بيضاء وتفصيل ذهبي واحد' },
      ivory: { name: 'عاجي', description: 'عاج وذهب في إطار محراب' },
      globe: { name: 'الكرة الأرضية', description: 'الأرض كما هي الآن، ومسجدك عليها' },
    },
  },
  pin: {
    optional: 'اختياري',
    title: 'هل تريد قفل الإعدادات برمز سري؟',
    body: 'كل من يمسح رمز QR على الشاشة يستطيع فتح هذه الإعدادات. ومع الرمز السري سيحتاج أيضًا إلى رقم لا يعرفه غيرك.',
    label: 'الرمز السري، من 4 إلى 8 أرقام',
    placeholder: 'بلا رمز',
    hint: 'لست متأكدًا؟ تخطَّ هذه الخطوة. يمكنك إضافة رمز في أي وقت من الإعدادات.',
    error: 'الرمز السري من 4 إلى 8 أرقام',
  },
  nav: { back: 'رجوع', next: 'متابعة', lock: 'اقفل وشغّل الشاشة', skip: 'تخطَّ وشغّل الشاشة' },
  done: {
    title: 'شاشتك تعمل الآن',
    body: 'تعرض الشاشة الآن مواقيت الصلاة. احتفظ برابط هذه الصفحة، فهو جهاز التحكم بتلك الشاشة من أي هاتف أو حاسوب.',
    open: 'افتح الإعدادات',
  },
};

const tr: SetupCopy = {
  steps: { times: 'Namaz vakitleri', language: 'Dil', theme: 'Görünüm', pin: 'PIN' },
  stepOf: (n, total, title) => `Adım ${n}/${total}: ${title}`,
  location: {
    title: 'Cami hangi şehirde?',
    body: 'Şehrin adını yazın, sonra listeden şehrinize dokunun.',
    cityLabel: 'Şehir',
    placeholder: 'Şehrinizi yazın',
    noResults: 'Şehir bulunamadı. Farklı bir yazımla deneyin.',
    orAtMosque: 'ya da şu an camideyseniz',
    useLocation: 'Konumumu kullan',
    finding: 'Konumunuz bulunuyor…',
    allowHint: 'Telefonunuz sorarsa İzin Ver’e dokunun. Ya da sadece şehri yazın.',
    geoError: 'Konumunuz bulunamadı. Şehri yukarıya yazın.',
  },
  source: {
    confirmTitle: 'Caminizin vakitleri bunlar mı?',
    chooseTitle: 'Caminiz hangi vakitleri kullanıyor?',
    change: 'Değiştir',
    yes: 'Evet, bu vakitleri kullan',
    use: 'Bu vakitleri kullan',
    different: 'Hayır, bizim vakitlerimiz farklı',
    recommended: 'Önerilen',
    from: (name) => `Kaynak: ${name}`,
    today: 'Bugün',
    fetching: 'Bugünün vakitleri alınıyor…',
    fetchError: 'Bu kaynaktan şu anda vakit alınamıyor.',
    groupLabel: 'Namaz vakti kaynağı',
    calculateTitle: 'Vakitleri hesapla',
    subtitles: {
      vaktija_ba: 'Bosna-Hersek İslam Birliği’nin resmî takvimi',
      vaktija_eu: 'Avrupa’daki şehirler için Boşnak takvimi',
      islamiska_forbundet: 'İsveç’in resmî namaz vakitleri çizelgesi',
      aladhan: '20’den fazla ulusal kurumun hesaplama usulleriyle dünya çapında hizmet.',
      adhan: 'Dış kaynak yok. Tam konumunuza göre astronomik olarak hesaplanır.',
    },
    asrStandard: 'İkindi · Standart (Şafii, Maliki, Hanbeli)',
    asrHanafi: 'İkindi · Hanefi (daha geç)',
  },
  language: {
    title: 'Ekranda hangi dil görünsün?',
    body: 'Namaz adları ve yazılar değişir, vakitler aynı kalır. Her yazıyı daha sonra ayarlardan değiştirebilirsiniz.',
  },
  theme: {
    title: 'Ekranınız için bir görünüm seçin',
    body: 'Her görünüm hem yatay hem dikey ekranda çalışır. Renkleri ve alttaki satırı daha sonra ayarlardan değiştirebilirsiniz.',
    names: {
      default: { name: 'Standart', description: 'Sıradaki namaz için ayrı alanı olan sade bir tablo' },
      sky: { name: 'Gökyüzü', description: 'Dışarıdaki gökyüzüyle birlikte değişir' },
      paper: { name: 'Sade', description: 'Bol beyaz alan, tek bir altın ayrıntı' },
      ivory: { name: 'Fildişi', description: 'Fildişi ve altın, mihrap çerçevesinde' },
      globe: { name: 'Yerküre', description: 'Dünyanın şu anki görünümü, caminiz üzerinde işaretli' },
    },
  },
  pin: {
    optional: 'İsteğe bağlı',
    title: 'Ayarlar bir PIN ile kilitlensin mi?',
    body: 'Televizyondaki kodu tarayan herkes bu ayarları açabilir. PIN olunca bir de yalnızca sizin bildiğiniz sayıyı girmeleri gerekir.',
    label: 'PIN, 4 ila 8 rakam',
    placeholder: 'PIN yok',
    hint: 'Emin değil misiniz? Atlayın. PIN’i istediğiniz zaman ayarlardan ekleyebilirsiniz.',
    error: 'PIN 4 ila 8 rakamdan oluşur',
  },
  nav: { back: 'Geri', next: 'Devam', lock: 'Kilitle ve ekranı aç', skip: 'Atla ve ekranı aç' },
  done: {
    title: 'Ekranınız yayında',
    body: 'Televizyon artık namaz vakitlerinizi gösteriyor. Bu sayfanın bağlantısını saklayın: Herhangi bir telefondan ya da bilgisayardan o ekranın kumandası bu sayfadır.',
    open: 'Ayarları aç',
  },
};

export const SETUP_COPY: Record<LandingLocale, SetupCopy> = { en, sv, bs, de, ar, tr };
