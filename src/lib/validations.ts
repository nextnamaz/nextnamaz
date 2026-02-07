import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mosqueName: z.string().min(1, 'Mosque name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createMosqueSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const createScreenSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const prayerTimesSchema = z.object({
  fajr: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  sunrise: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  dhuhr: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  asr: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  maghrib: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  isha: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMosqueInput = z.infer<typeof createMosqueSchema>;
export type CreateScreenInput = z.infer<typeof createScreenSchema>;
export type PrayerTimesInput = z.infer<typeof prayerTimesSchema>;

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
