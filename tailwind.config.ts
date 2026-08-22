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
        ink: "var(--color-ink)",
        cinnabar: "var(--color-vermiglio)",
        vermiglio: "var(--color-vermiglio)",
        gold: "var(--color-gold)",
        parchment: "var(--color-background)",
        rice: "var(--color-surface)",
        stone: "var(--color-ink)",
        ochre: "var(--color-gold)",
        surface: "var(--color-surface)",
        "on-accent": "var(--color-on-accent)",
        muted: "var(--color-muted)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "var(--font-ui-cn)",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "var(--font-editorial-cn)",
          "Songti SC",
          "SimSun",
          "serif",
        ],
        "ui-cn": [
          "var(--font-ui-cn)",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        "ui-western": ["var(--font-ui-western)", "Arial", "sans-serif"],
        "editorial-cn": [
          "var(--font-editorial-cn)",
          "Songti SC",
          "SimSun",
          "serif",
        ],
        "editorial-western": [
          "var(--font-editorial-western)",
          "Georgia",
          "serif",
        ],
      },
      boxShadow: {
        hover: "0 12px 28px var(--color-shadow)",
        figure: "0 14px 36px rgb(33 51 56 / 14%)",
        overlay: "0 20px 48px rgb(33 51 56 / 18%)",
      },
      borderRadius: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
