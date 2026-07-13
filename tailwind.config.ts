import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "var(--theme-focus-ring)",
        background: "var(--theme-surface)",
        foreground: "var(--theme-foreground)",
        primary: {
          DEFAULT: "var(--theme-secondary)",
          foreground: "#ffffff",
          hover: "var(--theme-secondary-hover)"
        },
        secondary: {
          DEFAULT: "var(--theme-background-secondary)",
          foreground: "#ffffff"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "var(--theme-foreground-muted)"
        },
        accent: {
          DEFAULT: "var(--theme-primary)",
          foreground: "var(--theme-primary-foreground)"
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
      borderRadius: {
        ds: "var(--ds-radius-md)",
        "ds-lg": "var(--ds-radius-lg)",
        "ds-xl": "var(--ds-radius-xl)"
      },
      boxShadow: {
        executive: "0 24px 80px -45px rgba(7, 17, 31, 0.55)",
        ds: "0 1px 2px rgb(15 23 42 / 4%), 0 8px 24px -16px rgb(15 23 42 / 14%)",
        "ds-lg": "0 8px 30px -12px rgb(15 23 42 / 18%)",
        "ds-float": "0 12px 40px -16px rgb(11 110 79 / 35%)"
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem"
      },
      minHeight: {
        touch: "2.75rem"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both"
      }
    }
  },
  plugins: []
};

export default config;
