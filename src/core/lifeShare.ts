import { DEFAULT_WORK_SCHEDULE, type WorkScheduleConfig } from './calculator';
import type { LifeTimeI18n } from '../i18n/lifeTimeI18n';
import { getLifeTimeI18n } from '../i18n/lifeTimeI18n';

export const LIFE_SHARE_MIN_PERCENT = 0.01;

export function lifeSharePercent(
  totalWorkingHours: number,
  remainingLifeYears: number,
  schedule: WorkScheduleConfig = DEFAULT_WORK_SCHEDULE,
): number | null {
  if (
    typeof totalWorkingHours !== 'number' ||
    Number.isNaN(totalWorkingHours) ||
    totalWorkingHours < 0 ||
    typeof remainingLifeYears !== 'number' ||
    Number.isNaN(remainingLifeYears) ||
    remainingLifeYears <= 0
  ) {
    return null;
  }

  return (totalWorkingHours / schedule.hoursPerYear / remainingLifeYears) * 100;
}

function formatPercentNumber(value: number, numberLocale: string, fractionDigits: { min: number; max: number }): string {
  return value.toLocaleString(numberLocale, {
    minimumFractionDigits: fractionDigits.min,
    maximumFractionDigits: fractionDigits.max,
  });
}

export function formatLifeSharePercent(percent: number, numberLocale: string): string {
  if (percent === 0) {
    return `${formatPercentNumber(0, numberLocale, { min: 0, max: 0 })}%`;
  }
  if (percent > 0 && percent < LIFE_SHARE_MIN_PERCENT) {
    return `< ${formatPercentNumber(LIFE_SHARE_MIN_PERCENT, numberLocale, { min: 2, max: 2 })}%`;
  }
  if (percent < 1) {
    return `${formatPercentNumber(percent, numberLocale, { min: 2, max: 2 })}%`;
  }
  return `${formatPercentNumber(percent, numberLocale, { min: 0, max: 1 })}%`;
}

export function formatLifeShare(
  percent: number | null,
  copy: LifeTimeI18n = getLifeTimeI18n(),
): string | null {
  if (percent === null) {
    return null;
  }
  return copy.t('converter.lifeShare', {
    percent: formatLifeSharePercent(percent, copy.numberLocale),
  });
}
