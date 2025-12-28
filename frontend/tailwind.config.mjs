/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', '"Noto Sans JP"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        base: '#ffffff',
        surface: '#f9fafb',
        border: '#e5e7eb',
        text: {
          main: '#111827',
          sub: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}