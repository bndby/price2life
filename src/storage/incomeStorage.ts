/**
 * Модуль персистентного хранения настроек дохода пользователя.
 * Использует @react-native-async-storage/async-storage с валидацией схемы и изоляцией ключей.
 */

import type { IncomePeriod } from '../core/calculator.ts';
import { calculateHourlyRate } from '../core/calculator.ts';

export const STORAGE_KEY_USER_INCOME = '@price2life/user_income_v1';

export interface UserIncomeSettings {
  readonly income: number;
  readonly period: IncomePeriod;
  readonly updatedAt: number;
}

export const VALID_INCOME_PERIODS: readonly IncomePeriod[] = [
  'hour',
  'day',
  'week',
  'month',
  'year',
] as const;

export const DEFAULT_INCOME_SETTINGS: UserIncomeSettings = {
  income: 0,
  period: 'month',
  updatedAt: 0,
};

export interface StorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * In-memory реализация драйвера хранилища (для тестов, серверных сред и фаллбеков).
 */
export class InMemoryStorageDriver implements StorageDriver {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Валидирует и парсит сырой JSON объект в UserIncomeSettings.
 */
export function validateAndParseIncomeSettings(raw: unknown): UserIncomeSettings | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (
    typeof candidate.income !== 'number' ||
    Number.isNaN(candidate.income) ||
    candidate.income < 0 ||
    !Number.isInteger(candidate.income)
  ) {
    return null;
  }

  if (
    typeof candidate.period !== 'string' ||
    !VALID_INCOME_PERIODS.includes(candidate.period as IncomePeriod)
  ) {
    return null;
  }

  const updatedAt =
    typeof candidate.updatedAt === 'number' && !Number.isNaN(candidate.updatedAt)
      ? candidate.updatedAt
      : Date.now();

  return {
    income: candidate.income,
    period: candidate.period as IncomePeriod,
    updatedAt,
  };
}

/**
 * Класс управления хранилищем дохода.
 */
export class IncomeStorageService {
  private driver: StorageDriver;

  constructor(driver: StorageDriver) {
    this.driver = driver;
  }

  /**
   * Считывает сохраненные настройки дохода.
   * Возвращает null, если запись отсутствует или повреждена.
   */
  async getSettings(): Promise<UserIncomeSettings | null> {
    try {
      const serialized = await this.driver.getItem(STORAGE_KEY_USER_INCOME);
      if (!serialized) {
        return null;
      }
      const parsed = JSON.parse(serialized);
      return validateAndParseIncomeSettings(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Сохраняет настройки дохода.
   * Выбрасывает ошибку, если доход <= 0 или не целое число.
   */
  async saveSettings(income: number, period: IncomePeriod): Promise<UserIncomeSettings> {
    if (typeof income !== 'number' || Number.isNaN(income) || income <= 0 || !Number.isInteger(income)) {
      throw new Error('Доход должен быть положительным целым числом');
    }

    if (!VALID_INCOME_PERIODS.includes(period)) {
      throw new Error(`Недопустимый период дохода: ${period}`);
    }

    const settings: UserIncomeSettings = {
      income,
      period,
      updatedAt: Date.now(),
    };

    await this.driver.setItem(STORAGE_KEY_USER_INCOME, JSON.stringify(settings));
    return settings;
  }

  /**
   * Удаляет сохраненные настройки (сброс к неинициализированному состоянию).
   */
  async clearSettings(): Promise<void> {
    await this.driver.removeItem(STORAGE_KEY_USER_INCOME);
  }

  /**
   * Проверяет, настроен ли у пользователя действующий доход (> 0).
   */
  async isConfigured(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings !== null && settings.income > 0;
  }
}

/**
 * Тип состояния React Context для управления доходом.
 */
export interface IncomeContextState {
  readonly isLoading: boolean;
  readonly isConfigured: boolean;
  readonly income: number;
  readonly period: IncomePeriod;
  readonly hourlyRate: number;
  readonly updatedAt: number;
  saveIncome(income: number, period: IncomePeriod): Promise<boolean>;
  resetIncome(): Promise<void>;
}

/**
 * Чистая функция для вычисления производного состояния IncomeContextState.
 */
export function deriveIncomeState(
  settings: UserIncomeSettings | null,
  isLoading: boolean
): Omit<IncomeContextState, 'saveIncome' | 'resetIncome'> {
  const current = settings ?? DEFAULT_INCOME_SETTINGS;
  const isConfigured = current.income > 0;
  const hourlyRate = isConfigured ? calculateHourlyRate(current.income, current.period) : 0;

  return {
    isLoading,
    isConfigured,
    income: current.income,
    period: current.period,
    hourlyRate,
    updatedAt: current.updatedAt,
  };
}
