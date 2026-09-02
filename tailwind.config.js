/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#1C2024',
        slate: {
          50: '#F7F8FA',
          100: '#EEF0F3',
          200: '#DDE1E7',
          400: '#8B94A3',
          600: '#4C5563',
        },
        signal: '#2F5D9C',
        amber: '#C97A2B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
