import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Same brand palette as apps/hotel-admin / apps/super-admin, so all
        // three portals read as one product.
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b9d1ff',
          300: '#8bb2ff',
          400: '#5c8bff',
          500: '#3763f4',
          600: '#2647d6',
          700: '#1f39ac',
          800: '#1c3189',
          900: '#1b2c6e',
          950: '#121a44',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
