import { describe, expect, it } from 'vitest';
import { formatDateWithoutYear } from '@/lib/display-locale';
import type { DisplayLocale } from '@/lib/display-locale';
import { DEFAULT_TRANSLATIONS, LANGUAGES } from '@/lib/locale/presets';

const DAY = new Date(2026, 10, 22, 12);

function localeOf(code: string): DisplayLocale {
  return { ...(DEFAULT_TRANSLATIONS as Record<string, object>)[code], locale: code } as DisplayLocale;
}

describe('formatDateWithoutYear', () => {
  it("keeps each language's own order and punctuation", () => {
    expect(formatDateWithoutYear(DAY, localeOf('sv'))).toBe('Söndag 22 november');
    expect(formatDateWithoutYear(DAY, localeOf('bs'))).toBe('Nedjelja, 22. novembar');
    expect(formatDateWithoutYear(DAY, localeOf('de'))).toBe('Sonntag, 22. November');
    expect(formatDateWithoutYear(DAY, localeOf('tr'))).toBe('22 Kasım Pazar');
    expect(formatDateWithoutYear(DAY, localeOf('es'))).toBe('Domingo, 22 de noviembre');
    expect(formatDateWithoutYear(DAY, localeOf('ar'))).toBe('الأحد، 22 نوفمبر');
  });

  it('leaves no year and no loose ends in any language a screen can use', () => {
    for (const { code } of LANGUAGES) {
      const text = formatDateWithoutYear(DAY, localeOf(code));
      expect(text, code).not.toMatch(/\d{4}/);
      expect(text, code).not.toMatch(/[,.\s]$|\sde$/);
      expect(text, code).toContain('22');
    }
  });
});
