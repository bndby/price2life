export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function parseIntegerDigits(digits: string): number {
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatGroupedInteger(digits: string, numberLocale = 'ru-RU'): string {
  if (!digits) {
    return '';
  }
  return Number(digits).toLocaleString(numberLocale);
}

