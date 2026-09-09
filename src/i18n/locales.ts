export const APP_LOCALES = ['ru', 'en', 'zh-Hans'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_APP_LOCALE: AppLocale = 'ru';

export const APP_LOCALE_ENDONYMS: Record<AppLocale, string> = {
  ru: 'Русский',
  en: 'English',
  'zh-Hans': '中文',
};

export const NUMBER_LOCALES: Record<AppLocale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  'zh-Hans': 'zh-CN',
};

export const PICKER_LOCALE_ORDER: readonly AppLocale[] = ['ru', 'en', 'zh-Hans'];

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'ru' || value === 'en' || value === 'zh-Hans';
}

export function languageTagToAppLocale(tag: string): AppLocale | null {
  const normalized = tag.trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) {
    return null;
  }

  const language = normalized.split('-')[0];
  if (language === 'zh') {
    return 'zh-Hans';
  }
  if (language === 'en') {
    return 'en';
  }
  if (language === 'ru') {
    return 'ru';
  }
  return null;
}

export function resolveAppLocaleFromDevice(languageTags: readonly string[]): AppLocale {
  for (const tag of languageTags) {
    const mapped = languageTagToAppLocale(tag);
    if (mapped) {
      return mapped;
    }
  }
  return DEFAULT_APP_LOCALE;
}

export function resolveEffectiveAppLocale(
  preference: AppLocale | null,
  deviceLanguageTags: readonly string[],
): AppLocale {
  if (preference) {
    return preference;
  }
  return resolveAppLocaleFromDevice(deviceLanguageTags);
}

export function numberLocaleFor(locale: AppLocale): string {
  return NUMBER_LOCALES[locale];
}

export function readDeviceLanguageTags(
  locales: readonly { languageTag?: string | null; languageCode?: string | null }[],
): string[] {
  const tags: string[] = [];
  for (const locale of locales) {
    if (locale.languageTag) {
      tags.push(locale.languageTag);
    } else if (locale.languageCode) {
      tags.push(locale.languageCode);
    }
  }
  return tags;
}
