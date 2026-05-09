/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B2A4A",
        gold: "#D4A037",
        teal: "#2B7A78",
        cream: "#F8F9FA",
      },
    },
  },
  plugins: [],
}
