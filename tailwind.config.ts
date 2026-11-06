import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf9f4",
        ink: "#243329",
        moss: "#526f54",
        sage: "#e8efe4",
        peach: "#fff0e1",
        "muted-ink": "#758276",
      },
      boxShadow: { card: "0 8px 32px rgba(40, 59, 38, .035)" },
      borderRadius: { card: "1.4rem" },
    },
  },
  plugins: [],
} satisfies Config;
