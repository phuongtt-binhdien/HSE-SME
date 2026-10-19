/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pine: { 950: '#0B1712', 900: '#0F1F19', 800: '#14261F', 100: '#DCE7E1' },
        viridian: { 700: '#125A3F', 600: '#16694A', 500: '#1E8560', 50: '#EBF3EF' },
        steel: { 600: '#2C7DA0', 50: '#EDF5F9' }
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
}
