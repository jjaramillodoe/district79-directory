import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        d79: {
          navy: "#003F87",
          blue: "#0078D4",
          sky: "#E8F3FC",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 63 135 / 0.06), 0 8px 24px rgb(0 63 135 / 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
