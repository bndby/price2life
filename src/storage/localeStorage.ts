import { isAppLocale, type AppLocale } from '../i18n/locales';
import type { StorageDriver } from './incomeStorage';

export const STORAGE_KEY_APP_LOCALE = '@price2life/app_locale_v1';

export function parseStoredLocale(raw: unknown): AppLocale | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  if (!isAppLocale(candidate.locale)) {
    return null;
  }

  return candidate.locale;
}

export class LocaleStorageService {
  private driver: StorageDriver;

  constructor(driver: StorageDriver) {
    this.driver = driver;
  }

  async getPreference(): Promise<AppLocale | null> {
    try {
      const serialized = await this.driver.getItem(STORAGE_KEY_APP_LOCALE);
      if (!serialized) {
        return null;
      }
      const parsed = JSON.parse(serialized);
      return parseStoredLocale(parsed);
    } catch {
      return null;
    }
  }

  async savePreference(locale: AppLocale): Promise<void> {
    if (!isAppLocale(locale)) {
      throw new Error(`Unsupported App Locale: ${String(locale)}`);
    }

    await this.driver.setItem(
      STORAGE_KEY_APP_LOCALE,
      JSON.stringify({ locale, updatedAt: Date.now() }),
    );
  }

  async clearPreference(): Promise<void> {
    await this.driver.removeItem(STORAGE_KEY_APP_LOCALE);
  }
}
