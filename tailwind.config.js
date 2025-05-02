/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        navy: {
          50: "#f0f3fa",
          100: "#e0e7f5",
          200: "#c1cfe9",
          300: "#a1b7de",
          400: "#829fd2",
          500: "#6287c7",
          600: "#4f6fb1",
          700: "#415a91",
          800: "#334671",
          900: "#1e2a43",
          950: "#0c1425",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: "hsl(var(--foreground))",
            a: {
              color: "hsl(var(--primary))",
              "&:hover": {
                color: "hsl(var(--primary))",
              },
            },
            h1: {
              color: "hsl(var(--foreground))",
            },
            h2: {
              color: "hsl(var(--foreground))",
            },
            h3: {
              color: "hsl(var(--foreground))",
            },
            h4: {
              color: "hsl(var(--foreground))",
            },
            blockquote: {
              color: "hsl(var(--foreground))",
            },
            "ol > li::before": {
              color: "hsl(var(--foreground))",
            },
            "ul > li::before": {
              backgroundColor: "hsl(var(--foreground))",
            },
            hr: {
              borderColor: "hsl(var(--border))",
            },
          },
        },
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
