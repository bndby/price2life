/**
 * Price to Life Core Calculator
 * Чистые функции перевода дохода в часовую ставку и цены покупки в составной эквивалент рабочего времени.
 */

export type IncomePeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface WorkScheduleConfig {
  readonly hoursPerDay: number;
  readonly hoursPerWeek: number;
  readonly hoursPerYear: number;
  readonly hoursPerMonth: number;
}

export const DEFAULT_WORK_SCHEDULE: WorkScheduleConfig = {
  hoursPerDay: 8,
  hoursPerWeek: 40,
  hoursPerYear: 2080,
  hoursPerMonth: 2080 / 12, // 173.33333333333334
};

export interface ConversionResult {
  readonly years: number;
  readonly months: number;
  readonly days: number;
  readonly hours: number;
  readonly totalWorkingHours: number;
  readonly formatted: string;
  readonly formattedTotal: string;
  readonly isLessThanOneHour: boolean;
  readonly isValid: boolean;
  readonly errorMessage?: string;
}

/**
 * Вычисляет часовую ставку на основе дохода и выбранного периода.
 * @param income Доход за период (целое положительное число)
 * @param period Период начисления дохода ('hour' | 'day' | 'week' | 'month' | 'year')
 * @param schedule Рабочий график (по умолчанию 8ч/день, 40ч/нед, 2080ч/год, 173.33ч/мес)
 */
export function calculateHourlyRate(
  income: number,
  period: IncomePeriod,
  schedule: WorkScheduleConfig = DEFAULT_WORK_SCHEDULE
): number {
  if (typeof income !== 'number' || Number.isNaN(income) || income <= 0) {
    return 0;
  }

  switch (period) {
    case 'hour':
      return income;
    case 'day':
      return income / schedule.hoursPerDay;
    case 'week':
      return income / schedule.hoursPerWeek;
    case 'month':
      return income / schedule.hoursPerMonth;
    case 'year':
      return income / schedule.hoursPerYear;
    default:
      return 0;
  }
}

/**
 * Склонение существительного «рабочий час» в русском языке.
 */
export function pluralizeHours(count: number): string {
  if (count > 0 && count < 1) {
    return '< 1 рабочего часа';
  }

  const absCount = Math.abs(Math.round(count));
  const mod100 = absCount % 100;
  const mod10 = absCount % 10;

  if (mod100 >= 11 && mod100 <= 19) {
    return `${absCount.toLocaleString('ru-RU')} рабочих часов`;
  }
  if (mod10 === 1) {
    return `${absCount.toLocaleString('ru-RU')} рабочий час`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${absCount.toLocaleString('ru-RU')} рабочих часа`;
  }
  return `${absCount.toLocaleString('ru-RU')} рабочих часов`;
}

/**
 * Конвертирует цену покупки в составной эквивалент рабочего времени жизни.
 * @param price Цена покупки (целое положительное число)
 * @param hourlyRate Часовая ставка пользователя (> 0)
 * @param schedule Рабочий график
 */
export function calculateLifeTime(
  price: number,
  hourlyRate: number,
  schedule: WorkScheduleConfig = DEFAULT_WORK_SCHEDULE
): ConversionResult {
  if (typeof hourlyRate !== 'number' || Number.isNaN(hourlyRate) || hourlyRate <= 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      totalWorkingHours: 0,
      formatted: '—',
      formattedTotal: '—',
      isLessThanOneHour: false,
      isValid: false,
      errorMessage: 'Необходимо указать положительный доход в настройках',
    };
  }

  if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      totalWorkingHours: 0,
      formatted: '—',
      formattedTotal: '—',
      isLessThanOneHour: false,
      isValid: false,
      errorMessage: 'Цена должна быть неотрицательным числом',
    };
  }

  if (price === 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      totalWorkingHours: 0,
      formatted: '0 ч.',
      formattedTotal: '0 рабочих часов',
      isLessThanOneHour: false,
      isValid: true,
    };
  }

  const totalWorkingHours = price / hourlyRate;

  // Иерархическое разложение по рабочему времени:
  const years = Math.floor(totalWorkingHours / schedule.hoursPerYear);
  const remAfterYears = totalWorkingHours - years * schedule.hoursPerYear;

  const months = Math.floor(remAfterYears / schedule.hoursPerMonth);
  const remAfterMonths = remAfterYears - months * schedule.hoursPerMonth;

  let days = Math.floor(remAfterMonths / schedule.hoursPerDay);
  const remAfterDays = remAfterMonths - days * schedule.hoursPerDay;

  let hours = Math.round(remAfterDays);

  // Обработка переноса при округлении часов до полного рабочего дня (8 часов)
  if (hours >= schedule.hoursPerDay) {
    days += 1;
    hours = 0;
  }

  const isLessThanOneHour = years === 0 && months === 0 && days === 0 && hours === 0;

  // Сборка составной строки
  let formatted = '';
  if (isLessThanOneHour) {
    formatted = '< 1 ч.';
  } else {
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} г.`);
    if (months > 0) parts.push(`${months} мес.`);
    if (days > 0) parts.push(`${days} дн.`);
    if (hours > 0) parts.push(`${hours} ч.`);
    formatted = parts.join(' ');
  }

  const formattedTotal = pluralizeHours(totalWorkingHours);

  return {
    years,
    months,
    days,
    hours,
    totalWorkingHours,
    formatted,
    formattedTotal,
    isLessThanOneHour,
    isValid: true,
  };
}
