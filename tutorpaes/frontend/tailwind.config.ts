import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

// NOTE: los estilos "paes" ya fueron fusionados aqui desde tailwind.paes-extension.ts.

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        "paes-dark": "#0B1220",
        "paes-darker": "#050810",
        "paes-card": "#0F1623",
        "paes-border": "#1A2332",
        "paes-text": "#E8EAED",
        "paes-text-secondary": "#B0B4BD",
        "paes-emerald": "#10B981",
        "paes-blue": "#3B82F6",
        // Nuevos tokens unificados de globals.css
        brand: {
          primary: "var(--color-brand-primary)",
          accent: "var(--color-brand-accent)",
          danger: "var(--color-brand-danger)",
        },
        surface: {
          base: "var(--color-surface-base)",
          default: "var(--color-surface-default)",
          raised: "var(--color-surface-raised)",
          container: "var(--color-surface-container)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        }
      },
      backgroundImage: {
        "gradient-paes": "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
        "gradient-subtle": "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
      },
      animation: {
        blob: "blob 7s infinite",
        "blob-delay": "blob 7s infinite 2s",
        "blob-delay-4": "blob 7s infinite 4s",
        fadeInUp: "fadeInUp 0.8s ease-out",
        fadeIn: "fadeIn 0.6s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
            opacity: "0.7",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
            opacity: "0.5",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
            opacity: "0.4",
          },
        },
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        "pulse-subtle": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.8",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
        "glass-sm": "0 4px 6px rgba(0, 0, 0, 0.07)",
        glow: "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.3)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
