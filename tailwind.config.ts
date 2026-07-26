import type { Config } from "tailwindcss";

// Calm forest-green identity — the exact dissertation palette.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#2F6B55", // primary
          soft: "#5F8F7B", // secondary
          light: "#EAF4EF", // light fill
          ink: "#1F3D2E", // text on light-green
        },
        canvas: "#FAFCFB", // page background
        line: "#D9E8DF", // hairline border
        ink: "#1F2A24", // body text
        muted: "#5B6B63", // secondary text
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      maxWidth: {
        prose: "72ch",
        content: "1120px",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
