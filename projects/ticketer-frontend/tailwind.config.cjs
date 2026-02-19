/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
      colors: {
        'tc-bg': '#000000',
        'tc-surface': '#0A0A0A',
        'tc-raised': '#141414',
        'tc-border': '#1E1E1E',
        'tc-lime': '#C8E64A',
        'tc-lime-dim': '#3A4218',
        'tc-lime-glow': 'rgba(200,230,74,0.25)',
        'tc-teal': '#00D4AA',
        'tc-coral': '#FF6B35',
        'tc-white': '#F0F0F0',
        'tc-muted': '#6B6B6B',
        'tc-dim': '#2A2A2A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  daisyui: {
    themes: ['lofi'],
    logs: false,
  },
  plugins: [require('daisyui')],
}
