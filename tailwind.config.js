/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        surface: "#ffffff",
        foreground: "#0f172a",

        primary: {
          DEFAULT: "#0CC0DF",
          100: "#e6f9fd",
          500: "#0CC0DF",
          600: "#0aaac4",
          foreground: "#ffffff",
        },

        accent: "#e6f9fd",

        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },

        border: "#e5e7eb",
        ring: "#0CC0DF",
      },

      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },

      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.06)",
        card: "0 4px 12px rgba(0,0,0,0.05)",
      },

      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["15px", "22px"],
        lg: ["18px", "26px"],
        xl: ["20px", "28px"],
      },

      container: {
        center: true,
        padding: "2rem",
        screens: {
          xl: "1280px",
          "2xl": "1400px",
        },
      },
    },
  },
  plugins: [],
};
