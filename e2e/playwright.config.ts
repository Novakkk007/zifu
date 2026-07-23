import { defineConfig } from "@playwright/test";

/**
 * Playwright E2E 骨架（V10）。
 * 注意：本配置只提供运行骨架与示例用例发现能力；
 * 正式验收场景与成功标准以 docs/specs/e2e-v10.md（Codex 评审固化版）为准，
 * 规范固化前本目录任何用例不构成验收依据。
 */
export default defineConfig({
  testDir: "./",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "tablet", use: { viewport: { width: 834, height: 1112 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
