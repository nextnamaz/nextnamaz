import type { LandingCopy } from '@/lib/landing-copy';

/** Homepage copy in Turkish. */
export const TR: LandingCopy = {
  meta: {
    title: 'Camiler İçin Ücretsiz Namaz Vakitleri Ekranı',
    description:
      'TV, tablet ya da eski bir laptopu caminiz için namaz vakitleri ekranına çevirin. Telefonla QR kod okutup kurun. Ücretsiz; uygulama ve hesap gerekmez.',
  },
  nav: {
    howItWorks: 'Nasıl çalışır',
    features: 'Özellikler',
    faq: 'Sorular',
    getStarted: 'Ekranınızı kurun',
    home: 'NextNamaz ana sayfası',
    language: 'Dil',
  },

  hero: {
    titleLine1: 'Namaz vakitleri',
    titleLine2: 'cami ekranında.',
    subtitle:
      'Telefonunuzdan iki dakikada kurun. Televizyonda bir web sayfası açın, kodu okutun, şehrinizi seçin; vakitler ekrana gelir. Uygulama, hesap ya da özel bir cihaz gerekmez.',
    cta: 'Ekranınızı kurun',
    secondary: 'Nasıl çalışır?',
    demoAlt: 'Namaz vakitleri ekranını gösteren bir televizyon: saat, günün namaz vakitleri ve sıradaki namaza kalan süre',
  },

  oldWay: {
    title: 'Vakit çizelgesini elle değiştirmeye son',
    body: 'Birçok camide mihrabın yanında basılı bir vakit çizelgesi, duvarda da bir saat asılıdır ve çizelgeyi her ay birinin değiştirmesi gerekir. NextNamaz yeni vakitleri her gece kendisi yükler; böylece ekran, kimse dokunmadan her sabah doğru vakitleri gösterir.',
    imageAlt: 'Küçük bir camide mihrabın yanında bir duvar saati ve basılı aylık vakit çizelgesi',
    before: 'Birçok camide hâlâ böyle',
  },

  howItWorks: {
    title: 'Üç adımda kurulum',
    subtitle: 'QR kod okutabilen herkes kurabilir. Yaklaşık iki dakika sürer.',
    steps: [
      {
        title: 'Sayfayı televizyonda açın',
        description:
          'Televizyonun tarayıcısında nextnamaz.com/s adresini açın ve “Start” düğmesine basın. Televizyon kendi ekranını oluşturur ve bir QR kod gösterir.',
        detail: 'Akıllı TV, TV stick, laptop ya\u00a0da Raspberry\u00a0Pi',
        sceneAlt: 'Duvardaki televizyonun tarayıcısında nextnamaz.com/s açık ve “Start” seçili, önünde bir kumanda',
      },
      {
        title: 'Kodu telefonunuzla okutun',
        description:
          'Telefonunuzun kamerasını koda tutun. O ekranın ayarları doğrudan telefonunuzun tarayıcısında açılır.',
        detail: 'Uygulama yüklemeye gerek yok',
        sceneAlt: 'Televizyonda bir QR kod, önünde de kodu kamerasına almış bir telefon',
      },
      {
        title: 'Seçin, kaydedin, hepsi bu',
        description:
          'Şehrinizi ve vakit kaynağını, sonra dili ve görünümü seçin; isterseniz bir PIN ekleyin. Kaydedin, birkaç saniye içinde vakitler televizyonda.',
        detail: 'Sonrası için bağlantıyı saklayın',
        sceneAlt: 'Televizyonda günün namaz vakitleri, telefonda ise kurulumun son adımı ve basılmış “Turn on the display” düğmesi',
      },
    ],
  },

  display: {
    title: 'Ekranı kendiniz deneyin',
    subtitle:
      'Bunlar, telefonunuzdaki ayarlarda göreceğiniz seçenekler. Dili, görünümü ya da alttaki yazıyı değiştirin; ekran, televizyonunuzda olacağı gibi hemen değişir.',
    /** Text alternative for the demo TV in the playground. */
    screenAlt: 'Yanında seçilen ayarlarla namaz vakitlerini gösteren bir televizyon',
    controls: {
      heading: 'Ekran ayarları',
      language: 'Dil',
      theme: 'Tema',
      mode: 'Mod',
      colours: 'Renkler',
      accent: 'Vurgu rengi',
      line: 'Alttaki yazınız',
      linePlaceholder: 'Bir ayet, bir selam ya da caminizin adı',
      prayer: 'Namaz sırasında',
      prayerToggle: 'Ekranı karart',
      reset: 'Sıfırla',
    },
    themes: { default: 'Varsayılan', night: 'Gece' },
    modes: { light: 'Açık', dark: 'Koyu' },
    schemes: {
      classic: 'Klasik',
      ocean: 'Okyanus',
      emerald: 'Zümrüt',
      royal: 'Çivit',
      crimson: 'Kızıl',
      midnight: 'Gece mavisi',
    },
    accents: { amber: 'Kehribar', mint: 'Nane yeşili', azure: 'Gök mavisi' },
    note: 'Dil değişince vakit adları ve yazılar da değişir, vakitler aynı kalır. Her ekranın ayarları ayrıdır.',
  },

  orientation: {
    title: 'Yatay ya da dikey',
    body: 'Televizyonu duvar nasıl izin veriyorsa öyle asın. Girişte ya da dar bir koridorda dikey dursa bile ekran kendini buna göre düzenler.',
    landscape: 'Yatay, namaz salonunda',
    portrait: 'Dikey, girişte',
  },

  /** A whole day played through on the screen, in twelve seconds. */
  day: {
    title: 'Koca bir gün, on iki saniyede',
    body: 'Ekranın günü kendi kendine nasıl takip ettiğini izleyin. Her namaz vakti geldiğinde öne çıkar, geri sayım hep bir sonrakini gösterir. Kimsenin dokunmasına gerek yok.',
    play: 'Oynat',
    pause: 'Duraklat',
    scrub: 'Günün saati',
  },

  features: {
    title: 'Caminin işleyişine göre tasarlandı',
    subtitle: 'Her şey telefondan ayarlanır. Televizyona hiçbir şey yüklenmez.',
    imageAlt: "Cambridge Merkez Camii'nin namaz salonu ve tavana doğru dallanan ahşap sütunları",
    rooms: { womens: 'Kadınlar mahfili', main: 'Ana salon' },
    poster: {
      kicker: 'Her cumartesi',
      title: "Çocuklar için Kur'an kursu",
      details: '10:00-12:00, 6-14 yaş arası',
      action: 'Kayıtlar dernek bürosunda',
    },
    items: [
      {
        id: 'sources',
        title: 'Vakitler kullandığınız kaynaktan',
        body: 'Bosna-Hersek için Vaktija.ba, 17 Avrupa ülkesindeki şehirler için Vaktija.eu, İsveç için Islamiska Förbundet, dünyanın her yeri için AlAdhan ya da konumunuza göre hesaplama. Yeni vakitler her gün yüklenir.',
      },
      {
        id: 'phone',
        title: 'Telefonunuzdan değiştirin',
        body: 'Ana salon ve kadınlar mahfili için ayrı ayrı ekran kurun. Her ekranın kendi bağlantısı vardır: telefonunuzda açın, istediğinizi değiştirin, o televizyon birkaç saniye içinde güncellenir.',
      },
      {
        id: 'offline',
        title: 'İnternet kesilirse',
        body: 'Saat ve geri sayım işlemeye devam eder, günün vakitleri ekranda kalır. Değişiklikler ve ertesi günün vakitleri bağlantı gelince yüklenir. Elektrik kesildikten sonra ekranın yeniden açılması için internet gerekir.',
      },
      {
        id: 'dark',
        title: 'Namaz sırasında karanlık ekran',
        body: 'Her namazın vakti girdiğinde ekranı 5 ila 45 dakika karartabilirsiniz. Yalnızca saat görünür, duvarda göze takılan bir şey kalmaz.',
      },
      {
        id: 'announcements',
        title: 'Vakit aralarında duyurular',
        body: 'En fazla 12 afiş ya da kısa video yükleyin. Televizyon bunları seçtiğiniz sıklıkta, dakikada birden saatte bire kadar, tam ekran ya da vakitlerin yanında gösterir, sonra vakitlere döner. Videolar sessiz oynatılır.',
      },
      {
        id: 'screen',
        title: 'Elinizdeki televizyona uyar',
        body: 'Yatay ya da dikey kullanılabilir. Yan asılmış televizyonlar için görüntü döndürülebilir, kenarları kesen televizyonlar için de küçültülebilir.',
      },
      {
        id: 'languages',
        title: 'Dokuz dil, kendi ifadelerinizle',
        body: 'İngilizce, Arapça, Boşnakça, İsveççe, Türkçe, Urduca, Almanca, Fransızca ve İspanyolca; Arapça ve Urduca sağdan sola yazılır. Vakit adlarını ve başlıkları cemaatinizin alıştığı gibi yazın.',
      },
      {
        id: 'lock',
        title: 'Ayarlara giriş için kod ve PIN',
        body: 'Her vakit girdikten 10 dakika sonra köşede küçük bir kod çıkar ve 15 dakika kalır; salondaki biri ayarları bu kodla açabilir. Bu özelliği kapatabilirsiniz. İsteğe bağlı bir PIN ise ayarları kimin değiştirebileceğini sınırlar.',
      },
      {
        id: 'free',
        title: 'Ücretsiz, hep öyle kalacak',
        body: 'Ücret yok, paket yok, reklam yok, yenilenecek bir şey yok. Caminizde kaç duvar varsa o kadar ekran\u00a0kurun.',
      },
      {
        id: 'open',
        title: 'Açık kaynak',
        body: "Kodun her satırı GitHub'da, AGPL lisansıyla herkese açık. Nasıl çalıştığını inceleyin, bir değişiklik önerin ya da kendi kopyanızı kurun.",
      },
    ],
  },

  devices: {
    title: 'Mevcut cihazlarınızla çalışır',
    body: 'Güncel bir web tarayıcısı ve internet bağlantısı olan her cihaz vakit ekranı olabilir. Televizyonunuzda tarayıcı yoksa ya da tarayıcısı eskiyse küçük bir TV stick ya da eski bir dizüstü bilgisayar bağlayın.',
    items: [
      { id: 'tv', label: 'Tarayıcısı olan bir akıllı televizyon' },
      { id: 'stick', label: 'Fire TV Stick ya\u00a0da tarayıcısı olan başka bir TV\u00a0stick' },
      { id: 'pi', label: 'HDMI girişine takılı bir Raspberry\u00a0Pi ya\u00a0da mini bilgisayar' },
      { id: 'laptop', label: 'Televizyona bağlı eski bir dizüstü bilgisayar' },
      { id: 'tablet', label: 'Stantta dikey ya da yatay duran bir tablet' },
    ],
  },

  faq: {
    title: 'Camilerin sık sorduğu sorular',
    items: [
      {
        q: 'Ücretli mi, hesap gerekiyor mu?',
        a: 'Ücretsizdir, hesap da gerekmez. Abonelik, kayıt, e-posta ya da şifre yok. Her ekran kurulurken kendine ait özel bir bağlantı alır; ayarlarına bu bağlantıdan ulaşırsınız.',
      },
      {
        q: 'Ne satın almamız gerekiyor?',
        a: 'Çoğu zaman hiçbir şey. Web tarayıcısı ve internet bağlantısı olan bir televizyon ya da monitör gerekir. Yeni bir akıllı televizyonun kendi tarayıcısı genellikle iş görür. Sayfa boş kalıyor ya da bozuk görünüyorsa o tarayıcı çok eskidir: tarayıcısı olan bir TV stick, bir Raspberry Pi ya da eski bir dizüstü bilgisayar bağlayın. Özel bir cihaz gerekmez.',
      },
      {
        q: 'İnternet ya da elektrik kesilirse ne\u00a0olur?',
        a: 'İnternet kesilirse saat ve geri sayım işlemeye devam eder, günün vakitleri ekranda kalır; değişiklikleriniz bağlantı gelince ekrana yansır. Elektrik kesildikten sonra sayfanın yeniden açılması için internet gerekir. Televizyon kendi ekranını hatırlar; nextnamaz.com/s adresini açtığınızda ekranınız hemen geri gelir.',
      },
      {
        q: 'Vakitler nereden geliyor, doğru mu?',
        a: 'Seçtiğiniz kaynaktan: Vaktija.ba, Vaktija.eu, Islamiska Förbundet, AlAdhan ya da yöntemini ve ikindi hesabını sizin belirlediğiniz bir hesaplama. Kurulumda şehrinize en uygun kaynak önerilir ve önce günün vakitleri gösterilir; böylece bunları alıştığınız vakit çizelgesiyle karşılaştırabilirsiniz.',
      },
      {
        q: 'Sonradan değişiklik yapabilir miyiz?',
        a: 'İstediğiniz zaman. Ekranın bağlantısını herhangi bir telefonda ya da bilgisayarda açın; kaynağı, dili, görünümü ya da duyuruları değiştirip kaydedin. Televizyon birkaç saniye içinde güncellenir. Bağlantıyı kaybederseniz televizyonda fareyi oynatın ya da bir tuşa basın, kod yeniden görünür.',
      },
      {
        q: 'Ayarları kim değiştirebilir?',
        a: 'Bağlantısı elinde olan ya da televizyondaki kodu okutan herkes. Bağlantıyı bir anahtar gibi saklayın ve yalnızca güvendiğiniz kişilerle paylaşın. Daha sıkı kontrol için 4 ila 8 haneli bir PIN ekleyin. Unutulan PIN sıfırlanamaz, bu yüzden bir yere not edin.',
      },
      {
        q: 'Her salona ayrı bir ekran kurabilir\u00a0miyiz?',
        a: 'Evet. Her televizyonu ayrı kurun; her birinin kendi bağlantısı, vakitleri, dili ve görünümü olur. Ana salondaki ekran Türkçe, kadınlar mahfilindeki İngilizce olabilir; her birinin duyuruları da ayrıdır.',
      },
      {
        q: 'Ekran hangi dilleri gösterebilir?',
        a: 'Dokuz dili: İngilizce, Arapça, Boşnakça, İsveççe, Türkçe, Urduca, Almanca, Fransızca ve İspanyolca. Arapça ve Urduca sağdan sola yazılır. Ekrandaki her vakit adını ve başlığı değiştirebilirsiniz. Telefonunuzdaki ayarlar sayfası, televizyondaki kurulum ekranları ve küçük “Scan to manage” yazısı ise İngilizcedir.',
      },
      {
        q: 'Kamet vakti, cuma saati ya da hicri tarih var mı?',
        a: 'Henüz değil. Ekran, seçtiğiniz kaynağa göre her namaz vaktinin giriş saatini ve güneşin doğuşunu gösterir. Kamet vakitleri, cuma namazı saati, hicri tarih ve vakitleri elle girme seçeneği şu an için yok. Saat 24 saat biçimindedir, tarih gün/ay/yıl olarak yazılır.',
      },
      {
        q: 'Hangi verileri saklıyorsunuz?',
        a: "Her ekran için ayarları, şehri ya da koordinatları, PIN belirlediyseniz PIN'in okunamaz hâle getirilmiş bir kopyasını ve yüklediğiniz görsel ve videoları saklarız. Yüklenen dosyaları web adresini bilen herkes açabilir; bu yüzden özel bir şey yüklemeyin. Şehir arama ve “Use my location” düğmesi, yeri bulmak için Open-Meteo ve BigDataCloud hizmetlerine başvurur. Sayfa ziyaretleri Vercel Web Analytics ile anonim olarak sayılır. Hesap olmadığı için ad, e-posta ya da şifre de tutulmaz.",
      },
    ],
  },

  openSource: {
    title: 'Hep ücretsiz ve açık kaynak',
    body: "NextNamaz ücretsizdir, reklam da yoktur. Kodun tamamı AGPL-3.0 lisansıyla GitHub'da; böylece her cami, yazılımcı ya da cemaat nasıl çalıştığını inceleyebilir, değişiklik önerebilir ya da kendi kopyasını\u00a0kurabilir.",
    link: {
      label: "Kodu GitHub'da inceleyin",
      href: 'https://github.com/nextnamaz/nextnamaz',
    },
  },

  cta: {
    title: 'İlk ekranınızı kurun',
    subtitle: 'Yaklaşık iki dakika sürer ve her şeyi sonradan değiştirebilirsiniz. Telefonunuzu alıp televizyonun başına geçin.',
    button: 'Ekranınızı kurun',
    points: ['Her zaman ücretsiz', 'Açık kaynak', 'Hesap gerekmez'],
  },

  footer: {
    tagline: 'Cami televizyonu için namaz vakitleri, telefonla kurulur.',
    product: {
      heading: 'Ürün',
      links: {
        getStarted: 'Ekranınızı kurun',
        howItWorks: 'Nasıl çalışır',
        features: 'Özellikler',
        faq: 'Sorular',
      },
    },
    project: {
      heading: 'Proje',
      links: {
        source: 'Kaynak kodu',
        license: 'Lisans',
      },
    },
    social: { github: "GitHub'da NextNamaz", linkedin: "LinkedIn'de Ismail Sacic" },
    madeBy: {
      label: 'Geliştiren: Ismail Sacic',
      href: 'https://ismail.sacic.dev/',
    },
    copyright: 'Ismail Sacic. NextNamaz özgür yazılımdır.',
    license:
      "NextNamaz'ı GNU Affero Genel Kamu Lisansı'nın 3. sürümü kapsamında kullanabilir, inceleyebilir, paylaşabilir ve değiştirebilirsiniz.",
    /** The feedback form: what people write lands on /admin. */
    feedback: {
      button: 'Görüş bildirin',
      heading: 'Düşüncelerinizi bizimle paylaşın',
      intro: 'Bir sorun mu var, yoksa eksik bir şey mi? Her mesajı okuyoruz.',
      message: 'Mesajınız',
      email: 'E-posta (isteğe bağlı, yanıt isterseniz)',
      send: 'Gönder',
      sending: 'Gönderiliyor…',
      sent: 'Teşekkürler! Mesajınız bize ulaştı.',
      error: 'Gönderilemedi. Lütfen tekrar deneyin.',
      close: 'Kapat',
    },
    timesNote:
      "Namaz vakitleri her ekran için seçilen kaynaktan alınır ya da ekranın konumuna göre hesaplanır. NextNamaz'ın, vakitlerini gösterebildiği kaynaklarla herhangi bir bağı\u00a0yoktur.",
  },
};
