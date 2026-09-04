import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "src"),
      "@contracts": path.resolve(templateRoot, "contracts"),
      "@db": path.resolve(templateRoot, "db"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["api/**/*.test.ts", "api/**/*.spec.ts", "src/**/*.test.ts", "src/**/*.spec.ts"],
    // 后端 OAuth/auth 单测不依赖机器 .env（本机 .env 仅含前端 key 时 KIMI_AUTH_URL 为空，
    // 会让 createOAuthBeginHandler 的 buildAuthorizeUrl 抛裸 TypeError）。用样例 URL 使其机器无关且可断。
    env: {
      KIMI_AUTH_URL: "https://kimi.example.com",
    },
  },
});
