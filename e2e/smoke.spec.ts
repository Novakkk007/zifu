import { test, expect } from "@playwright/test";

/**
 * 骨架示例用例（非验收场景）：
 * 仅验证「骨架能跑通」——服务可达、首页可渲染。
 * 正式验收场景待 docs/specs/e2e-v10.md 经 Codex 评审固化后补充。
 */

test("骨架示例：首页可访问且渲染根节点", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator("#root")).toBeAttached();
});

test("骨架示例：健康探针返回 ok", async ({ request }) => {
  const res = await request.get("/healthz");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
});
