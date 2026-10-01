import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5f1",
          100: "#dcebe3",
          200: "#b9d7c6",
          300: "#7fc4a4",
          400: "#4e9c76",
          500: "#268159",
          600: "#1c6045",
          700: "#175037",
          800: "#11402d",
          900: "#0c3324",
        },
        ink: { DEFAULT: "#132019", soft: "#4e6259" },
        line: "#e0e9e3",
        gold: {
          50: "#fbf6e7",
          200: "#eeddab",
          300: "#e3c879",
          400: "#d6b54d",
          500: "#c9a227",
          600: "#ab881e",
          700: "#8f6f16",
          800: "#6b5310",
        },
        danger: { 50: "#fdf0ef", 200: "#f0c6c3", 500: "#c0453f", 700: "#8f2f2b" },
      },
      fontFamily: { sans: ["var(--font-manrope)", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 10px 30px rgba(12,51,36,.10)" },
      maxWidth: { page: "1180px" },
    },
  },
  plugins: [],
};
export default config;
