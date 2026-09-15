import { z } from 'zod';

// Range-checked, not merely HH:MM-shaped: minutesOf() in display-schedule cannot
// parse an impossible clock time, so the prayer would drop out of the schedule.
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

export const prayerTimesSchema = z.object({
  fajr: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  sunrise: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  dhuhr: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  asr: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  maghrib: z.string().regex(TIME_24H, 'Must be HH:MM format'),
  isha: z.string().regex(TIME_24H, 'Must be HH:MM format'),
});
