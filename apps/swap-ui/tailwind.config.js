/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eltx: {
          dark: "#0f172a",
          accent: "#38bdf8"
        }
      }
    }
  },
  plugins: []
};
