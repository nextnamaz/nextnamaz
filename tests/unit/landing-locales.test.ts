import { describe, expect, it } from 'vitest';
import { detectLandingLocale, landingPath, pickLanguageHref } from '@/lib/landing-locales';

describe('homepage language for a first visit', () => {
  it("follows the browser's first language we have", () => {
    expect(detectLandingLocale('sv-SE,sv;q=0.9,en;q=0.8', null)).toBe('sv');
    expect(detectLandingLocale('tr', 'DE')).toBe('tr');
    expect(detectLandingLocale('fr-FR,fr;q=0.9,de;q=0.7', null)).toBe('de');
  });

  it('respects q-values over header order', () => {
    expect(detectLandingLocale('en;q=0.4,ar;q=0.9', null)).toBe('ar');
  });

  it('serves Bosnian to Croatian and Serbian browsers', () => {
    expect(detectLandingLocale('hr-HR', null)).toBe('bs');
    expect(detectLandingLocale('sr-Latn', null)).toBe('bs');
  });

  it('lets the country decide when the browser only says English', () => {
    expect(detectLandingLocale('en-US,en;q=0.9', 'SE')).toBe('sv');
    expect(detectLandingLocale('en-GB', 'BA')).toBe('bs');
    expect(detectLandingLocale(null, 'AT')).toBe('de');
    expect(detectLandingLocale(null, 'AE')).toBe('ar');
  });

  it('falls back to English', () => {
    expect(detectLandingLocale('en-US', 'US')).toBe('en');
    expect(detectLandingLocale('ja-JP', 'JP')).toBe('en');
    expect(detectLandingLocale(null, null)).toBe('en');
    expect(detectLandingLocale('*', null)).toBe('en');
  });
});

describe('homepage addresses', () => {
  it('keeps English at the root and the rest under their code', () => {
    expect(landingPath('en')).toBe('/');
    expect(landingPath('bs')).toBe('/bs');
    expect(pickLanguageHref('en')).toBe('/?hl=en');
    expect(pickLanguageHref('ar')).toBe('/ar?hl=ar');
  });
});
