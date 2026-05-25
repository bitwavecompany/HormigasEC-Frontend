/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16a34a',
          dark:    '#15803d',
          darker:  '#166534',
          light:   '#dcfce7',
        },
        surface: {
          DEFAULT: '#f8faf8',
          card:    '#ffffff',
          muted:   '#f3f6f3',
        },
        ink: {
          DEFAULT: '#1a2e1a',
          muted:   '#6b7280',
          faint:   '#9ca3af',
        },
        border: {
          DEFAULT: '#e5e7eb',
        },
        danger: {
          DEFAULT: '#dc2626',
          subtle:  '#fef2f2',
          border:  '#fecaca',
        },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
        pill: '1.4375rem',
      },
      boxShadow: {
        'brand-sm': 'rgba(100, 180, 120, 0.88) 0px 10px 10px -5px',
        'brand-md': 'rgba(100, 180, 120, 0.88) 0px 20px 10px -15px',
        'brand-lg': 'rgba(100, 180, 120, 0.88) 0px 30px 30px -20px',
      },
    },
  },
  plugins: [],
}