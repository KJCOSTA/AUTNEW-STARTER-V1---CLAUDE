/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Premium Theme
        background: '#0a0f1a',
        card: '#1a2234',
        'card-hover': '#242f47',
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
        },
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-accent-hover': 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}
