/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // blue-600
        secondary: '#0891b2', // cyan-600
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b',
      }
    },
    
  }
}

