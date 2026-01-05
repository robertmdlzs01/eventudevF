import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Paleta principal de Eventu mejorada
        primary: {
          DEFAULT: "#e91e63", 
          foreground: "#ffffff",
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#e91e63", // Rosa principal
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },

        // Colores secundarios modernos
        secondary: {
          DEFAULT: "#6366f1", // Índigo moderno
          foreground: "#ffffff",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },

        // Acentos vibrantes para categorías
        accent: {
          DEFAULT: "#f59e0b", // Ámbar
          foreground: "#ffffff",
          orange: "#f97316",
          emerald: "#10b981",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
          rose: "#f43f5e",
        },

        // Grises modernos para mejor legibilidad
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },

        // Estados y feedback
        success: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
          dark: "#047857",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
          dark: "#d97706",
        },
        error: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
          dark: "#dc2626",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#dbeafe",
          dark: "#1d4ed8",
        },

        // Gradientes para efectos especiales
        gradient: {
          primary: "linear-gradient(135deg, #e91e63 0%, #f472b6 100%)",
          secondary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          sunset: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
          ocean: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
          forest: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        },

        // Colores específicos para categorías de eventos
        category: {
          conciertos: "#8b5cf6", // Violeta
          festivales: "#f59e0b", // Ámbar
          teatro: "#ef4444", // Rojo
          deportes: "#3b82f6", // Azul
          cultura: "#10b981", // Esmeralda
          familiar: "#f97316", // Naranja
          gastronomia: "#06b6d4", // Cian
          negocios: "#6b7280", // Gris
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      gridTemplateColumns: {
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium: "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        strong: "0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)",
        glow: "0 0 20px rgba(233, 30, 99, 0.3)",
        "glow-secondary": "0 0 20px rgba(99, 102, 241, 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
