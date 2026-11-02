import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fa",
          400: "#36a6f4",
          500: "#0c8ce4",
          600: "#026fc3",
          700: "#03599e",
          800: "#074b82",
          900: "#0c406d",
          950: "#082949",
        },
        invoiceHeader: "#cce5ff",
      },
    },
  },
  plugins: [],
};
export default config;
