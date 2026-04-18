import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Indigo-Slate design system tokens (from design files)
        tertiary: '#453d36',
        'on-error-container': '#93000a',
        'on-surface': '#191c1e',
        'on-tertiary': '#ffffff',
        'inverse-primary': '#bec6df',
        'surface-bright': '#f7f9fb',
        'on-primary-fixed': '#131b2e',
        'on-primary-fixed-variant': '#3e465b',
        'primary-fixed': '#dae2fc',
        'on-secondary-fixed-variant': '#3e465c',
        'secondary-fixed': '#dae2fd',
        'surface-container-low': '#f2f4f6',
        'on-primary': '#ffffff',
        primary: '#363e52',
        'surface-container-lowest': '#ffffff',
        'outline-variant': '#c6c6cd',
        'surface-tint': '#565e73',
        'on-tertiary-fixed-variant': '#4e453e',
        'on-secondary-container': '#5c647b',
        'inverse-surface': '#2d3133',
        'tertiary-fixed': '#eee0d7',
        'error-container': '#ffdad6',
        error: '#ba1a1a',
        'on-secondary': '#ffffff',
        'inverse-on-surface': '#eff1f3',
        'on-tertiary-container': '#d6c9bf',
        surface: '#f7f9fb',
        background: '#f7f9fb',
        'on-tertiary-fixed': '#211a15',
        'on-background': '#191c1e',
        'primary-container': '#4d556a',
        'on-surface-variant': '#45464c',
        'tertiary-fixed-dim': '#d1c4bb',
        'secondary-fixed-dim': '#bec6e0',
        outline: '#76777d',
        'on-error': '#ffffff',
        'surface-variant': '#e0e3e5',
        'on-primary-container': '#c2cae3',
        'tertiary-container': '#5d544d',
        'surface-container': '#eceef0',
        'surface-container-highest': '#e0e3e5',
        'surface-container-high': '#e6e8ea',
        'on-secondary-fixed': '#131b2e',
        'surface-dim': '#d8dadc',
        secondary: '#565e74',
        'secondary-container': '#dae2fd',
        'primary-fixed-dim': '#bec6df',

        // === Psychology of Color — Status + Gamification Palette ===
        // Excitement — Urgent / critical / attention
        excitement: {
          DEFAULT: '#F72226',
          10: 'rgba(247, 34, 38, 0.10)',
          20: 'rgba(247, 34, 38, 0.20)',
          40: 'rgba(247, 34, 38, 0.40)',
        },
        // Energetic — Action / momentum / warning
        energetic: {
          DEFAULT: '#FE5E20',
          10: 'rgba(254, 94, 32, 0.10)',
          20: 'rgba(254, 94, 32, 0.20)',
          40: 'rgba(254, 94, 32, 0.40)',
        },
        // Happiness — Reward / celebration / streak
        happiness: {
          DEFAULT: '#FFD527',
          10: 'rgba(255, 213, 39, 0.10)',
          20: 'rgba(255, 213, 39, 0.20)',
          40: 'rgba(255, 213, 39, 0.40)',
        },
        // Natural — Growth / on-track / healthy
        natural: {
          DEFAULT: '#24D56D',
          10: 'rgba(36, 213, 109, 0.10)',
          20: 'rgba(36, 213, 109, 0.20)',
          40: 'rgba(36, 213, 109, 0.40)',
        },
        // Kindness — Success / done / positive feedback
        kindness: {
          DEFAULT: '#00D6A3',
          10: 'rgba(0, 214, 163, 0.10)',
          20: 'rgba(0, 214, 163, 0.20)',
          40: 'rgba(0, 214, 163, 0.40)',
        },
        // Integrity — Trust / focus / commitment
        integrity: {
          DEFAULT: '#2226F7',
          10: 'rgba(34, 38, 247, 0.10)',
          20: 'rgba(34, 38, 247, 0.20)',
          40: 'rgba(34, 38, 247, 0.40)',
        },
        // Originality — Creative / personal / standout
        originality: {
          DEFAULT: '#FF3797',
          10: 'rgba(255, 55, 151, 0.10)',
          20: 'rgba(255, 55, 151, 0.20)',
          40: 'rgba(255, 55, 151, 0.40)',
        },
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        label: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)',
        // Gamification gradients — single emotional family only
        'gradient-streak-resume': 'linear-gradient(135deg, #24D56D 0%, #00D6A3 100%)',
        'gradient-milestone': 'linear-gradient(135deg, #00D6A3 0%, #FFD527 100%)',
      },
      boxShadow: {
        ambient: '0px 24px 48px rgba(77, 85, 106, 0.06)',
        'ambient-sm': '0px 8px 24px rgba(77, 85, 106, 0.06)',
        // Colour glow shadows for critical states
        'glow-excitement': '0 0 12px rgba(247, 34, 38, 0.25)',
        'glow-happiness': '0 0 16px rgba(255, 213, 39, 0.35)',
        'glow-kindness': '0 0 12px rgba(0, 214, 163, 0.25)',
        'glow-integrity': '0 0 12px rgba(34, 38, 247, 0.20)',
      },
      keyframes: {
        'streak-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255, 213, 39, 0.20)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 213, 39, 0.45)' },
        },
        'completion-sweep': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'confetti-burst': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        'streak-break-flash': {
          '0%': { backgroundColor: 'rgba(247, 34, 38, 0.20)' },
          '50%': { backgroundColor: 'rgba(247, 34, 38, 0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'streak-pulse': 'streak-pulse 2s ease-in-out infinite',
        'completion-sweep': 'completion-sweep 0.8s ease-out forwards',
        'confetti-burst': 'confetti-burst 1.5s ease-out forwards',
        'streak-break-flash': 'streak-break-flash 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
