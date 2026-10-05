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
        background: "var(--background)",
        foreground: "var(--foreground)",
        covenant: {
          navy: "#0F3D70",
          blue: "#1E5AA0",
          gold: "#FFC107",
          dark: "#081F38",
        },
      },
    },
  },
  plugins: [],
};
export default config;
