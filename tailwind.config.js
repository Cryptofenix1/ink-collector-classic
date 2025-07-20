/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          black: "#0a0a0f",
          dark: "#12121a",
          purple: "#6b21a8",
          "purple-light": "#a855f7",
          "purple-glow": "#c084fc",
        },
        drop: {
          common: "#a855f7",
          rare: "#eab308",
          toxic: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};
