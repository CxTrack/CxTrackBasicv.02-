/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        soft: {
          cream: '#F5F3EF',
          'cream-dark': '#EFEAE4',
          card: '#F8F6F2',
          accent: '#FFF9E6',
          'accent-warm': '#FFE4B5',
          text: '#2D2D2D',
          'text-secondary': '#6B6B6B',
        },
      },
      boxShadow: {
        'neumorph-raised': '6px 6px 12px rgba(0, 0, 0, 0.08), -6px -6px 12px rgba(255, 255, 255, 0.8)',
        'neumorph-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.08), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',
        'neumorph-subtle': '3px 3px 6px rgba(0, 0, 0, 0.06), -3px -3px 6px rgba(255, 255, 255, 0.6)',
        'neumorph-card': '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
