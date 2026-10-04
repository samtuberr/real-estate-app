/**
 * JS mirror of the color tokens in global.css, for native APIs that can't take a
 * className (navigation theme, tab bar, headers, glass tints, symbol tints). Keep in sync.
 */
export const colors = {
  light: {
    background: '#F6F7FB',
    card: '#FFFFFF',
    primary: '#4F5BFF',
    plasma: '#00A8D6',
    foreground: '#0A0C18',
    mutedForeground: '#626A84',
    border: '#DEE1EE',
  },
  dark: {
    background: '#05060B',
    card: '#0E101A',
    primary: '#6E7BFF',
    plasma: '#3EE6FF',
    foreground: '#F0F3FF',
    mutedForeground: '#8B93B0',
    border: '#222638',
  },
} as const;

export type Palette = (typeof colors)['light' | 'dark'];

/** Signature ion → plasma gradient for hero moments (score ring, primary CTA glow). */
export const gradients = {
  ion: 'linear-gradient(135deg, #6E7BFF 0%, #3EE6FF 100%)',
} as const;

/** Soft colored glows (CSS `boxShadow`, works on iOS and Android). Use sparingly. */
export const glows = {
  primary: '0 0 24px 0 rgba(110, 123, 255, 0.45)',
  plasma: '0 0 20px 0 rgba(62, 230, 255, 0.35)',
} as const;
