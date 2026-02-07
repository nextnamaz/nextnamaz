import type { PrayerTimesMap } from '@/types/database';

const PRAYER_KEYS: (keyof PrayerTimesMap)[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function extractTdText(html: string): string[] {
  const results: string[] = [];
  const regex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    results.push(match[1].replace(/<[^>]*>/g, '').trim());
  }
  return results;
}

export async function fetchIslamiskaForbundet(city: string): Promise<PrayerTimesMap> {
  const url = 'https://www.islamiskaforbundet.se/wp-content/plugins/bonetider/Bonetider_Widget.php';
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const body = new URLSearchParams({
    ifis_bonetider_page_city: `${city}, SE`,
    ifis_bonetider_page_month: String(currentMonth),
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)',
    },
    body: body.toString(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Islamiska Förbundet API error: ${res.status}`);
  }

  const html = await res.text();
  const cells = extractTdText(html);

  if (cells.length < 7) {
    throw new Error('No prayer times found in response');
  }

  // Cells are in rows of 7: [day, fajr, sunrise, dhuhr, asr, maghrib, isha]
  // Find the row matching today's day
  for (let i = 0; i < cells.length; i += 7) {
    const dayNum = parseInt(cells[i], 10);
    if (dayNum === currentDay) {
      const times = {} as PrayerTimesMap;
      for (let j = 0; j < PRAYER_KEYS.length; j++) {
        const raw = cells[i + 1 + j];
        const [h, m] = raw.split(':');
        times[PRAYER_KEYS[j]] = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
      }
      return times;
    }
  }

  throw new Error(`No prayer times found for day ${currentDay}`);
}

// --- Swedish Cities ---

export const ISLAMISKA_CITIES: string[] = [
  'Alingsås', 'Avesta', 'Bengtsfors', 'Boden', 'Bollnäs', 'Borlänge', 'Borås',
  'Enköping', 'Eskilstuna', 'Eslöv', 'Falkenberg', 'Falköping', 'Filipstad', 'Flen',
  'Gislaved', 'Gnosjö', 'Gävle', 'Göteborg',
  'Halmstad', 'Haparanda', 'Helsingborg', 'Hudiksvall', 'Hultsfred', 'Härnösand', 'Hässleholm',
  'Jokkmokk', 'Jönköping',
  'Kalmar', 'Karlskoga', 'Karlskrona', 'Karlstad', 'Katrineholm', 'Kiruna', 'Kristianstad', 'Kristinehamn', 'Köping',
  'Landskrona', 'Lessebo', 'Lidköping', 'Linköping', 'Ludvika', 'Luleå', 'Lund',
  'Malmö', 'Mariestad', 'Mellerud', 'Mjölby',
  'Norrköping', 'Norrtälje', 'Nyköping', 'Nässjö',
  'Oskarshamn', 'Oxelösund',
  'Pajala', 'Piteå',
  'Ronneby',
  'Sala', 'Simrishamn', 'Skara', 'Skellefteå', 'Skövde', 'Sollefteå', 'Stockholm', 'Strängnäs', 'Sundsvall', 'Sävsjö', 'Söderhamn', 'Södertälje',
  'Tierp', 'Tranemo', 'Trelleborg', 'Trollhättan',
  'Uddevalla', 'Ulricehamn', 'Umeå', 'Uppsala',
  'Varberg', 'Vetlanda', 'Visby', 'Vänersborg', 'Värnamo', 'Västervik', 'Västerås', 'Växjö',
  'Ystad',
  'Åmål',
  'Örebro', 'Örnsköldsvik', 'Östersund',
];
