import type { Config } from 'tailwindcss';

// Design tokens — ACE Child Grow. Calm, warm, joyful, trustworthy, non-clinical.
// Full rationale in docs/content/localization-guide.md and the UX spec.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: { DEFAULT: '#4B8F83', deep: '#1E5A52' },
        mint: { DEFAULT: '#73C7A5', soft: '#E7F5EF' },
        cream: '#FBFAF5',
        pastel: { yellow: '#FBE8A6', orange: '#FFD28A' },
        lavender: '#D8CCFF',
        pink: '#FFDDE7',
        ink: { DEFAULT: '#18302B', soft: '#64736E' },
        line: '#DDE7E2',
        canvas: '#F4F7F3',
        // Result-state semantic colors (rule engine). Never used to imply diagnosis.
        state: {
          green: '#2E9E6B',
          yellow: '#E0A200',
          orange: '#E8722B',
          red: '#D64545',
        },
      },
      fontFamily: {
        mm: ['"Noto Sans Myanmar"', '"Pyidaungsu"', '"Myanmar Text"', 'sans-serif'],
        sans: ['"Noto Sans Myanmar"', '"Pyidaungsu"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '18px', pill: '999px' },
      fontSize: {
        // Body minimum 16px, generous line-height for Myanmar glyphs.
        base: ['16px', { lineHeight: '1.75' }],
        lg: ['18px', { lineHeight: '1.7' }],
        xl: ['22px', { lineHeight: '1.6' }],
      },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
      boxShadow: {
        card: '0 14px 40px -28px rgba(24,48,43,0.42)',
      },
    },
  },
  plugins: [],
} satisfies Config;
