import type {Config} from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102a2e",
        canvas: "#f3f7f3",
        safety: "#f4c542",
        forest: "#164c45",
      },
      boxShadow: {
        card: "0 18px 60px rgba(16, 42, 46, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
