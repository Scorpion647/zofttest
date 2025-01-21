import type { Config } from "tailwindcss";
import daisyui from "daisyui"
import tailwindAnimate from "tailwindcss-animate"
import themes from "daisyui/src/theming/themes"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [daisyui, tailwindAnimate],

  daisyui: {
    themes: [{
      light: {
        ...themes.light,
        'primary': "#09856C",
        'primary-content': "#FFFFFF"
      }
    }],
  }
};
export default config;
