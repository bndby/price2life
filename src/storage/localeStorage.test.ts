import { InMemoryStorageDriver } from './incomeStorage';
import { LocaleStorageService, STORAGE_KEY_APP_LOCALE, parseStoredLocale } from './localeStorage';

describe('LocaleStorageService', () => {
  let driver: InMemoryStorageDriver;
  let storage: LocaleStorageService;

  beforeEach(() => {
    driver = new InMemoryStorageDriver();
    storage = new LocaleStorageService(driver);
  });

  test('empty storage follows the device (no preference)', async () => {
    expect(await storage.getPreference()).toBeNull();
  });

  test('saving an App Locale persists it until cleared', async () => {
    await storage.savePreference('en');

    expect(await storage.getPreference()).toBe('en');

    await storage.clearPreference();
    expect(await storage.getPreference()).toBeNull();
  });

  test('corrupted JSON is treated as no preference', async () => {
    await driver.setItem(STORAGE_KEY_APP_LOCALE, '{not-json');
    expect(await storage.getPreference()).toBeNull();
  });

  test('foreign or invalid records are treated as no preference', () => {
    expect(parseStoredLocale({ locale: 'de' })).toBeNull();
    expect(parseStoredLocale({ locale: 'system' })).toBeNull();
    expect(parseStoredLocale('en')).toBeNull();
    expect(parseStoredLocale({ locale: 'zh-Hans', extra: true })).toBe('zh-Hans');
  });
});
