/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // All UI actions derive from one blue hue family
        primary:   "#1565C0",   // blue-800  — primary brand / nav active
        secondary: "#2563EB",   // blue-600  — CTA buttons (was green)

        // Full brand scale — use `brand-*` anywhere you need a shade
        brand: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1565C0",
          900: "#1E3A8A",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
