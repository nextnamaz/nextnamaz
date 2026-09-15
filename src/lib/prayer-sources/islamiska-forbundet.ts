import type { PrayerTimesMap } from '@/types/database';

const SWEDEN_TIME_ZONE = 'Europe/Stockholm';

interface CalendarDay {
  month: number;
  day: number;
}

// The widget serves Swedish cities only, so "today" can only mean today in Sweden:
// a UTC host is still on yesterday's date through the early-morning pre-fajr hours.
function swedishCalendarDay(now: Date): CalendarDay {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SWEDEN_TIME_ZONE,
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  const partValue = (type: Intl.DateTimeFormatPartTypes, fallback: number): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number(part.value) : fallback;
  };

  return {
    month: partValue('month', now.getMonth() + 1),
    day: partValue('day', now.getDate()),
  };
}

function extractTdText(html: string): string[] {
  const results: string[] = [];
  const regex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const [, inner = ''] = match;
    results.push(inner.replace(/<[^>]*>/g, '').trim());
  }
  return results;
}

// The widget occasionally reformats a cell; padding half of one into "HH:MM" would
// put a time on the display that the provider never published.
function padHHMM(cell: string | undefined): string {
  const [h, m] = (cell ?? '').split(':');
  if (h === undefined || m === undefined) {
    throw new Error(`Malformed prayer time cell: ${JSON.stringify(cell)}`);
  }
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

export async function fetchIslamiskaForbundet(city: string): Promise<PrayerTimesMap> {
  const url = 'https://www.islamiskaforbundet.se/wp-content/plugins/bonetider/Bonetider_Widget.php';
  const { month: currentMonth, day: currentDay } = swedishCalendarDay(new Date());

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
    // Sliced per row so a short row fails instead of borrowing the next day's cells
    const [dayCell, fajr, sunrise, dhuhr, asr, maghrib, isha] = cells.slice(i, i + 7);
    if (dayCell === undefined || parseInt(dayCell, 10) !== currentDay) continue;

    return {
      fajr: padHHMM(fajr),
      sunrise: padHHMM(sunrise),
      dhuhr: padHHMM(dhuhr),
      asr: padHHMM(asr),
      maghrib: padHHMM(maghrib),
      isha: padHHMM(isha),
    };
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
