import type { Config } from "tailwindcss";

// Sıcak editoryal palet — espresso, bakır, krem (PRD Bölüm 07 Tasarım Dili)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: "#2A1E18",
          900: "#1C130F",
          800: "#2A1E18",
          700: "#3B2A21",
          600: "#4F392D",
        },
        copper: {
          DEFAULT: "#B5713A",
          light: "#CE8E54",
          dark: "#8F5526",
        },
        cream: {
          DEFAULT: "#F3EADD",
          50: "#FAF5EC",
          100: "#F3EADD",
          200: "#E7D7C2",
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
