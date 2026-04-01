/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0A07",
        surface: {
          100: "#1A1510",
          200: "#252015",
          300: "#2A2318",
        },
        primary: {
          DEFAULT: "#D4A43E", // Gold
          hover: "#E8A849",   // Warm Gold
        },
        accent: {
          green: "#6B8E4E",
          red: "#C14B3F",
        },
        text: {
          primary: "#F5F0E8",
          secondary: "#B8A890",
          muted: "#7A6E5D",
        },
        border: {
          DEFAULT: "#2A2318",
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(212, 164, 62, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(212, 164, 62, 0.6)' },
        }
      }
    },
  },
  plugins: [],
};
