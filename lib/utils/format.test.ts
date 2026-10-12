import { formatCompactPrice, formatCurrency, formatNumber } from './format';

describe('formatCurrency', () => {
  it('formats shekels without decimals in English', () => {
    expect(formatCurrency(1850000, 'en')).toBe('₪1,850,000');
  });

  it('formats shekels in Hebrew', () => {
    const value = formatCurrency(1850000, 'he');
    expect(value).toContain('1,850,000');
    expect(value).toContain('₪');
  });
});

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(12345, 'en')).toBe('12,345');
  });
});

describe('formatCompactPrice', () => {
  it('shortens millions with one decimal under ten million', () => {
    expect(formatCompactPrice(2_450_000, 'en')).toBe('₪2.5M');
    expect(formatCompactPrice(2_000_000, 'en')).toBe('₪2M');
    expect(formatCompactPrice(12_400_000, 'en')).toBe('₪12M');
  });

  it('shortens thousands', () => {
    expect(formatCompactPrice(850_000, 'en')).toBe('₪850K');
  });
});
