import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BC.GAME Color Palette
        background: {
          primary: '#1a1a1a',
          secondary: '#2a2a2a',
          elevated: '#3a3a3a',
        },
        accent: {
          primary: '#00ff00',
          secondary: '#9333ea', // Purple
          live: '#ef4444', // Red for live indicators
        },
        text: {
          primary: '#ffffff',
          secondary: '#d1d5db',
        },
        badge: {
          notification: '#ef4444',
          award: '#fbbf24', // Golden/yellow
        },
        odds: {
          up: '#00ff00',
          down: '#ef4444',
        },
        status: {
          blue: '#3b82f6',
          green: '#00ff00',
          red: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config




