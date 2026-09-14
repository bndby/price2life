import { remainingLifeYearsAtAge } from './whoPeriodLifeTable';

export type Sex = 'male' | 'female';

export const VALID_SEXES: readonly Sex[] = ['male', 'female'] as const;

export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function isSex(value: unknown): value is Sex {
  return value === 'male' || value === 'female';
}

export function isValidCalendarDate(date: CalendarDate): boolean {
  const { year, month, day } = date;
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const resolved = new Date(year, month - 1, day);
  return (
    resolved.getFullYear() === year &&
    resolved.getMonth() === month - 1 &&
    resolved.getDate() === day
  );
}

export function compareCalendarDates(left: CalendarDate, right: CalendarDate): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  return left.day - right.day;
}

export function calendarDateFromDate(value: Date): CalendarDate {
  return {
    year: value.getFullYear(),
    month: value.getMonth() + 1,
    day: value.getDate(),
  };
}

export function calendarDateToDate(value: CalendarDate): Date {
  return new Date(value.year, value.month - 1, value.day);
}

export const DATE_OF_BIRTH_PICKER_INITIAL_AGE_YEARS = 30;
export const DATE_OF_BIRTH_PICKER_MAX_AGE_YEARS = 120;

export function shiftCalendarYears(date: CalendarDate, deltaYears: number): CalendarDate {
  return calendarDateFromDate(new Date(date.year + deltaYears, date.month - 1, date.day));
}

export function dateOfBirthPickerBounds(today: CalendarDate): {
  readonly minimumDate: Date;
  readonly maximumDate: Date;
} {
  return {
    maximumDate: calendarDateToDate(today),
    minimumDate: calendarDateToDate(shiftCalendarYears(today, -DATE_OF_BIRTH_PICKER_MAX_AGE_YEARS)),
  };
}

export function dateOfBirthPickerValue(today: CalendarDate, selected: CalendarDate | null): Date {
  if (selected && isValidCalendarDate(selected) && !isFutureDate(selected, today)) {
    return calendarDateToDate(selected);
  }
  return calendarDateToDate(shiftCalendarYears(today, -DATE_OF_BIRTH_PICKER_INITIAL_AGE_YEARS));
}

export function formatCalendarDateLong(date: CalendarDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(calendarDateToDate(date));
}

export function isFutureDate(date: CalendarDate, today: CalendarDate): boolean {
  return compareCalendarDates(date, today) > 0;
}

export function completedAgeYears(dateOfBirth: CalendarDate, today: CalendarDate): number | null {
  if (!isValidCalendarDate(dateOfBirth) || !isValidCalendarDate(today) || isFutureDate(dateOfBirth, today)) {
    return null;
  }

  let age = today.year - dateOfBirth.year;
  const birthdayReached =
    today.month > dateOfBirth.month || (today.month === dateOfBirth.month && today.day >= dateOfBirth.day);
  if (!birthdayReached) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function remainingLifeYears(
  dateOfBirth: CalendarDate,
  sex: Sex,
  today: CalendarDate,
): number | null {
  const age = completedAgeYears(dateOfBirth, today);
  if (age === null || !isSex(sex)) {
    return null;
  }
  return remainingLifeYearsAtAge(sex, age);
}

export { remainingLifeYearsAtAge, WHO_LIFE_TABLE_YEAR } from './whoPeriodLifeTable';
