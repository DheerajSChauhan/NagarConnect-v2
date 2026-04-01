export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#1A6B3C",
        accent: "#FF8C00",
        civic: "#1A237E",
        app: "#F5F0E8",
      },
      fontFamily: {
        heading: ["Baloo 2", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
        accent: ["Rajdhani", "sans-serif"],
      },
    },
  },
  plugins: [],
};
