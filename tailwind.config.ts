import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3182f6",
        "primary-dark": "#1b64da",
        "primary-light": "#4593fc",
        background: "#f9fafb",
        "background-dark": "#f3f4f6",
        surface: "#ffffff",
        border: "#e5e7eb",
        "border-light": "#f3f4f6",
        accent: "#64a8ff",
        "accent-light": "#e8f3ff",
        success: "#10b981",
        muted: "#6b7280",
        "text-primary": "#191f28",
        "text-secondary": "#4e5968",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        comic: ["Comic Sans MS", "Bangers", "cursive"],
      },
      animation: {
        "scale-in": "scaleIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        wiggle: "wiggle 0.6s ease-in-out",
      },
      keyframes: {
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg) scale(1.02)" },
          "50%": { transform: "rotate(2deg) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
