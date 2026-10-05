/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base / Radix compatibility
        border: "hsl(var(--border, 214 32% 91%))",
        input: "hsl(var(--input, 214 32% 91%))",
        ring: "hsl(var(--ring, 222 84% 5%))",
        background: "#F5F6F8",
        foreground: "hsl(var(--foreground, 222 47% 11%))",
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 222 47% 11.2%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 210 40% 96.1%))",
          foreground: "hsl(var(--muted-foreground, 215.4 16.3% 46.9%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 210 40% 96.1%))",
          foreground: "hsl(var(--accent-foreground, 222 47% 11.2%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%))",
          foreground: "hsl(var(--destructive-foreground, 210 40% 98%))",
        },

        // Navy + Copper theme (same values as the CSS variables in styles.css :root)
        navy: { 50: "#F2F5FA", 100: "#E6ECF5", 600: "#2C4A7A", 700: "#1F3760", 800: "#16294A", 900: "#0F1E33", 950: "#0A1424" },
        copper: { 50: "#FBF4EE", 100: "#F5E6D8", 200: "#EACBB0", 500: "#B87333", 600: "#9C5B26", 700: "#7D4720" },
        neutral: {
          page: "#F5F6F8", surface: "#FFFFFF", subtle: "#FAFBFC", muted: "#F2F4F7",
          border: "#E4E7EC", "border-strong": "#CBD2DC",
          text: "#1E2633", secondary: "#4A5565", "text-muted": "#636E7E", placeholder: "#98A2B3",
        },
        // Accent = copper (primary buttons, active states, focus, progress only)
        primary: {
          DEFAULT: "#B87333",
          50: '#FBF4EE',
          100: '#F5E6D8',
          500: '#B87333',
          600: '#9C5B26',
          700: '#7D4720',
        },
        "primary-container": "#4f46e5",
        "on-primary": "#ffffff",
        "on-primary-container": "#dad7ff",
        "primary-fixed": "#e2dfff",
        "primary-fixed-dim": "#c3c0ff",
        "on-primary-fixed": "#0f0069",
        "on-primary-fixed-variant": "#3323cc",
        "inverse-primary": "#c3c0ff",

        secondary: {
          DEFAULT: "#1F3760",
          foreground: "hsl(var(--secondary-foreground, 222 47% 11.2%))",
        },
        "secondary-container": "#8a4cfc",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#fffbff",
        "secondary-fixed": "#eaddff",
        "secondary-fixed-dim": "#d2bbff",
        "on-secondary-fixed": "#25005a",
        "on-secondary-fixed-variant": "#5a00c6",

        tertiary: "#005338",
        "tertiary-container": "#006e4b",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#67f4b7",
        "tertiary-fixed": "#6ffbbe",
        "tertiary-fixed-dim": "#4edea3",
        "on-tertiary-fixed": "#002113",
        "on-tertiary-fixed-variant": "#005236",

        // Semantic states
        success: "#2F6B4F",
        warning: "#94600F",
        blocker: "#f43f5e",
        error: "#A23B2C",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        // Stitch Executive Precision Surfaces
        surface: "#FFFFFF",
        "surface-dim": "#cbdbf5",
        "surface-bright": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-variant": "#d3e4fe",
        "surface-tint": "#4d44e3",
        "on-surface": "#1E2633",
        "on-surface-variant": "#464555",
        "on-background": "#1E2633",
        outline: "#777587",
        "outline-variant": "#c7c4d8",
        "inverse-surface": "#0F1E33",
        "inverse-on-surface": "#eaf1ff",
      },

      spacing: {
        "space-2xs": "0.125rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        "space-2xl": "3rem",
        "space-3xl": "4.5rem",
        "gutter-sm": "1rem",
        "gutter": "1.5rem",
        "gutter-lg": "2rem",
        "margin-mobile": "1rem",
        "margin": "2rem",
        "margin-desktop": "3rem",
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        code: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        "label-caps": ["0.6875rem", { lineHeight: "0.875rem", letterSpacing: "0.06em", fontWeight: "700" }],
        "label-sm": ["0.6875rem", { lineHeight: "0.875rem", letterSpacing: "0.04em", fontWeight: "600" }],
        "label-md": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-lg": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body-sm": ["0.75rem", { lineHeight: "1.125rem", letterSpacing: "0", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.375rem", letterSpacing: "-0.005em", fontWeight: "400" }],
        "body-lg": ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em", fontWeight: "400" }],
        "headline-sm": ["1.125rem", { lineHeight: "1.5rem", letterSpacing: "-0.015em", fontWeight: "600" }],
        "headline-lg": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-xl": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.025em", fontWeight: "600" }],
        "display-lg-mobile": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-lg": ["3.5rem", { lineHeight: "4rem", letterSpacing: "-0.03em", fontWeight: "700" }],
        "code-inline": ["0.8125rem", { lineHeight: "1.125rem", letterSpacing: "-0.01em", fontWeight: "500" }],
      },

      boxShadow: {
        "stitch-card": "0 1px 2px rgba(16, 24, 40, 0.05)",
        "stitch-hover": "0 4px 12px rgba(16, 24, 40, 0.05)",
        "stitch-drawer": "0 8px 24px rgba(16, 24, 40, 0.10)",
      },

      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.02)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: 1 },
          '100%': { transform: 'scale(2.2)', opacity: 0 },
        },
        pulseBlocker: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 63, 94, 0.6)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 0 8px rgba(244, 63, 94, 0)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ripple: 'ripple 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        pulseBlocker: 'pulseBlocker 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
