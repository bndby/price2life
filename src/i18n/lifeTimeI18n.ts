import i18n from './i18n';
import { DEFAULT_APP_LOCALE, isAppLocale, numberLocaleFor, type AppLocale } from './locales';

export interface LifeTimeI18n {
  t: (key: string, options?: Record<string, unknown>) => string;
  numberLocale: string;
}

export function appLocaleFromI18nLanguage(language: string): AppLocale {
  const base = language.split(',')[0]?.trim() ?? '';
  if (isAppLocale(base)) {
    return base;
  }
  return DEFAULT_APP_LOCALE;
}

export function getLifeTimeI18n(): LifeTimeI18n {
  const locale = appLocaleFromI18nLanguage(i18n.language);
  return {
    t: (key, options) => String(i18n.t(key, options)),
    numberLocale: numberLocaleFor(locale),
  };
}
