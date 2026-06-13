import type { Config } from "tailwindcss";

// Sıcak editoryal palet — açık/kağıt tema (PRD Bölüm 07 Tasarım Dili)
// Koyu temadan açık temaya geçiş: token isimleri korundu, anlamları çevrildi.
//   espresso = nötr kağıt yüzeyler & ayraçlar (açık)
//   cream    = koyu mürekkep / metin (sayı arttıkça açılır)
//   copper   = bakır aksan (açık zemine göre inceltildi)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Yüzeyler rol bazlı seçildi (monoton değil): 900=zemin, 800=kart, 700=çip, 600=kenarlık
        espresso: {
          DEFAULT: "#E8E3D9",
          900: "#F0EEE6", // sayfa zemini (verilen krem)
          800: "#FBFAF7", // yükseltilmiş kartlar (beyaza yakın)
          700: "#EAE5DB", // çipler / ikincil yüzey
          600: "#D9D3C7", // kenarlık / ayraç
        },
        copper: {
          DEFAULT: "#B0712F",
          light: "#CE8E54", // hover dolgu & odak halkası
          dark: "#8A5523",  // açık zeminde okunur aksan metin
        },
        cream: {
          DEFAULT: "#2E2823",
          50: "#231F1B",  // en güçlü metin / açık çip üstü
          100: "#2E2823", // birincil gövde & başlık
          200: "#574F46", // ikincil / sönük metin (opaklıkla)
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
