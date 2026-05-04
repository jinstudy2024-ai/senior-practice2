import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF3FB",
          100: "#D5E1F2",
          200: "#A6BFE3",
          300: "#769DD3",
          400: "#487BC4",
          500: "#1B4F9B",
          600: "#15407E",
          700: "#103161",
          800: "#0B2244",
          900: "#061327",
        },
        surface: "#F5F7FA",
      },
      fontFamily: {
        sans: ["'Noto Sans KR'", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
