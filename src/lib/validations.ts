import { z } from 'zod';
import { TIME_24H } from '@/lib/display-schedule';

export const prayerTimesSchema = z.object({
  fajr: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  sunrise: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  dhuhr: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  asr: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  maghrib: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  isha: z.string().regex(TIME_24H, 'Must be HH:MM format'),
});
