/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030712', // Cinza muito escuro (quase preto)
        surface: {
          dark: '#0f172a',     // Slate 900
          light: '#1e293b',    // Slate 800
          hover: '#334155'     // Slate 700
        },
        primary: {
          DEFAULT: '#7c3aed',  // Violet 600
          hover: '#6d28d9',    // Violet 700
          light: '#8b5cf6'     // Violet 500
        },
        secondary: '#64748b',  // Slate 500
        accent: {
          purple: '#c084fc',   // Purple 400
          pink: '#e879f9',     // Fuchsia 400
          blue: '#38bdf8'      // Sky 400
        },
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      }
    },
  },
  plugins: [],
}
