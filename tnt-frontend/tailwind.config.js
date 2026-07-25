/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '360px',
      sm: '480px',
      msm: '640px',
      md: '768px',
      lg: '992px',
      xl: '1024px',
      '2xl': '1280px',
      '3xl': '1366px',
      '4xl': '1440px',
      '5xl': '1600px',
      '6xl': '1920px',
    },
    extend: {
      colors: {
        ink: '#111111',        // primary black (text, buttons, header text)
        paper: '#FFFFFF',      // primary white background
        sand: '#E7DFD3',       // hero / lifestyle-photo warm beige backdrop
        stone: '#F4F2EE',      // light gray section / card background
        mist: '#EDEBE6',       // subtle divider / secondary card bg
        line: '#E3E1DC',       // hairline border color
        muted: '#6B6B6B',      // secondary text gray
        success: '#1F8A4C',    // in-stock green
        warn: '#C98A2B',       // low-stock amber
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '.18em',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
        soft: '0 4px 20px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        card: '4px',
      },
      maxWidth: {
        container: '1440px',
      },
    },
  },
  plugins: [],
}
