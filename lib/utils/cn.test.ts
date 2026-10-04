import { cn } from './cn';

describe('cn', () => {
  it('keeps the text color when combined with a custom font size', () => {
    expect(cn('text-foreground', 'text-h1')).toBe('text-foreground text-h1');
  });

  it('lets later font sizes and colors override earlier ones', () => {
    expect(cn('text-body', 'text-caption')).toBe('text-caption');
    expect(cn('text-foreground', 'text-primary')).toBe('text-primary');
  });

  it('knows every custom font size in tailwind.config.js', () => {
    const { fontSize } = require('../../tailwind.config.js').theme.extend;
    for (const size of Object.keys(fontSize)) {
      expect(cn('text-foreground', `text-${size}`)).toBe(`text-foreground text-${size}`);
    }
  });
});
