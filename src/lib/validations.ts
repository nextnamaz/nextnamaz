import { z } from 'zod';

export const prayerTimesSchema = z.object({
  fajr: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  sunrise: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  dhuhr: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  asr: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  maghrib: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  isha: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
});
