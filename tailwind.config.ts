import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0a0b14",
      },
      boxShadow: {
        glow: "0 0 80px rgba(98, 94, 255, 0.35)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.3), transparent 35%), linear-gradient(120deg, #0a0b14 0%, #12162a 45%, #0d1020 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
