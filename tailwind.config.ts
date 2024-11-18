import { type Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import radixPlugin from 'tailwindcss-radix'
import { marketingPreset } from './app/routes/_marketing+/tailwind-preset'
import { extendedTheme } from './app/utils/extended-theme.ts'

export default {
  content: ['./app/**/*.{ts,tsx,jsx,js}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      ...extendedTheme,
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-reverse': 'spin-reverse 4s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit': 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit 15s linear infinite reverse',
        'orbit-slow': 'orbit 25s linear infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          to: {
            transform: 'rotate(-360deg)',
          },
        },
        orbit: {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg) translateX(150px) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg) translateX(150px) rotate(-360deg)' }
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        }
      }
    },
  },
  presets: [marketingPreset],
  plugins: [animatePlugin, radixPlugin],
} satisfies Config
