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
      colors: {
        destructive: {
          DEFAULT: 'rgb(239, 68, 68)',
          foreground: 'rgb(255, 255, 255)',
        },
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
        },
        fall: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        'orbit-reverse': {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg) translateX(120px) rotate(360deg)' },
        },
        'orbit-slow': {
          '0%': { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.9)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1.1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.95)' },
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-reverse': 'spin-reverse 4s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit': 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit 15s linear infinite reverse',
        'orbit-slow': 'orbit 25s linear infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        fall: 'fall 3s linear forwards',
        orbit: 'orbit 8s linear infinite',
        'orbit-reverse': 'orbit-reverse 12s linear infinite',
        'orbit-slow': 'orbit-slow 15s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  presets: [marketingPreset],
  plugins: [animatePlugin, radixPlugin],
} satisfies Config
