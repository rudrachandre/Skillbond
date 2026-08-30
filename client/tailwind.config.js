/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme foundation
        surface: {
          DEFAULT: '#0a0a0f', // page background (rich near-black, not pure black)
          raised: '#101018', // elevated surfaces / asides
        },
        // Text tokens for dark backgrounds
        'text-primary': '#e2e8f0', // slate-200 — near-white primary text
        'text-muted': '#94a3b8', // slate-400 — secondary / muted text
        // Accent: existing amber/gold remains the ONLY bright accent
        accent: {
          DEFAULT: '#f59e0b', // amber-500
          soft: '#fbbf24', // amber-300
          deep: '#d97706', // amber-600
        },
      },
      // Documented radius defaults: rounded-xl for cards, rounded-lg for buttons/inputs
      borderRadius: {
        card: '0.75rem',
        control: '0.5rem',
      },
      boxShadow: {
        glass: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        'glow-accent': '0 0 0 1px rgba(251, 191, 36, 0.25), 0 0 24px rgba(251, 191, 36, 0.18)',
      },
    },
  },
  plugins: [],
}

