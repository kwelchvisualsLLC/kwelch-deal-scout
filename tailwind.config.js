/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#D4AF37",
        goldsoft: "#E9CC73",
        ink: "#000000",
        panel: "#0c0c0c",
        panel2: "#141414",
        line: "#262626",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "Impact", "sans-serif"],
        body: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212,175,55,0.35), 0 10px 40px -12px rgba(212,175,55,0.25)",
      },
    },
  },
  plugins: [],
};
