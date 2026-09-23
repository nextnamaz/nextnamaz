import type { LandingCopy } from '@/lib/landing-copy';

/** Homepage copy in Bosnian. */
export const BS: LandingCopy = {
  meta: {
    title: 'Digitalna vaktija na TV ekranu za vašu džamiju',
    description:
      'TV, tablet ili stari laptop pretvorite u vaktiju za džamiju. Podesite je mobitelom preko QR koda. Besplatno, otvoreni kod, bez aplikacije i registracije.',
  },
  nav: {
    howItWorks: 'Kako radi',
    features: 'Mogućnosti',
    faq: 'Pitanja',
    getStarted: 'Pokrenite vaktiju',
    home: 'NextNamaz, početna stranica',
    language: 'Jezik',
  },

  hero: {
    titleLine1: 'Vaktija na televizoru',
    titleLine2: 'u vašoj džamiji.',
    subtitle:
      'Za dvije minute sve podesite s mobitela. Na televizoru otvorite web stranicu, skenirajte kod, izaberite grad i vaktija je na ekranu. Ne treba vam ni aplikacija, ni registracija, ni poseban uređaj.',
    cta: 'Pokrenite vaktiju',
    secondary: 'Kako radi',
    demoAlt: 'Televizor s vaktijom: sat, današnja namaska vremena i odbrojavanje do sljedećeg namaza',
  },

  oldWay: {
    title: 'Vaktiju više ne mijenjate ručno',
    body: 'U mnogim džamijama pored mihraba visi odštampana vaktija, a na zidu sat. Svakog mjeseca neko mora okačiti novu. NextNamaz svake noći sam preuzme nova vremena, pa je vaktija na ekranu svako jutro tačna, a da je niko ne dira.',
    imageAlt: 'Zidni sat i odštampana mjesečna vaktija pored mihraba male džamije',
    before: 'Danas u mnogim džamijama',
  },

  howItWorks: {
    title: 'U tri koraka do vaktije na ekranu',
    subtitle: 'Ako znate skenirati QR kod, znate i ovo. Sve traje oko dvije minute.',
    steps: [
      {
        title: 'Otvorite stranicu na televizoru',
        description:
          'U browseru na televizoru otvorite nextnamaz.com/s i pritisnite Start. Televizor tada prikaže QR kod.',
        detail: 'Smart TV, TV stik, laptop ili Raspberry Pi',
        sceneAlt: 'Televizor na zidu s otvorenom stranicom nextnamaz.com/s i označenim dugmetom Start, a ispred njega daljinski',
      },
      {
        title: 'Skenirajte kod mobitelom',
        description:
          'Uperite kameru mobitela u kod. U browseru na mobitelu odmah će se otvoriti podešavanja baš za taj ekran.',
        detail: 'Ne morate ništa instalirati',
        sceneAlt: 'Televizor s QR kodom i mobitel podignut prema njemu, s kodom u kadru kamere',
      },
      {
        title: 'Izaberite, sačuvajte i gotovo',
        description:
          'Izaberite grad i izvor vaktije, zatim jezik i izgled, a po želji i PIN. Sačuvajte i za nekoliko sekundi vaktija je na televizoru.',
        detail: 'Sačuvajte link za kasnije izmjene',
        sceneAlt: 'Televizor s današnjim namaskim vremenima i mobitel na posljednjem koraku podešavanja, s pritisnutim dugmetom „Turn on the display“',
      },
    ],
  },

  display: {
    title: 'Isprobajte sami',
    subtitle:
      'Ovo su iste opcije koje ćete imati u podešavanjima na mobitelu. Promijenite jezik, izgled ili tekst na dnu i ekran se odmah prilagodi. Isto će se desiti i na vašem televizoru.',
    /** Text alternative for the demo TV in the playground. */
    screenAlt: 'Televizor s vaktijom koji prikazuje podešavanja izabrana pored njega',
    controls: {
      heading: 'Podešavanja',
      language: 'Jezik',
      theme: 'Tema',
      mode: 'Režim',
      colours: 'Boje',
      accent: 'Akcent',
      line: 'Vaš tekst na dnu',
      linePlaceholder: 'Ajet, selam ili naziv vaše džamije',
      prayer: 'Za vrijeme namaza',
      prayerToggle: 'Zatamni ekran',
      reset: 'Vrati na početno',
    },
    themes: { default: 'Osnovna', night: 'Noćna' },
    modes: { light: 'Svijetli', dark: 'Tamni' },
    schemes: {
      classic: 'Klasična',
      ocean: 'Okeanska',
      emerald: 'Smaragdna',
      royal: 'Kraljevska',
      crimson: 'Grimizna',
      midnight: 'Ponoćna',
    },
    accents: { amber: 'Ćilibar', mint: 'Menta', azure: 'Azur' },
    note: 'Kad promijenite jezik, mijenjaju se nazivi namaza i natpisi, a vremena ostaju ista. Svaki ekran ima svoja podešavanja.',
  },

  orientation: {
    title: 'Vodoravno ili uspravno',
    body: 'Okačite televizor onako kako zid dozvoljava. Ako stoji uspravno pored ulaza ili u uskom hodniku, vaktija se sama preslaže da sve stane.',
    landscape: 'Vodoravno, u glavnom prostoru',
    portrait: 'Uspravno, pored ulaza',
  },

  features: {
    title: 'Po mjeri džamije i džemata',
    subtitle: 'Sve podešavate s mobitela, a na televizor ne instalirate ništa.',
    imageAlt: 'Prostor za namaz u Centralnoj džamiji u Cambridgeu, s drvenim stubovima koji se granaju prema plafonu',
    rooms: { womens: 'Ženski dio', main: 'Glavni prostor' },
    poster: {
      kicker: 'Svake subote',
      title: 'Mekteb za djecu',
      details: 'Od 10 do 12 sati, uzrast 6 do 14 godina',
      action: 'Prijave u kancelariji džemata',
    },
    items: [
      {
        id: 'sources',
        title: 'Vaktija iz izvora koji koristite',
        body: 'Vaktija.ba za Bosnu i Hercegovinu, Vaktija.eu za gradove u 17 evropskih zemalja, Islamiska Förbundet za Švedsku, AlAdhan za cijeli svijet ili vremena izračunata za vašu lokaciju. Nova vremena se učitavaju svaki dan.',
      },
      {
        id: 'phone',
        title: 'Sve mijenjate s mobitela',
        body: 'Ekrane u glavnom prostoru i ženskom dijelu podešavate zasebno. Svaki ekran ima svoj link: otvorite ga na mobitelu, promijenite šta god želite i za nekoliko sekundi to se vidi na tom televizoru.',
      },
      {
        id: 'offline',
        title: 'Kad nestane interneta',
        body: 'Sat i odbrojavanje rade i dalje, a današnja vremena ostaju na ekranu. Izmjene i sutrašnja vremena stignu čim se internet vrati. Nakon nestanka struje ekranu treba internet da se ponovo pokrene.',
      },
      {
        id: 'dark',
        title: 'Tamni ekran za vrijeme namaza',
        body: 'Ekran se od nastupa svakog vakta može zatamniti na 5 do 45 minuta, tako da ostane samo sat i da ništa na zidu ne odvlači pažnju.',
      },
      {
        id: 'announcements',
        title: 'Obavještenja između vakata',
        body: 'Dodajte do 12 plakata ili kratkih video snimaka. Televizor ih prikazuje preko cijelog ekrana ili pored vaktije, onoliko često koliko odredite, od jednom u minuti do jednom na sat, pa se vraća na vaktiju. Snimci se puštaju bez zvuka.',
      },
      {
        id: 'screen',
        title: 'Prilagođava se vašem televizoru',
        body: 'Prikaz može biti vodoravan ili uspravan, rotiran ako je televizor okrenut na bok, i umanjen za televizore koji odsijecaju ivice slike.',
      },
      {
        id: 'languages',
        title: 'Devet jezika i vaši nazivi',
        body: 'Engleski, arapski, bosanski, švedski, turski, urdu, njemački, francuski i španski, a arapski i urdu se pišu zdesna nalijevo. Namaze i naslove možete nazvati onako kako ih zove vaš džemat.',
      },
      {
        id: 'lock',
        title: 'Kod za podešavanja i PIN',
        body: 'Od 10. do 25. minute nakon svakog namaza u uglu ekrana se pojavi mali kod, da neko od prisutnih može otvoriti podešavanja. Kod možete isključiti, a PIN, ako ga postavite, ograničava ko može praviti izmjene.',
      },
      {
        id: 'free',
        title: 'Zauvijek besplatno',
        body: 'Ništa se ne plaća, nema paketa ni reklama i ništa ne treba obnavljati. Podesite onoliko ekrana koliko vaša džamija ima zidova.',
      },
      {
        id: 'open',
        title: 'Otvoreni kod',
        body: 'Svaka linija koda javno je dostupna na GitHubu pod licencom AGPL. Pogledajte kako radi, predložite izmjenu ili pokrenite vlastitu kopiju.',
      },
    ],
  },

  devices: {
    title: 'Radi na onome što već imate',
    body: 'Kao ekran može poslužiti svaki uređaj s novijim browserom i pristupom internetu. Ako vaš televizor nema browser ili mu je browser zastario, priključite na njega mali TV stik ili stari laptop.',
    items: [
      { id: 'tv', label: 'Smart TV s browserom' },
      { id: 'stick', label: 'Fire TV Stick ili drugi TV stik s browserom' },
      { id: 'pi', label: 'Raspberry Pi ili mini PC na HDMI ulazu televizora' },
      { id: 'laptop', label: 'Stari laptop priključen na televizor' },
      { id: 'tablet', label: 'Tablet na stalku, uspravno ili vodoravno' },
    ],
  },

  faq: {
    title: 'Šta džemati najčešće pitaju',
    items: [
      {
        q: 'Koliko košta i moramo li se registrovati?',
        a: 'Ne košta ništa i ne morate. Nema pretplate ni registracije, ne treba vam ni e-mail ni lozinka. Svaki ekran pri podešavanju dobije svoj privatni link i preko tog linka ulazite u njegova podešavanja.',
      },
      {
        q: 'Šta trebamo kupiti?',
        a: 'Najčešće ništa. Potreban vam je televizor ili monitor s browserom i pristupom internetu. Ugrađeni browser na novijem smart televizoru obično radi. Ako stranica ostane prazna ili se ne prikazuje kako treba, taj browser je prestar: priključite TV stik s browserom, Raspberry Pi ili stari laptop. Nikakav poseban uređaj nije potreban.',
      },
      {
        q: 'Šta ako nestane interneta ili struje?',
        a: 'Kad nestane interneta, sat i odbrojavanje rade i dalje, a današnja vremena ostaju na ekranu. Vaše izmjene stignu čim se internet vrati. Nakon nestanka struje stranici treba internet da se ponovo učita. Televizor pamti svoj ekran, pa čim otvorite nextnamaz.com/s, vaktija je opet tu.',
      },
      {
        q: 'Odakle su vremena i jesu li tačna?',
        a: 'Iz izvora koji izaberete: Vaktija.ba, Vaktija.eu, Islamiska Förbundet, AlAdhan ili proračun, s metodom i načinom određivanja ikindije po vašem izboru. Pri podešavanju dobijete prijedlog izvora koji najbolje odgovara vašem gradu i prvo vidite današnja vremena, pa ih možete uporediti s vaktijom koju inače koristite.',
      },
      {
        q: 'Možemo li kasnije nešto promijeniti?',
        a: 'Kad god želite. Otvorite link za podešavanja na bilo kojem mobitelu ili računaru, promijenite izvor, jezik, izgled ili obavještenja i sačuvajte. Za nekoliko sekundi promjena je na televizoru. Ako izgubite link, pomjerite miš ili pritisnite bilo koje dugme na televizoru i kod će se ponovo pojaviti.',
      },
      {
        q: 'Ko može mijenjati podešavanja našeg ekrana?',
        a: 'Svako ko ima link ekrana ili skenira njegov kod s televizora. Čuvajte link kao ključ i dajte ga samo ljudima kojima vjerujete. Ako želite veću kontrolu, dodajte PIN od 4 do 8 cifara. Zaboravljeni PIN se ne može resetovati, zato ga zapišite.',
      },
      {
        q: 'Imamo više prostorija. Može li svaka imati svoj ekran?',
        a: 'Može. Svaki televizor podesite zasebno i svaki dobije svoj link, vremena, jezik i izgled. Ekran u glavnom prostoru može biti na bosanskom, a u ženskom dijelu na njemačkom, svaki sa svojim obavještenjima.',
      },
      {
        q: 'Koje jezike ekran podržava?',
        a: 'Devet: engleski, arapski, bosanski, švedski, turski, urdu, njemački, francuski i španski. Arapski i urdu se čitaju zdesna nalijevo. Nazive svih namaza i naslova na ekranu možete promijeniti. Podešavanja na mobitelu, stranice za podešavanje na televizoru i mali natpis „Scan to manage“ su na engleskom.',
      },
      {
        q: 'Može li prikazivati ikamet, džumu ili hidžretski datum?',
        a: 'Zasad ne. Ekran prikazuje nastup svakog vakta i izlazak sunca, prema izvoru koji izaberete. Vrijeme ikameta i džume, hidžretski datum i ručni unos vlastitih vremena trenutno nisu dostupni. Sat je u 24-satnom formatu, a datum u obliku dan/mjesec/godina.',
      },
      {
        q: 'Koje podatke čuvate?',
        a: 'Za svaki ekran čuvamo njegova podešavanja, grad ili koordinate, PIN u nečitljivom obliku ako ste ga postavili, te slike i video snimke koje dodate. Dodane fajlove može otvoriti svako ko zna njihovu web adresu, zato ne dodajte ništa privatno. Kad tražite grad ili koristite svoju lokaciju, mjesto pronalaze servisi Open-Meteo i BigDataCloud. Posjete stranici anonimno broji Vercel Web Analytics. Registracije nema, pa nema ni imena, ni e-mail adresa, ni lozinki.',
      },
    ],
  },

  openSource: {
    title: 'Besplatno, s otvorenim kodom',
    body: 'NextNamaz je besplatan i bez reklama. Cijeli kod je na GitHubu pod licencom AGPL-3.0, pa svaka džamija, programer ili zajednica može vidjeti kako radi, predložiti izmjene ili pokrenuti vlastitu kopiju.',
    link: {
      label: 'Pogledajte kod na GitHubu',
      href: 'https://github.com/nextnamaz/nextnamaz',
    },
  },

  cta: {
    title: 'Podesite svoj prvi ekran',
    subtitle: 'Traje oko dvije minute, a sve možete kasnije promijeniti. Uzmite mobitel i stanite pored televizora.',
    button: 'Pokrenite vaktiju',
    points: ['Zauvijek besplatno', 'Otvoreni kod', 'Bez registracije'],
  },

  footer: {
    tagline: 'Vaktija za televizor u džamiji, podešena s mobitela.',
    product: {
      heading: 'Proizvod',
      links: {
        getStarted: 'Pokrenite vaktiju',
        howItWorks: 'Kako radi',
        features: 'Mogućnosti',
        faq: 'Pitanja',
      },
    },
    project: {
      heading: 'Projekat',
      links: {
        source: 'Izvorni kod',
        license: 'Licenca',
      },
    },
    social: { github: 'NextNamaz na GitHubu', linkedin: 'Ismail Sacic na LinkedInu' },
    madeBy: {
      label: 'Izradio Ismail Sacic',
      href: 'https://ismail.sacic.dev/',
    },
    copyright: 'Ismail Sacic. NextNamaz je slobodan softver.',
    license:
      'Možete ga koristiti, proučavati, dijeliti i mijenjati pod uslovima licence GNU Affero General Public License, verzija 3.',
    timesNote:
      'Namaska vremena dolaze iz izvora izabranog za svaki ekran ili se izračunavaju za njegovu lokaciju. NextNamaz nije povezan s izdavačima vaktija koje može prikazati.',
  },
};
