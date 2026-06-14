import type { Config } from "tailwindcss";

// Warm editorial palette — light/paper theme (PRD Section 07 Design Language)
// Migrated from dark theme; token names preserved, semantics updated.
//   espresso = neutral paper surfaces & dividers (light)
//   cream    = dark ink / text (higher number = lighter)
//   copper   = copper accent (toned down against light background)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces chosen by role (not monotone): 900=background, 800=card, 700=chip, 600=border
        espresso: {
          DEFAULT: "#E8E3D9",
          900: "#F0EEE6", // page background (given cream)
          800: "#FBFAF7", // elevated cards (near white)
          700: "#EAE5DB", // chips / secondary surface
          600: "#D9D3C7", // border / divider
        },
        copper: {
          DEFAULT: "#B0712F",
          light: "#CE8E54", // hover fill & focus ring
          dark: "#8A5523",  // readable accent text on light background
        },
        cream: {
          DEFAULT: "#2E2823",
          50: "#231F1B",  // strongest text / on light chip
          100: "#2E2823", // primary body & heading
          200: "#574F46", // secondary / muted text (used with opacity)
        },
        sage: "#5E6B54",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
