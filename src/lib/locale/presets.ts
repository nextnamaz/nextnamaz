import type {
  SupportedLocale,
  LanguageOption,
  DisplayTextConfig,
  DateFormatChoice,
} from '@/types/locale';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English',  nativeName: 'English',   flag: '🇬🇧', rtl: false },
  { code: 'ar', name: 'Arabic',   nativeName: 'العربية',   flag: '🇸🇦', rtl: true  },
  { code: 'bs', name: 'Bosanski', nativeName: 'Bosanski',  flag: '🇧🇦', rtl: false },
  { code: 'sv', name: 'Svenska',  nativeName: 'Svenska',   flag: '🇸🇪', rtl: false },
  { code: 'tr', name: 'Turkish',  nativeName: 'Türkçe',    flag: '🇹🇷', rtl: false },
  { code: 'ur', name: 'Urdu',     nativeName: 'اردو',      flag: '🇵🇰', rtl: true  },
  { code: 'de', name: 'German',   nativeName: 'Deutsch',   flag: '🇩🇪', rtl: false },
  { code: 'fr', name: 'French',   nativeName: 'Français',  flag: '🇫🇷', rtl: false },
  { code: 'es', name: 'Spanish',  nativeName: 'Español',   flag: '🇪🇸', rtl: false },
];

export const DEFAULT_TRANSLATIONS: Record<SupportedLocale, DisplayTextConfig> = {
  en: {
    prayers: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Prayer', iqamah: 'Iqamah', begins: 'Begins', next: 'Next', now: 'Now', until: 'in', remaining: 'remaining', elapsed: 'passed', today: 'Today', jumuah: "Jumu'ah", adhan: 'Adhan' },
  },
  ar: {
    prayers: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    labels:  { prayer: 'الصلاة', iqamah: 'الإقامة', begins: 'يبدأ', next: 'التالي', now: 'الآن', until: 'بعد', remaining: 'متبقٍ', elapsed: 'انقضى', today: 'اليوم', jumuah: 'الجمعة', adhan: 'الأذان' },
  },
  bs: {
    prayers: { fajr: 'Zora', sunrise: 'Izlazak sunca', dhuhr: 'Podne', asr: 'Ikindija', maghrib: 'Akšam', isha: 'Jacija' },
    labels:  { prayer: 'Namaz', iqamah: 'Ikamet', begins: 'Počinje', next: 'Sljedeći', now: 'Sada', until: 'za', remaining: 'preostalo', elapsed: 'prošlo', today: 'Danas', jumuah: 'Džuma', adhan: 'Ezan' },
  },
  sv: {
    prayers: { fajr: 'Fajr', sunrise: 'Soluppgång', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Bön', iqamah: 'Iqamah', begins: 'Börjar', next: 'Nästa', now: 'Nu', until: 'om', remaining: 'kvar', elapsed: 'passerat', today: 'Idag', jumuah: 'Fredagsbön', adhan: 'Adhan' },
  },
  tr: {
    prayers: { fajr: 'İmsak', sunrise: 'Güneş', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
    labels:  { prayer: 'Namaz', iqamah: 'Kamet', begins: 'Başlar', next: 'Sonraki', now: 'Şimdi', until: 'sonra', remaining: 'kaldı', elapsed: 'geçti', today: 'Bugün', jumuah: 'Cuma', adhan: 'Ezan' },
  },
  ur: {
    prayers: { fajr: 'فجر', sunrise: 'طلوع آفتاب', dhuhr: 'ظہر', asr: 'عصر', maghrib: 'مغرب', isha: 'عشاء' },
    labels:  { prayer: 'نماز', iqamah: 'اقامت', begins: 'شروع', next: 'اگلی', now: 'ابھی', until: 'میں', remaining: 'باقی', elapsed: 'گزر گیا', today: 'آج', jumuah: 'جمعہ', adhan: 'اذان' },
  },
  de: {
    prayers: { fajr: 'Fajr', sunrise: 'Sonnenaufgang', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Gebet', iqamah: 'Iqama', begins: 'Beginnt', next: 'Nächstes', now: 'Jetzt', until: 'in', remaining: 'verbleibend', elapsed: 'vergangen', today: 'Heute', jumuah: 'Freitagsgebet', adhan: 'Adhan' },
  },
  fr: {
    prayers: { fajr: 'Fajr', sunrise: 'Lever du soleil', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Prière', iqamah: 'Iqama', begins: 'Commence', next: 'Suivante', now: 'Maintenant', until: 'dans', remaining: 'restant', elapsed: 'écoulé', today: "Aujourd'hui", jumuah: 'Joumouʿa', adhan: 'Adhan' },
  },
  es: {
    prayers: { fajr: 'Fajr', sunrise: 'Amanecer', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Oración', iqamah: 'Iqama', begins: 'Comienza', next: 'Siguiente', now: 'Ahora', until: 'en', remaining: 'restante', elapsed: 'transcurrido', today: 'Hoy', jumuah: "Yumu'a", adhan: 'Adhan' },
  },
};

export const DATE_FORMAT_OPTIONS: DateFormatChoice[] = [
  { value: 'DD/MM/YYYY',    label: 'DD/MM/YYYY',       dateFnsFormat: 'dd/MM/yyyy' },
  { value: 'MM/DD/YYYY',    label: 'MM/DD/YYYY',       dateFnsFormat: 'MM/dd/yyyy' },
  { value: 'YYYY-MM-DD',    label: 'YYYY-MM-DD',       dateFnsFormat: 'yyyy-MM-dd' },
  { value: 'DD MMM YYYY',   label: 'DD MMM YYYY',      dateFnsFormat: 'dd MMM yyyy' },
  { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY',    dateFnsFormat: 'MMMM dd, yyyy' },
  { value: 'EEEE · MMMM DD, YYYY', label: 'Day · MMMM DD, YYYY', dateFnsFormat: "EEEE · MMMM dd, yyyy" },
];
