import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import he from './locales/he.json';
import { getDeviceLocale, isRtlLocale } from './locales';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));
const mockedGetLocales = getLocales as jest.Mock;

function keyPaths(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' ? keyPaths(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('getDeviceLocale', () => {
  it.each([
    ['he', 'he'],
    ['iw', 'he'],
    ['en', 'en'],
    ['ru', 'en'],
  ])('maps device language %s to %s', (languageCode, expected) => {
    mockedGetLocales.mockReturnValue([{ languageCode }]);
    expect(getDeviceLocale()).toBe(expected);
  });

  it('falls back to English when no locale is reported', () => {
    mockedGetLocales.mockReturnValue([]);
    expect(getDeviceLocale()).toBe('en');
  });
});

describe('locales', () => {
  it('marks only Hebrew as RTL', () => {
    expect(isRtlLocale('he')).toBe(true);
    expect(isRtlLocale('en')).toBe(false);
  });

  it('Hebrew and English have the same translation keys', () => {
    expect(keyPaths(he).sort()).toEqual(keyPaths(en).sort());
  });
});
