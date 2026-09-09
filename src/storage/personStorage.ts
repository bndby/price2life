import {
  isSex,
  isValidCalendarDate,
  remainingLifeYears,
  type CalendarDate,
  type Sex,
} from '../core/remainingLife';
import type { StorageDriver } from './incomeStorage';

export const STORAGE_KEY_USER_PERSON = '@price2life/user_person_v1';

export interface PersonSettings {
  readonly dateOfBirth: CalendarDate;
  readonly sex: Sex;
  readonly updatedAt: number;
}

export function validateAndParsePersonSettings(raw: unknown): PersonSettings | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const dateOfBirth = candidate.dateOfBirth;
  if (!dateOfBirth || typeof dateOfBirth !== 'object') {
    return null;
  }

  const dob = dateOfBirth as Record<string, unknown>;
  const parsedDate: CalendarDate = {
    year: dob.year as number,
    month: dob.month as number,
    day: dob.day as number,
  };

  if (
    typeof parsedDate.year !== 'number' ||
    typeof parsedDate.month !== 'number' ||
    typeof parsedDate.day !== 'number' ||
    !isValidCalendarDate(parsedDate)
  ) {
    return null;
  }

  if (!isSex(candidate.sex)) {
    return null;
  }

  if (typeof candidate.updatedAt !== 'number' || Number.isNaN(candidate.updatedAt)) {
    return null;
  }

  return {
    dateOfBirth: parsedDate,
    sex: candidate.sex,
    updatedAt: candidate.updatedAt,
  };
}

export class PersonStorageService {
  private driver: StorageDriver;

  constructor(driver: StorageDriver) {
    this.driver = driver;
  }

  async getSettings(): Promise<PersonSettings | null> {
    try {
      const serialized = await this.driver.getItem(STORAGE_KEY_USER_PERSON);
      if (!serialized) {
        return null;
      }
      return validateAndParsePersonSettings(JSON.parse(serialized));
    } catch {
      return null;
    }
  }

  async saveSettings(dateOfBirth: CalendarDate, sex: Sex): Promise<PersonSettings> {
    if (!isValidCalendarDate(dateOfBirth)) {
      throw new Error('Date of Birth must be a real calendar date');
    }
    if (!isSex(sex)) {
      throw new Error('Sex must be male or female');
    }

    const settings: PersonSettings = {
      dateOfBirth,
      sex,
      updatedAt: Date.now(),
    };
    await this.driver.setItem(STORAGE_KEY_USER_PERSON, JSON.stringify(settings));
    return settings;
  }

  async clearSettings(): Promise<void> {
    await this.driver.removeItem(STORAGE_KEY_USER_PERSON);
  }
}

export interface PersonContextState {
  readonly isLoading: boolean;
  readonly dateOfBirth: CalendarDate | null;
  readonly sex: Sex | null;
  readonly remainingLifeYears: number | null;
  readonly today: CalendarDate;
  savePerson(dateOfBirth: CalendarDate, sex: Sex): Promise<boolean>;
  clearPerson(): Promise<void>;
}

export function derivePersonState(
  settings: PersonSettings | null,
  isLoading: boolean,
  today: CalendarDate,
): Omit<PersonContextState, 'savePerson' | 'clearPerson'> {
  const remaining =
    settings === null ? null : remainingLifeYears(settings.dateOfBirth, settings.sex, today);

  return {
    isLoading,
    dateOfBirth: settings?.dateOfBirth ?? null,
    sex: settings?.sex ?? null,
    remainingLifeYears: remaining,
    today,
  };
}
