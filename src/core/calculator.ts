/**
 * Price to Life Core Calculator
 * Чистые функции перевода дохода в часовую ставку и цены покупки в составной эквивалент рабочего времени жизни.
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
  hoursPerMonth: 173.33,
};

export interface ConversionOptions {
  readonly compact?: boolean;
  readonly showMinutesForSubHour?: boolean;
}

export interface ConversionResult {
  readonly years: number;
  readonly months: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly totalWorkingHours: number;
  readonly formatted: string;
  readonly fullFormatted: string;
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
    const minutes = Math.round(count * 60);
    return `${count.toFixed(1)} рабочих часа (${minutes} мин.)`;
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
 * @param options Опции форматирования (compact, showMinutesForSubHour)
 * @param schedule Рабочий график
 */
export function calculateLifeTime(
  price: number,
  hourlyRate: number,
  options: ConversionOptions = {},
  schedule: WorkScheduleConfig = DEFAULT_WORK_SCHEDULE
): ConversionResult {
  const compact = options.compact !== false;
  const showMinutesForSubHour = options.showMinutesForSubHour === true;

  if (typeof hourlyRate !== 'number' || Number.isNaN(hourlyRate) || hourlyRate <= 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      totalWorkingHours: 0,
      formatted: '—',
      fullFormatted: '—',
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
      minutes: 0,
      totalWorkingHours: 0,
      formatted: '—',
      fullFormatted: '—',
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
      minutes: 0,
      totalWorkingHours: 0,
      formatted: '0 ч.',
      fullFormatted: '0 г. 0 мес. 0 дн. 0 ч.',
      formattedTotal: '0 рабочих часов',
      isLessThanOneHour: false,
      isValid: true,
    };
  }

  const totalWorkingHours = price / hourlyRate;

  // Иерархическое разложение по рабочему времени:
  let remaining = totalWorkingHours;

  let years = Math.floor(remaining / schedule.hoursPerYear);
  remaining -= years * schedule.hoursPerYear;

  let months = Math.floor(remaining / schedule.hoursPerMonth);
  remaining -= months * schedule.hoursPerMonth;

  let days = Math.floor(remaining / schedule.hoursPerDay);
  remaining -= days * schedule.hoursPerDay;

  let hours = Math.round(remaining);
  const minutes = Math.round(totalWorkingHours * 60);

  // Обработка переноса при округлении часов до полного рабочего дня (8 часов)
  if (hours >= schedule.hoursPerDay) {
    days += 1;
    hours = 0;
  }

  // Защита от переполнения месяцев при округлении (приближение к 2080 ч)
  if (months >= 12) {
    years += Math.floor(months / 12);
    months = months % 12;
  }

  const isLessThanOneHour = years === 0 && months === 0 && days === 0 && hours === 0;
  const fullFormatted = `${years} г. ${months} мес. ${days} дн. ${hours} ч.`;

  // Сборка составной строки
  let formatted = '';
  if (isLessThanOneHour) {
    if (showMinutesForSubHour && minutes > 0) {
      formatted = `${minutes} мин. (< 1 ч.)`;
    } else {
      formatted = '< 1 ч.';
    }
  } else {
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} г.`);
    if (months > 0) parts.push(`${months} мес.`);
    if (days > 0) parts.push(`${days} дн.`);
    if (hours > 0) parts.push(`${hours} ч.`);
    formatted = parts.length > 0 ? parts.join(' ') : '0 ч.';
  }

  const formattedTotal = isLessThanOneHour
    ? '< 1 рабочего часа'
    : pluralizeHours(totalWorkingHours);

  return {
    years,
    months,
    days,
    hours,
    minutes,
    totalWorkingHours,
    formatted: compact ? formatted : fullFormatted,
    fullFormatted,
    formattedTotal,
    isLessThanOneHour,
    isValid: true,
  };
}
