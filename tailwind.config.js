/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* 紫府三主题 token（CSS 变量驱动，见 index.css） */
        silk: "rgb(var(--silk) / <alpha-value>)",
        silk2: "rgb(var(--silk-2) / <alpha-value>)",
        deep: "rgb(var(--deep) / <alpha-value>)",
        deep2: "rgb(var(--deep-2) / <alpha-value>)",
        deep3: "rgb(var(--deep-3) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        goldbright: "rgb(var(--gold-bright) / <alpha-value>)",
        golddim: "rgb(var(--gold-dim) / <alpha-value>)",
        inktext: "rgb(var(--ink-text) / <alpha-value>)",
        inkmuted: "rgb(var(--ink-muted) / <alpha-value>)",
        silktext: "rgb(var(--silk-text) / <alpha-value>)",
        silkmuted: "rgb(var(--silk-muted) / <alpha-value>)",
        /* 语义色（gold-indigo 主题原生定义，其余主题走 :root 兜底值） */
        zifured: "rgb(var(--zifu-red) / <alpha-value>)",
        zifugreen: "rgb(var(--zifu-green) / <alpha-value>)",
        zifublue: "rgb(var(--zifu-blue) / <alpha-value>)",
        /* shadcn 兼容 */
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Songti SC', 'serif'],
        sans: ['"Noto Sans SC"', 'PingFang SC', 'sans-serif'],
        latin: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: "12px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 18px 40px -18px rgba(0,0,0,.35)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "glyph-drift": {
          "0%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(var(--gx, 24px), var(--gy, -30px)) rotate(var(--gr, 5deg))" },
          "100%": { transform: "translate(0, 0) rotate(0deg)" },
        },
        "gold-breathe": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(199,162,58,0)" },
          "50%": { boxShadow: "0 0 26px 4px rgba(199,162,58,.38)" },
        },
        "float-hint": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "dot-breathe": {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
        "icon-sway": {
          "0%, 88%, 100%": { transform: "rotate(0deg)" },
          "92%": { transform: "rotate(2deg)" },
          "96%": { transform: "rotate(-2deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        marquee: "marquee 40s linear infinite",
        "glyph-drift": "glyph-drift 40s ease-in-out infinite",
        "gold-breathe": "gold-breathe 3s ease-in-out infinite",
        "float-hint": "float-hint 1.8s ease-in-out infinite",
        "spin-slow": "spin-slow 240s linear infinite",
        "dot-breathe": "dot-breathe 2.4s ease-in-out infinite",
        "icon-sway": "icon-sway 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
