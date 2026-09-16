/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#004b93', // HUTECH / Civic Gov Branding
        primary: {
          DEFAULT: '#1d4ed8', // blue-700
          foreground: '#ffffff',
        },
        background: '#f8fafc', // slate-50
        foreground: '#020817', // ~slate-950
        card: {
          DEFAULT: '#ffffff',
          foreground: '#020817',
        },
        muted: {
          DEFAULT: '#f1f5f9', // slate-100
          foreground: '#64748b', // slate-500
        },
        secondary: {
          DEFAULT: '#f1f5f9',
          foreground: '#334155',
        },
        accent: {
          DEFAULT: '#e2e8f0', // slate-200
          foreground: '#020817',
        },
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#1d4ed8',
        sidebar: {
          DEFAULT: '#f1f5f9',
          foreground: '#334155',
          accent: '#e2e8f0',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: '#22c55e',
        warning: '#eab308',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'radar-ping': {
          '0%': { transform: 'scale(0.8)', opacity: 0.8 },
          '100%': { transform: 'scale(2.2)', opacity: 0 },
        },
        'wave-flow': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-ping': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'wave-flow': 'wave-flow 10s linear infinite',
      }
    },
  },
  plugins: [],
}
