import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "var(--theme-focus-ring)",
        background: "var(--theme-surface)",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "var(--theme-secondary)",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "var(--theme-background-secondary)",
          foreground: "#ffffff"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "var(--theme-danger)",
          foreground: "#ffffff"
        },
        bcb: {
          navy: "var(--bcb-navy)",
          green: "var(--bcb-green)",
          red: "var(--bcb-red)",
          gold: "var(--bcb-gold)",
          mist: "var(--bcb-mist)",
          ink: "var(--bcb-ink)"
        }
      },
      boxShadow: {
        executive: "0 24px 80px -45px rgba(7, 17, 31, 0.55)"
      }
    }
  },
  plugins: []
};

export default config;
