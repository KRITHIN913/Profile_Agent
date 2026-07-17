import type { Config } from "tailwindcss";

/**
 * Diligencify Profile Builder — Tailwind CSS Configuration
 *
 * Color palette extracted from diligencify.com.
 *
 * TODO: Verify these hex values against the live site's computed styles
 * (open DevTools → Elements → Computed → look for brand color CSS custom
 * properties or Elementor global colour palette). The fallback values below
 * are consistent with the financial-services aesthetic observed on the site.
 *
 * Live site uses: WordPress + Elementor, Google Font: Roboto
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ── Brand colour tokens ─────────────────────────────────────────────
      colors: {
        primary: {
          DEFAULT: "#0B2545", // Deep navy — primary brand / header backgrounds
          50: "#E8EDF5",
          100: "#C5D0E6",
          200: "#9FB3D6",
          300: "#7896C6",
          400: "#5879B6",
          500: "#3862A4",
          600: "#2A4D89",
          700: "#1E3A6E",
          800: "#122853",
          900: "#0B2545",
        },
        accent: {
          DEFAULT: "#C9A227", // Gold — CTAs, highlights, active states
          50: "#FDF8E8",
          100: "#F9EEC5",
          200: "#F5E39E",
          300: "#F0D876",
          400: "#EBCC4F",
          500: "#D9B62F",
          600: "#C9A227", // base
          700: "#A8821F",
          800: "#876317",
          900: "#66440F",
        },
        background: {
          DEFAULT: "#F8F9FB", // Off-white page background
          dark: "#0F1923",    // Dark-mode alternative
        },
        // Semantic tokens
        "brand-text": "#1A1D23",
        success: "#1E7F4E",
        warning: "#B54708",
        muted: "#6B7280",
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        // Roboto — matches Diligencify's live site font stack
        sans: ["Roboto", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── Spacing / sizing ─────────────────────────────────────────────────
      maxWidth: {
        "8xl": "90rem",
        "9xl": "100rem",
      },

      // ── Box shadows ───────────────────────────────────────────────────────
      boxShadow: {
        card: "0 1px 3px 0 rgba(11, 37, 69, 0.08), 0 1px 2px -1px rgba(11, 37, 69, 0.08)",
        "card-hover":
          "0 10px 25px -5px rgba(11, 37, 69, 0.15), 0 8px 10px -6px rgba(11, 37, 69, 0.1)",
        glow: "0 0 0 3px rgba(201, 162, 39, 0.25)",
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.35s ease-out forwards",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
