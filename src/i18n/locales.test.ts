import {
  DEFAULT_APP_LOCALE,
  languageTagToAppLocale,
  resolveAppLocaleFromDevice,
  resolveEffectiveAppLocale,
} from './locales';

describe('App Locale resolution', () => {
  test.each([
    ['ru', 'ru'],
    ['ru-RU', 'ru'],
    ['ru_RU', 'ru'],
    ['en', 'en'],
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['zh', 'zh-Hans'],
    ['zh-CN', 'zh-Hans'],
    ['zh-Hans', 'zh-Hans'],
    ['zh-TW', 'zh-Hans'],
    ['zh-HK', 'zh-Hans'],
    ['uk-UA', null],
    ['de-DE', null],
    ['pt-BR', null],
    ['', null],
  ] as const)('maps language tag %s', (tag, expected) => {
    expect(languageTagToAppLocale(tag)).toBe(expected);
  });

  test('uses the first supported device language and otherwise Russian', () => {
    expect(resolveAppLocaleFromDevice(['uk-UA', 'en-GB', 'ru-RU'])).toBe('en');
    expect(resolveAppLocaleFromDevice(['de-DE', 'fr-FR'])).toBe(DEFAULT_APP_LOCALE);
    expect(resolveAppLocaleFromDevice([])).toBe('ru');
  });

  test('saved preference wins over the device language', () => {
    expect(resolveEffectiveAppLocale('en', ['ru-RU'])).toBe('en');
    expect(resolveEffectiveAppLocale(null, ['zh-CN'])).toBe('zh-Hans');
    expect(resolveEffectiveAppLocale(null, ['uk-UA'])).toBe('ru');
  });
});
