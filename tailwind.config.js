/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        surface: '#1a1a2e',
        panel: '#16213e',
        accent: '#0f3460',
        highlight: '#e94560',
        muted: '#a8a8b3'
      }
    }
  },
  plugins: []
}
