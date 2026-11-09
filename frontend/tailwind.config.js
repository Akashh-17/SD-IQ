/** @type {import('tailwindcss').Config} */
const color = name => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: color('bg'), surface: color('surface'), elevated: color('elevated'),
        border: color('border'), text: color('text'), muted: color('muted'),
        accent: color('accent'), success: color('success'), warning: color('warning'), danger: color('danger'),
        'on-accent': color('on-accent'),
        // Compatibility for existing pages as they migrate to semantic tokens.
        base: { DEFAULT: color('bg'), 950: color('bg'), 900: color('surface'), 850: color('surface'), 800: color('elevated'), 700: color('border'), 600: color('control-border') },
        amber: { 400: color('accent'), 500: color('accent-hover'), 600: color('accent-hover') },
      },
      fontFamily: {
        display: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        display: ['var(--type-display)', { lineHeight: '0.98', letterSpacing: '-0.065em', fontWeight: '550' }],
        h1: ['var(--type-h1)', { lineHeight: '1.06', letterSpacing: '-0.05em', fontWeight: '550' }],
        h2: ['var(--type-h2)', { lineHeight: '1.12', letterSpacing: '-0.04em', fontWeight: '550' }],
        h3: ['var(--type-h3)', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '550' }],
        h4: ['var(--type-h4)', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '550' }],
        body: ['var(--type-body)', { lineHeight: '1.65' }],
        mono: ['var(--type-mono)', { lineHeight: '1.6', letterSpacing: '-0.02em' }],
      },
      borderRadius: { card: 'var(--radius-card)', control: 'var(--radius-control)', pill: 'var(--radius-pill)' },
      boxShadow: { glow: 'var(--shadow-glow)', card: 'var(--shadow-card)', floating: 'var(--shadow-floating)' },
      backgroundImage: { grid: 'radial-gradient(rgb(var(--color-muted) / 0.14) 1px, transparent 1px)' },
    },
  },
  plugins: [],
};
