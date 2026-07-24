import type { Config } from 'tailwindcss';

// Design tokens — ACE Child Grow. Calm, warm, joyful, trustworthy, non-clinical.
// Full rationale in docs/content/localization-guide.md and the UX spec.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: { DEFAULT: '#4DA8FF', deep: '#2F80ED' },
        mint: { DEFAULT: '#66D6B0', soft: '#EAFBF5' },
        cream: '#FFF9F2',
        pastel: { yellow: '#FFE9A9', orange: '#FFC78A' },
        lavender: '#D8CCFF',
        pink: '#FFDDE7',
        ink: { DEFAULT: '#263238', soft: '#60717A' },
        line: '#E7EEF2',
        canvas: '#F5FAFD',
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
      borderRadius: { card: '22px', pill: '999px' },
      fontSize: {
        // Body minimum 16px, generous line-height for Myanmar glyphs.
        base: ['16px', { lineHeight: '1.75' }],
        lg: ['18px', { lineHeight: '1.7' }],
        xl: ['22px', { lineHeight: '1.6' }],
      },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
      boxShadow: {
        card: '0 6px 24px -12px rgba(47,128,237,0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
