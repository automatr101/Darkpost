import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        "dm-serif": ["var(--font-dm-serif)", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        background: "#080808",
        surface: "#111111",
        "surface-raised": "#1A1A1A",
        border: "#242424",
        "border-subtle": "#1C1C1C",
        "primary-red": "#E63946",
        "red-dim": "#3A1217",
        "red-hover": "#C8303D",
        "text-primary": "#F0ECE3",
        "text-secondary": "#9A9A9A",
        "text-muted": "#4A4A4A",
        success: "#22C55E",
      },
      animation: {
        aurora: "aurora 60s linear infinite",
        shimmer: "shimmer 2s infinite linear",
      },
      keyframes: {
        shimmer: {
          from: {
            transform: "translateX(-200px) skewX(-30deg)",
          },
          to: {
            transform: "translateX(200px) skewX(-30deg)",
          },
        },
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
};

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: any) {
  let allColors = theme("colors");
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

export default config;
