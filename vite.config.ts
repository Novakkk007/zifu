import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 手动分包：react 生态 / 动画 / 图表 / 星历各自独立 chunk，便于缓存与按需加载
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)
          ) {
            return "vendor-react";
          }
          if (
            /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils|gsap|@gsap)[\\/]/.test(id)
          ) {
            return "vendor-anim";
          }
          if (
            /[\\/]node_modules[\\/](recharts|victory-vendor|d3-[a-z-]+|react-is|decimal\.js-light)[\\/]/.test(id)
          ) {
            return "vendor-charts";
          }
          if (/[\\/]node_modules[\\/]astronomy-engine[\\/]/.test(id)) {
            return "vendor-astro";
          }
          return undefined;
        },
      },
    },
  },
});
