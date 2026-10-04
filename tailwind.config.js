const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        plasma: token('plasma'),
        secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
        tone: {
          aurora: token('tone-aurora'),
          solar: token('tone-solar'),
          nebula: token('tone-nebula'),
          ion: token('tone-ion'),
        },
        score: { high: token('score-high'), mid: token('score-mid'), low: token('score-low') },
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
        '3xl': '28px',
      },
      fontFamily: {
        // Rubik ships one family per weight; use these instead of font-bold/font-medium,
        // which only set fontWeight and fall back to a synthetic face on Android.
        sans: ['Rubik_400Regular'],
        'sans-medium': ['Rubik_500Medium'],
        'sans-semibold': ['Rubik_600SemiBold'],
        'sans-bold': ['Rubik_700Bold'],
      },
      fontSize: {
        hero: ['44px', { lineHeight: '48px', letterSpacing: '-0.5px' }],
        display: ['32px', { lineHeight: '40px', letterSpacing: '-0.3px' }],
        h1: ['24px', { lineHeight: '32px' }],
        h2: ['20px', { lineHeight: '28px' }],
        body: ['16px', { lineHeight: '24px' }],
        caption: ['13px', { lineHeight: '18px' }],
      },
    },
  },
  plugins: [],
};
