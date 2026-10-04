import { formatCurrency, formatNumber } from './format';

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
