import type { LandingCopy } from '@/lib/landing-copy';

/** Homepage copy in Bosnian. */
export const BS: LandingCopy = {
  meta: {
    title: 'Besplatna digitalna vaktija za televizor u džamiji',
    description:
      'TV, tablet ili stari laptop pretvorite u vaktiju za džamiju. Podesite je mobitelom preko QR koda. Besplatna, otvorenog koda, bez aplikacije i registracije.',
  },
  nav: {
    howItWorks: 'Kako radi',
    features: 'Mogućnosti',
    faq: 'Česta pitanja',
    getStarted: 'Pokrenite vaktiju',
    home: 'NextNamaz, početna stranica',
    language: 'Jezik',
  },

  hero: {
    titleLine1: 'Vaktija na televizoru',
    titleLine2: 'u vašoj džamiji.',
    subtitle:
      'Za dvije minute sve podesite s mobitela. Na televizoru otvorite web stranicu, skenirajte QR kod, izaberite grad i vaktija je na ekranu. Bez aplikacije, bez registracije i potpuno besplatno.',
    cta: 'Pokrenite vaktiju',
    secondary: 'Pogledajte kako radi',
    demoAlt: 'Televizor s vaktijom: sat, današnja namaska vremena i odbrojavanje do sljedećeg namaza',
  },

  oldWay: {
    title: 'Vaktiju više ne mijenjate ručno',
    body: 'U mnogim džamijama pored mihraba visi odštampana vaktija, a na zidu sat. Svakog mjeseca neko mora okačiti novu. NextNamaz svake noći sam preuzima nova vremena, pa je vaktija na ekranu svako jutro tačna, a niko je ne mora dirati.',
    imageAlt: 'Zidni sat i odštampana mjesečna vaktija pored mihraba male džamije',
    before: 'Danas u mnogim džamijama',
  },

  howItWorks: {
    title: 'U tri koraka do vaktije na ekranu',
    subtitle: 'Ako znate skenirati QR kod, snaći ćete se i ovdje. Sve skupa traje oko dvije minute.',
    steps: [
      {
        title: 'Otvorite stranicu na televizoru',
        description:
          'U internet pretraživaču (browseru) na televizoru otvorite nextnamaz.com/s i pritisnite „Start“. Na ekranu će se zatim pojaviti QR kod.',
        detail: 'Smart TV, TV stik, laptop ili Raspberry Pi',
        sceneAlt: 'Televizor na zidu s otvorenom stranicom nextnamaz.com/s i označenim dugmetom „Start“, a ispred njega daljinski',
      },
      {
        title: 'Skenirajte kod mobitelom',
        description:
          'Uperite kameru mobitela u kod. Na mobitelu će se odmah otvoriti podešavanja za taj televizor.',
        detail: 'Ne morate ništa instalirati',
        sceneAlt: 'Televizor s QR kodom i mobitel podignut prema njemu, s kodom u kadru kamere',
      },
      {
        title: 'Izaberite, sačuvajte i gotovo',
        description:
          'Izaberite grad i izvor vaktije, zatim jezik i izgled, a po želji postavite i PIN. Sačuvajte i za nekoliko sekundi vaktija je na televizoru.',
        detail: 'Čuvajte link, trebat će vam za izmjene',
        sceneAlt: 'Televizor s današnjim namaskim vremenima i mobitel na posljednjem koraku podešavanja, s pritisnutim dugmetom „Turn on the display“',
      },
    ],
  },

  display: {
    title: 'Isprobajte sami',
    subtitle:
      'Ovo su opcije koje ćete imati i u podešavanjima na mobitelu. Promijenite jezik, izgled ili tekst na dnu i pogledajte kako se ekran mijenja. Kad sačuvate, tako će izgledati i vaktija na vašem televizoru.',
    /** Text alternative for the demo TV in the playground. */
    screenAlt: 'Televizor s vaktijom koja se mijenja prema podešavanjima pored njega',
    controls: {
      heading: 'Podešavanja',
      language: 'Jezik',
      theme: 'Tema',
      mode: 'Režim',
      colours: 'Paleta boja',
      accent: 'Boja isticanja',
      line: 'Tekst na dnu ekrana',
      linePlaceholder: 'Ajet, selam ili naziv džamije',
      prayer: 'Za vrijeme namaza',
      prayerToggle: 'Tamni ekran',
      reset: 'Ispočetka',
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
    body: 'Okačite televizor kako vam prostor dopušta. Ako stoji uspravno pored ulaza ili u uskom hodniku, vaktija se sama preslaže da sve stane.',
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
      details: 'Od 10 do 12 sati, uzrast od 6 do 14 godina',
      action: 'Upis kod imama',
    },
    items: [
      {
        id: 'sources',
        title: 'Vaktija po kojoj već klanjate',
        body: 'Vaktija.ba za Bosnu i Hercegovinu, Vaktija.eu za gradove u 17 evropskih zemalja, Islamiska Förbundet za Švedsku, AlAdhan za cijeli svijet ili proračun za vašu lokaciju. Nova vremena učitavaju se svaki dan.',
      },
      {
        id: 'phone',
        title: 'Izmjene s bilo kojeg mobitela',
        body: 'Ekrane u glavnom prostoru i ženskom dijelu podešavate zasebno. Svaki ekran ima svoj link: otvorite ga na mobitelu, promijenite šta god želite i promjena se za nekoliko sekundi vidi na tom televizoru.',
      },
      {
        id: 'offline',
        title: 'Kad nestane interneta',
        body: 'Sat i odbrojavanje rade i dalje, a današnja vremena ostaju na ekranu. Izmjene i sutrašnja vremena stići će čim se internet vrati. Nakon nestanka struje ekran se ponovo pokreće tek kad ima interneta.',
      },
      {
        id: 'dark',
        title: 'Tamni ekran za vrijeme namaza',
        body: 'Od nastupa svakog vakta ekran se može zatamniti na 5 do 45 minuta. Na crnoj pozadini ostaje samo sat, pa ništa na zidu ne odvlači pažnju.',
      },
      {
        id: 'announcements',
        title: 'Obavještenja između namaza',
        body: 'Dodajte do 12 plakata ili kratkih video snimaka. Televizor ih prikazuje preko cijelog ekrana ili pored vaktije, pa se vraća na vaktiju. Koliko često, birate sami: od svake minute do jednom na sat. Snimci se puštaju bez zvuka.',
      },
      {
        id: 'screen',
        title: 'Prilagođava se vašem televizoru',
        body: 'Prikaz može biti vodoravan ili uspravan. Ako je televizor na zidu okrenut za 90 stepeni, prikaz možete zaokrenuti, a ako odsijeca ivice slike, možete ga smanjiti.',
      },
      {
        id: 'languages',
        title: 'Devet jezika, a nazive birate sami',
        body: 'Engleski, arapski, bosanski, švedski, turski, urdu, njemački, francuski i španski. Arapski i urdu pišu se zdesna nalijevo. Namaze i naslove možete nazvati onako kako se kaže u vašem džematu, recimo Sabah umjesto Zora.',
      },
      {
        id: 'lock',
        title: 'QR kod za podešavanja i PIN',
        body: 'Od 10. do 25. minute nakon nastupa svakog vakta u uglu ekrana prikazuje se mali QR kod preko kojeg neko od prisutnih može otvoriti podešavanja. Kod možete isključiti. Ako postavite PIN, podešavanja može mijenjati samo onaj ko ga zna.',
      },
      {
        id: 'free',
        title: 'Zauvijek besplatno',
        body: 'Ništa se ne plaća: nema pretplate, nema reklama i ništa ne ističe. Podesite onoliko ekrana koliko vaša džamija ima zidova.',
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
    body: 'Kao ekran može poslužiti svaki uređaj s internetom i novijim browserom. Ako televizor nema browser ili je njegov zastario, priključite na njega mali TV stik ili stari laptop.',
    items: [
      { id: 'tv', label: 'Smart TV s browserom' },
      { id: 'stick', label: 'Fire TV Stick ili drugi TV stik s browserom' },
      { id: 'pi', label: 'Raspberry Pi ili mini-PC priključen na HDMI ulaz televizora' },
      { id: 'laptop', label: 'Stari laptop priključen na televizor' },
      { id: 'tablet', label: 'Tablet na stalku, uspravno ili vodoravno' },
    ],
  },

  faq: {
    title: 'Šta džemati najčešće pitaju',
    items: [
      {
        q: 'Koliko košta i moramo li se registrovati?',
        a: 'Ne košta ništa i ne morate se registrovati. Nema pretplate, ne treba vam ni e-mail ni lozinka. Svaki ekran pri postavljanju dobije svoj privatni link, a preko njega ulazite u podešavanja.',
      },
      {
        q: 'Trebamo li nešto kupiti?',
        a: 'Najčešće ništa. Treba vam televizor ili monitor s internetom i browserom. Na novijim smart televizorima ugrađeni browser obično radi. Ako stranica ostane prazna ili se ne prikazuje kako treba, browser je prestar, pa priključite TV stik, Raspberry Pi ili stari laptop. Nikakav namjenski uređaj za vaktiju ne treba.',
      },
      {
        q: 'Šta ako nestane interneta ili struje?',
        a: 'Kad nestane interneta, sat i odbrojavanje rade i dalje, a današnja vremena ostaju na ekranu. Vaše izmjene stići će čim se internet vrati. Nakon nestanka struje stranica se može ponovo učitati tek kad ima interneta. Televizor pamti svoju vaktiju, pa čim ponovo otvorite nextnamaz.com/s, ona je opet tu.',
      },
      {
        q: 'Odakle su namaska vremena i jesu li tačna?',
        a: 'Iz izvora koji izaberete: Vaktija.ba, Vaktija.eu, Islamiska Förbundet, AlAdhan ili proračun, gdje sami birate metodu i ikindiju po hanefijskom ili šafijskom mezhebu. Pri podešavanju dobijete prijedlog izvora koji najbolje odgovara vašem gradu i prvo vidite današnja vremena, pa ih možete uporediti s vaktijom koju inače koristite.',
      },
      {
        q: 'Možemo li kasnije nešto promijeniti?',
        a: 'Kad god želite. Otvorite link za podešavanja na bilo kojem mobitelu ili računaru, promijenite izvor, jezik, izgled ili obavještenja i sačuvajte. Za nekoliko sekundi promjena je na televizoru. Ako izgubite link, pomjerite miš ili pritisnite neko dugme na daljinskom ili tastaturi i QR kod će se ponovo pojaviti.',
      },
      {
        q: 'Ko može mijenjati podešavanja našeg ekrana?',
        a: 'Svako ko ima link ekrana ili skenira njegov kod s televizora. Čuvajte link kao ključ od džamije i dajte ga samo ljudima kojima vjerujete. Za dodatnu zaštitu postavite PIN od 4 do 8 cifara. Zaboravljeni PIN nije moguće vratiti ni zamijeniti novim, zato ga zapišite.',
      },
      {
        q: 'Imamo više prostorija. Može li svaka imati svoj ekran?',
        a: 'Može. Svaki televizor podešavate zasebno i svaki ima svoj link, vremena, jezik i izgled. Ekran u glavnom prostoru može biti na bosanskom, a onaj u ženskom dijelu na njemačkom, s drugačijim obavještenjima.',
      },
      {
        q: 'Koje jezike ekran podržava?',
        a: 'Devet: engleski, arapski, bosanski, švedski, turski, urdu, njemački, francuski i španski. Arapski i urdu pišu se zdesna nalijevo. Nazive svih namaza i naslova na ekranu možete promijeniti. Na engleskom su podešavanja na mobitelu, stranice za postavljanje na televizoru i mali natpis „Scan to manage“.',
      },
      {
        q: 'Može li ekran prikazati vrijeme ikameta, džume ili hidžretski datum?',
        a: 'Zasad ne. Ekran prikazuje nastup svakog vakta i izlazak sunca, prema izvoru koji izaberete. Vrijeme ikameta i džume i hidžretski datum još ne prikazuje, a vremena ne možete ni ručno upisati. Sat je u 24-satnom formatu, a datum u obliku dan/mjesec/godina.',
      },
      {
        q: 'Koje podatke čuvate?',
        a: 'Za svaki ekran čuvamo podešavanja, grad ili koordinate te slike i video snimke koje dodate. Ako postavite PIN, čuvamo ga u nečitljivom obliku. Dodane slike i snimke može otvoriti svako ko ima njihov link, zato ne dodajte ništa privatno. Kad tražite grad ili koristite svoju lokaciju, mjesto pronalaze servisi Open-Meteo i BigDataCloud. Posjete stranici anonimno broji Vercel Web Analytics. Registracije nema, pa nema ni imena, ni e-mail adresa, ni lozinki.',
      },
    ],
  },

  openSource: {
    title: 'Zauvijek besplatno, s otvorenim kodom',
    body: 'NextNamaz je besplatan i bez reklama. Cijeli kod je na GitHubu pod licencom AGPL-3.0, pa džamije, zajednice i programeri mogu vidjeti kako radi, predložiti izmjene ili pokrenuti vlastitu kopiju.',
    link: {
      label: 'Pogledajte kod na GitHubu',
      href: 'https://github.com/nextnamaz/nextnamaz',
    },
  },

  cta: {
    title: 'Vaktija na zidu vaše džamije, već danas',
    subtitle: 'Traje oko dvije minute, a sve možete kasnije promijeniti. Pripremite mobitel i stanite pored televizora.',
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
        faq: 'Česta pitanja',
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
      'Možete ga koristiti, proučavati, dijeliti i mijenjati pod uslovima licence GNU Affero General Public License, verzije 3.',
    timesNote:
      'Namaska vremena preuzimaju se iz izvora koji je izabran za pojedini ekran ili se izračunavaju za njegovu lokaciju. NextNamaz nije službeno povezan ni s jednim izdavačem vaktije čija vremena prikazuje.',
  },
};
