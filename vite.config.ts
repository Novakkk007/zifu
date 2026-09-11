import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  base: "/zifu/",
  plugins: [
    // 非 /api/ 路径交给 vite（前端）；但 /healthz、/readyz、OAuth 回调须走 hono，
    // 保证 dev 与生产探针行为一致（生产由 boot.ts 直接服务）。
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/|healthz$|readyz$).*$/] }),
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
  },
});
base: "/zifu/"
