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
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "tg-radial":
          "radial-gradient(900px circle at 20% 10%, rgba(72, 130, 255, 0.18), transparent 60%), radial-gradient(700px circle at 80% 20%, rgba(110, 255, 210, 0.10), transparent 55%), radial-gradient(800px circle at 60% 90%, rgba(255, 120, 210, 0.08), transparent 55%)"
      }
    }
  },
  plugins: []
};

export default config;