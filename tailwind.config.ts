import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#07080c", 900: "#0c0e14", 800: "#141722", 700: "#1d2130", 600: "#2a2f42" },
        accent: { DEFAULT: "#7c5cff", soft: "#a593ff" },
        good: "#22c55e", bad: "#f59e0b", ugly: "#ef4444",
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
    },
  },
  plugins: [],
};
export default config;
