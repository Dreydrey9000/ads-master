import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#07080c", 900: "#0c0e14", 800: "#141722", 700: "#1d2130", 600: "#2a2f42" },
        accent: { DEFAULT: "#a0e5c9", soft: "#bcefd8" },
        good: "#9de2bd", bad: "#f2cf84", ugly: "#f4a79c",
      },
      fontSize: { micro: "10px", caption: "11px" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
    },
  },
  plugins: [],
};
export default config;
