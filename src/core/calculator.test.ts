import i18n from '../i18n/i18n';
import {
  calculateHourlyRate,
  calculateLifeTime,
  DEFAULT_WORK_SCHEDULE,
} from './calculator';

function normalizeSpaces(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

describe('calculateHourlyRate', () => {
  test('hour period is the income itself', () => {
    expect(calculateHourlyRate(1000, 'hour')).toBe(1000);
  });

  test('day period divides by 8 working hours', () => {
    expect(calculateHourlyRate(8000, 'day')).toBe(1000);
  });

  test('week period divides by 40 working hours', () => {
    expect(calculateHourlyRate(40000, 'week')).toBe(1000);
  });

  test('month period divides by 173.33 working hours', () => {
    expect(calculateHourlyRate(150000, 'month')).toBeCloseTo(865.4, 1);
  });

  test('year period divides by 2080 working hours', () => {
    expect(calculateHourlyRate(2080000, 'year')).toBe(1000);
  });

  test('zero or negative income yields a zero rate so conversion cannot divide by zero', () => {
    expect(calculateHourlyRate(0, 'month')).toBe(0);
    expect(calculateHourlyRate(-150000, 'month')).toBe(0);
  });
});

describe('calculateLifeTime', () => {
  test('income 150 000 per month and item price 25 000 is 3 days 5 hours', () => {
    const hourlyRate = calculateHourlyRate(150000, 'month');
    const result = calculateLifeTime(25000, hourlyRate);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('3 дн. 5 ч.');
    expect(normalizeSpaces(result.formattedTotal)).toBe('29 рабочих часов');
  });

  test('price 0 yields 0 hours', () => {
    const result = calculateLifeTime(0, 865);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('0 ч.');
    expect(normalizeSpaces(result.formattedTotal)).toBe('0 рабочих часов');
  });

  test('micro-purchase that rounds to 0 hours yields less-than-one-hour marks', () => {
    const hourlyRate = calculateHourlyRate(150000, 'month');
    const result = calculateLifeTime(300, hourlyRate);

    expect(result.isValid).toBe(true);
    expect(result.isLessThanOneHour).toBe(true);
    expect(result.formatted).toBe('< 1 ч.');
    expect(result.formattedTotal).toBe('< 1 рабочего часа');
  });

  test('zero hourly rate is invalid and does not convert', () => {
    const result = calculateLifeTime(25000, 0);

    expect(result.isValid).toBe(false);
    expect(result.formatted).toBe('—');
    expect(result.formattedTotal).toBe('—');
  });

  test('7.8 remaining hours carry over to 1 day 0 hours', () => {
    const result = calculateLifeTime(780, 100);

    expect(result.isValid).toBe(true);
    expect(result.days).toBe(1);
    expect(result.hours).toBe(0);
    expect(result.formatted).toBe('1 дн.');
  });

  test('12 leftover months carry over to 1 year', () => {
    const result = calculateLifeTime(207996, 100);

    expect(result.isValid).toBe(true);
    expect(result.years).toBe(1);
    expect(result.months).toBe(0);
  });

  test.each([
    [1, '1 рабочий час'],
    [2, '2 рабочих часа'],
    [5, '5 рабочих часов'],
    [11, '11 рабочих часов'],
    [21, '21 рабочий час'],
    [2080, '2 080 рабочих часов'],
  ])('pluralizes %i working hours', (hours, expected) => {
    const result = calculateLifeTime(hours, 1);
    expect(normalizeSpaces(result.formattedTotal)).toBe(expected);
  });

  test('uses the default work schedule constants', () => {
    expect(DEFAULT_WORK_SCHEDULE).toEqual({
      hoursPerDay: 8,
      hoursPerWeek: 40,
      hoursPerYear: 2080,
      hoursPerMonth: 173.33,
    });
  });

  test('formats the same breakdown in English and Simplified Chinese', async () => {
    const hourlyRate = calculateHourlyRate(150000, 'month');

    await i18n.changeLanguage('en');
    const english = calculateLifeTime(25000, hourlyRate);
    expect(english.formatted).toBe('3 d 5 h');
    expect(normalizeSpaces(english.formattedTotal)).toBe('29 working hours');

    await i18n.changeLanguage('zh-Hans');
    const chinese = calculateLifeTime(25000, hourlyRate);
    expect(chinese.formatted).toBe('3 天 5 小时');
    expect(normalizeSpaces(chinese.formattedTotal)).toBe('29 个工时');
  });
});
