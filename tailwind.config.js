/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        anime: {
          bg: "#080810",
          card: "#0f0f1a",
          border: "#1a1a3a",
          primary: "#7c3aed",
          secondary: "#db2777",
          accent: "#a855f7",
          text: "#e2e8f0",
        },
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(124, 58, 237, 0.1)",
        "glow-pink": "0 0 20px rgba(219, 39, 119, 0.4), 0 0 40px rgba(219, 39, 119, 0.1)",
        "glow-purple-sm": "0 0 10px rgba(124, 58, 237, 0.3)",
        "glow-pink-sm": "0 0 10px rgba(219, 39, 119, 0.3)",
      },
      backgroundImage: {
        "gradient-anime": "linear-gradient(135deg, #080810 0%, #0f0820 50%, #080810 100%)",
        "gradient-card": "linear-gradient(135deg, #0f0f1a 0%, #130d1f 100%)",
        "gradient-hero": "linear-gradient(135deg, #0a0614 0%, #130d1f 40%, #0a0a1a 100%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(124, 58, 237, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.6), 0 0 40px rgba(124, 58, 237, 0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
}
