import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GitHub-inspired dark palette — clean, professional
        background: "#07090f",
        canvas: {
          DEFAULT: "#07090f",
          subtle:  "#0d1117",
          inset:   "#010409",
          overlay: "#161b22",
        },
        surface: {
          DEFAULT: "#07090f",
          card:    "#0d1117",
          elevated:"#161b22",
          overlay: "#1c2333",
          border:  "#21262d",
          hover:   "#30363d",
        },
        fg: {
          DEFAULT: "#e6edf3",
          muted:   "#8b949e",
          subtle:  "#6e7681",
          on_emphasis: "#ffffff",
        },
        // Accent — emerald/teal (kept minimal)
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          // Core accent
          accent: "#238636",
          emphasis: "#2ea043",
          muted:  "#1a7f37",
        },
        // Teal secondary
        teal: {
          50:  "#f0fdfa",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          accent: "#0f8080",
        },
        // Danger / red
        danger: {
          DEFAULT: "#f85149",
          muted:   "#b62324",
          subtle:  "#490202",
          emphasis: "#da3633",
        },
        // Neutral scale matching GitHub's exact grays
        neutral: {
          50:  "#f6f8fa",
          100: "#eaeef2",
          200: "#d0d7de",
          300: "#afb8c1",
          400: "#8c959f",
          500: "#6e7781",
          600: "#57606a",
          700: "#424a53",
          800: "#32383f",
          900: "#24292f",
          950: "#1c2128",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1.2" }],
      },
      borderRadius: {
        "2xl": "12px",
        "3xl": "16px",
      },
      boxShadow: {
        // Subtle card shadows
        card:  "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(28,35,51,0.6)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(35,134,54,0.3)",
        // Accent glows
        "glow-sm": "0 0 12px -3px rgba(35,134,54,0.4)",
        "glow":    "0 0 24px -6px rgba(35,134,54,0.5)",
        "glow-teal": "0 0 20px -5px rgba(20,184,166,0.4)",
        // Elevation
        "z1": "0 1px 2px rgba(0,0,0,0.6)",
        "z2": "0 2px 8px rgba(0,0,0,0.5)",
        "z3": "0 8px 24px rgba(0,0,0,0.4)",
        "z4": "0 16px 48px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "ping-slow": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        "fade-in":       "fade-in 0.25s ease forwards",
        "slide-in-right":"slide-in-right 0.2s ease forwards",
        "scale-in":      "scale-in 0.15s ease forwards",
        "ping-slow":     "ping-slow 2s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
