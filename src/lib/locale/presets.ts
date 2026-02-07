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
    labels:  { prayer: 'Prayer', iqamah: 'Iqamah', begins: 'Begins', next: 'Next' },
  },
  ar: {
    prayers: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    labels:  { prayer: 'الصلاة', iqamah: 'الإقامة', begins: 'يبدأ', next: 'التالي' },
  },
  bs: {
    prayers: { fajr: 'Zora', sunrise: 'Izlazak sunca', dhuhr: 'Podne', asr: 'Ikindija', maghrib: 'Akšam', isha: 'Jacija' },
    labels:  { prayer: 'Namaz', iqamah: 'Ikamet', begins: 'Počinje', next: 'Sljedeći' },
  },
  sv: {
    prayers: { fajr: 'Fajr', sunrise: 'Soluppgång', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Bön', iqamah: 'Iqamah', begins: 'Börjar', next: 'Nästa' },
  },
  tr: {
    prayers: { fajr: 'İmsak', sunrise: 'Güneş', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
    labels:  { prayer: 'Namaz', iqamah: 'Kamet', begins: 'Başlar', next: 'Sonraki' },
  },
  ur: {
    prayers: { fajr: 'فجر', sunrise: 'طلوع آفتاب', dhuhr: 'ظہر', asr: 'عصر', maghrib: 'مغرب', isha: 'عشاء' },
    labels:  { prayer: 'نماز', iqamah: 'اقامت', begins: 'شروع', next: 'اگلی' },
  },
  de: {
    prayers: { fajr: 'Fajr', sunrise: 'Sonnenaufgang', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Gebet', iqamah: 'Iqama', begins: 'Beginnt', next: 'Nächstes' },
  },
  fr: {
    prayers: { fajr: 'Fajr', sunrise: 'Lever du soleil', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Prière', iqamah: 'Iqama', begins: 'Commence', next: 'Suivante' },
  },
  es: {
    prayers: { fajr: 'Fajr', sunrise: 'Amanecer', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    labels:  { prayer: 'Oración', iqamah: 'Iqama', begins: 'Comienza', next: 'Siguiente' },
  },
};

export const DATE_FORMAT_OPTIONS: DateFormatChoice[] = [
  { value: 'DD/MM/YYYY',    label: 'DD/MM/YYYY',       dateFnsFormat: 'dd/MM/yyyy' },
  { value: 'MM/DD/YYYY',    label: 'MM/DD/YYYY',       dateFnsFormat: 'MM/dd/yyyy' },
  { value: 'YYYY-MM-DD',    label: 'YYYY-MM-DD',       dateFnsFormat: 'yyyy-MM-dd' },
  { value: 'DD MMM YYYY',   label: 'DD MMM YYYY',      dateFnsFormat: 'dd MMM yyyy' },
  { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY',    dateFnsFormat: 'MMMM dd, yyyy' },
];

export const COMMON_TIMEZONES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Sarajevo', label: 'Sarajevo (CET/CEST)' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
];
