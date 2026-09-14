import {
  calendarDateFromDate,
  completedAgeYears,
  dateOfBirthPickerBounds,
  dateOfBirthPickerValue,
  formatCalendarDateLong,
  isFutureDate,
  isValidCalendarDate,
  remainingLifeYears,
  remainingLifeYearsAtAge,
  shiftCalendarYears,
} from './remainingLife';
import { formatLifeShare, lifeSharePercent } from './lifeShare';
import i18n from '../i18n/i18n';

function normalizeSpaces(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

describe('remainingLifeYearsAtAge', () => {
  test('male age 0 is WHO e_0', () => {
    expect(remainingLifeYearsAtAge('male', 0)).toBeCloseTo(68.892, 3);
  });

  test('male age 30 is WHO e_30', () => {
    expect(remainingLifeYearsAtAge('male', 30)).toBeCloseTo(43.099, 3);
  });

  test('female age 30 is WHO e_30', () => {
    expect(remainingLifeYearsAtAge('female', 30)).toBeCloseTo(47.679, 3);
  });

  test('male age 32 interpolates between e_30 and e_35', () => {
    expect(remainingLifeYearsAtAge('male', 32)).toBeCloseTo(41.275, 3);
  });

  test('age past the last knot uses e_85', () => {
    expect(remainingLifeYearsAtAge('male', 85)).toBeCloseTo(4.484, 3);
    expect(remainingLifeYearsAtAge('male', 120)).toBeCloseTo(4.484, 3);
  });
});

describe('completedAgeYears', () => {
  const today = { year: 2026, month: 9, day: 10 };

  test('counts a birthday that has already happened this year', () => {
    expect(completedAgeYears({ year: 1996, month: 9, day: 10 }, today)).toBe(30);
  });

  test('does not count a birthday that is still ahead this year', () => {
    expect(completedAgeYears({ year: 1996, month: 9, day: 11 }, today)).toBe(29);
  });

  test('rejects a future date of birth', () => {
    expect(completedAgeYears({ year: 2026, month: 9, day: 11 }, today)).toBeNull();
    expect(isFutureDate({ year: 2026, month: 9, day: 11 }, today)).toBe(true);
  });

  test('rejects impossible calendar dates', () => {
    expect(isValidCalendarDate({ year: 2020, month: 2, day: 30 })).toBe(false);
    expect(completedAgeYears({ year: 2020, month: 2, day: 30 }, today)).toBeNull();
  });
});

describe('date of birth picker value and bounds', () => {
  const today = { year: 2026, month: 9, day: 10 };

  test('empty field opens on today minus 30 years, within today minus 120 years', () => {
    expect(calendarDateFromDate(dateOfBirthPickerValue(today, null))).toEqual({
      year: 1996,
      month: 9,
      day: 10,
    });
    expect(calendarDateFromDate(dateOfBirthPickerBounds(today).maximumDate)).toEqual(today);
    expect(calendarDateFromDate(dateOfBirthPickerBounds(today).minimumDate)).toEqual({
      year: 1906,
      month: 9,
      day: 10,
    });
  });

  test('a selected date reopens on that date, not the default age', () => {
    const selected = { year: 1980, month: 1, day: 15 };
    expect(calendarDateFromDate(dateOfBirthPickerValue(today, selected))).toEqual(selected);
  });

  test('shifts a leap day onto a valid civil date', () => {
    expect(shiftCalendarYears({ year: 2024, month: 2, day: 29 }, -30)).toEqual({
      year: 1994,
      month: 3,
      day: 1,
    });
  });
});

describe('formatCalendarDateLong', () => {
  const date = { year: 1996, month: 9, day: 10 };

  test('uses a long date in the App Locale number locale', () => {
    expect(normalizeSpaces(formatCalendarDateLong(date, 'ru-RU'))).toBe('10 сентября 1996 г.');
    expect(formatCalendarDateLong(date, 'en-US')).toBe('September 10, 1996');
    expect(formatCalendarDateLong(date, 'zh-CN')).toBe('1996年9月10日');
  });
});

describe('remainingLifeYears', () => {
  test('uses completed age and sex against the WHO table', () => {
    const today = calendarDateFromDate(new Date(2026, 8, 10));
    expect(remainingLifeYears({ year: 1996, month: 9, day: 10 }, 'male', today)).toBeCloseTo(43.099, 3);
  });
});

describe('lifeSharePercent', () => {
  test('one work year is 2.5% of 40 remaining years', () => {
    expect(lifeSharePercent(2080, 40)).toBeCloseTo(2.5, 5);
  });

  test('zero working hours is 0%', () => {
    expect(lifeSharePercent(0, 40)).toBe(0);
  });

  test('does not convert without remaining life', () => {
    expect(lifeSharePercent(2080, 0)).toBeNull();
  });
});

describe('formatLifeShare', () => {
  test('formats zero, tiny, small, and large percentages in Russian', () => {
    expect(normalizeSpaces(formatLifeShare(0) ?? '')).toBe('0% оставшейся жизни');
    expect(normalizeSpaces(formatLifeShare(0.0001) ?? '')).toBe('< 0,01% оставшейся жизни');
    expect(normalizeSpaces(formatLifeShare(0.03098) ?? '')).toBe('0,03% оставшейся жизни');
    expect(normalizeSpaces(formatLifeShare(2.5) ?? '')).toBe('2,5% оставшейся жизни');
    expect(normalizeSpaces(formatLifeShare(120) ?? '')).toBe('120% оставшейся жизни');
  });

  test('formats the same percentages in English', async () => {
    await i18n.changeLanguage('en');
    expect(formatLifeShare(0.03098)).toBe('0.03% of remaining life');
    expect(formatLifeShare(0.0001)).toBe('< 0.01% of remaining life');
  });
});
