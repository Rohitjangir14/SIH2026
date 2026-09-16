/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#06080e',
        obsidian: {
          DEFAULT: '#06080e',
          50: '#0c1220',
          100: '#080c16',
          900: '#040509',
        },
        surface: {
          50: '#0e1526',
          100: '#131d35',
          200: '#1a2747',
          300: '#23345d',
          400: '#2e4375',
        },
        brand: {
          50: '#ecfeff',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          electric: '#00f0ff',
        },
        accent: {
          purple: '#8b5cf6',
          indigo: '#6366f1',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          teal: '#14b8a6',
          sky: '#38bdf8',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.35)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
