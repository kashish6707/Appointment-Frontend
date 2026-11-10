import type { Config } from "tailwindcss";

// Apki Bari brand: white background with green touches.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1F7A55", // main green: buttons, links, logo
          dark: "#145C3F",    // hover, headings on light green
          light: "#EAF6EF",   // selected states, icon circles
          tint: "#F2F9F5",    // soft section backgrounds
        },
        ink: "#1D2340",       // main text
        muted: "#5E6478",     // secondary text
        line: "#D6E4DC",      // borders, dividers
        token: "#E8A317",     // amber: token numbers only
        danger: { DEFAULT: "#B9382A", light: "#FBEDEA" },
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', "Mukta", '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 28px rgba(20, 70, 45, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
