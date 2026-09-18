/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1d4ed8',
          foreground: '#ffffff',
          hover: '#1e40af',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
        brand: '#004b93',
        background: '#f8fafc',
        foreground: '#020817',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#020817',
        },
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        border: '#e2e8f0',
        ring: '#1d4ed8',
        sidebar: {
          DEFAULT: '#ffffff',
          foreground: '#334155',
          accent: '#f1f5f9',
        },
        success: '#22c55e',
        warning: '#eab308',
        destructive: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
