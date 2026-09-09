import {
  DEFAULT_INCOME_SETTINGS,
  InMemoryStorageDriver,
  IncomeStorageService,
  STORAGE_KEY_USER_INCOME,
  deriveIncomeState,
  validateAndParseIncomeSettings,
} from './incomeStorage';

describe('IncomeStorageService', () => {
  let driver: InMemoryStorageDriver;
  let storage: IncomeStorageService;

  beforeEach(() => {
    driver = new InMemoryStorageDriver();
    storage = new IncomeStorageService(driver);
  });

  test('empty storage is not configured', async () => {
    expect(await storage.getSettings()).toBeNull();
    expect(await storage.isConfigured()).toBe(false);

    const derived = deriveIncomeState(null, false);
    expect(derived.isConfigured).toBe(false);
    expect(derived.hourlyRate).toBe(0);
    expect(derived.period).toBe(DEFAULT_INCOME_SETTINGS.period);
  });

  test('saving valid income marks the user as configured', async () => {
    const saved = await storage.saveSettings(150000, 'month');

    expect(saved.income).toBe(150000);
    expect(saved.period).toBe('month');
    expect(await storage.isConfigured()).toBe(true);
    expect(await storage.getSettings()).toEqual(saved);

    const derived = deriveIncomeState(saved, false);
    expect(derived.isConfigured).toBe(true);
    expect(derived.hourlyRate).toBeGreaterThan(0);
  });

  test.each([0, -1, 150000.5])('rejects invalid income %p', async (income) => {
    await expect(storage.saveSettings(income, 'month')).rejects.toThrow();
    expect(await storage.getSettings()).toBeNull();
    expect(await storage.isConfigured()).toBe(false);
  });

  test('corrupted JSON is treated as unconfigured without throwing', async () => {
    await driver.setItem(STORAGE_KEY_USER_INCOME, '{not-json');

    expect(await storage.getSettings()).toBeNull();
    expect(await storage.isConfigured()).toBe(false);
  });

  test('foreign or invalid records are treated as unconfigured', async () => {
    expect(validateAndParseIncomeSettings({ income: 0, period: 'month', updatedAt: 1 })).toBeNull();
    expect(validateAndParseIncomeSettings({ income: 150000, period: 'fortnight', updatedAt: 1 })).toBeNull();
    expect(validateAndParseIncomeSettings({ income: '150000', period: 'month', updatedAt: 1 })).toBeNull();
    expect(validateAndParseIncomeSettings({ income: 150000, period: 'month' })).toBeNull();
    expect(validateAndParseIncomeSettings({ income: 150000, period: 'month', updatedAt: Number.NaN })).toBeNull();
    expect(
      validateAndParseIncomeSettings({
        income: 150000,
        period: 'month',
        updatedAt: 1,
        extra: true,
      }),
    ).toMatchObject({ income: 150000, period: 'month' });
  });
});
