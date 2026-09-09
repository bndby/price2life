import { InMemoryStorageDriver } from './incomeStorage';
import {
  STORAGE_KEY_USER_PERSON,
  PersonStorageService,
  derivePersonState,
  validateAndParsePersonSettings,
} from './personStorage';

const today = { year: 2026, month: 9, day: 10 };

describe('PersonStorageService', () => {
  let driver: InMemoryStorageDriver;
  let storage: PersonStorageService;

  beforeEach(() => {
    driver = new InMemoryStorageDriver();
    storage = new PersonStorageService(driver);
  });

  test('empty storage has no remaining life', async () => {
    expect(await storage.getSettings()).toBeNull();
    const derived = derivePersonState(null, false, today);
    expect(derived.remainingLifeYears).toBeNull();
    expect(derived.today).toEqual(today);
  });

  test('saving date of birth and sex makes remaining life retrievable', async () => {
    const saved = await storage.saveSettings({ year: 1996, month: 9, day: 10 }, 'male');

    expect(saved.dateOfBirth).toEqual({ year: 1996, month: 9, day: 10 });
    expect(saved.sex).toBe('male');
    expect(await storage.getSettings()).toEqual(saved);

    const derived = derivePersonState(saved, false, today);
    expect(derived.remainingLifeYears).toBeCloseTo(43.099, 3);
  });

  test('rejects an impossible calendar date', async () => {
    await expect(storage.saveSettings({ year: 2020, month: 2, day: 30 }, 'female')).rejects.toThrow();
    expect(await storage.getSettings()).toBeNull();
  });

  test('corrupted JSON is treated as missing without throwing', async () => {
    await driver.setItem(STORAGE_KEY_USER_PERSON, '{not-json');
    expect(await storage.getSettings()).toBeNull();
  });

  test('foreign records are ignored', () => {
    expect(validateAndParsePersonSettings({ sex: 'male', updatedAt: 1 })).toBeNull();
    expect(
      validateAndParsePersonSettings({
        dateOfBirth: { year: 1996, month: 9, day: 10 },
        sex: 'other',
        updatedAt: 1,
      }),
    ).toBeNull();
  });
});
