import { test, expect } from '@playwright/test';

/**
 * E2E 测试：灵签幂等
 * 抽签两次 → 断言签号一致
 */
test('灵签幂等：抽签两次 → 断言签号一致', async ({ page }) => {
  // 1. 访问首页
  await page.goto('/');
  
  // 2. 等待灵签区域出现（假设首页有灵签入口）
  await expect(page.locator('button:has-text("抽灵签")')).toBeVisible();
  
  // 3. 第一次抽签
  await page.click('button:has-text("抽灵签")');
  
  // 4. 等待第一次抽签结果出现
  await expect(page.locator('div:has-text("灵签")')).toBeVisible({ timeout: 10000 });
  
  // 5. 获取第一次抽签的签号
  const firstSign = await page.textContent('div:has-text("灵签") + div');
  
  // 6. 第二次抽签
  await page.click('button:has-text("再抽一次")');
  
  // 7. 等待第二次抽签结果出现
  await expect(page.locator('div:has-text("灵签")')).toBeVisible({ timeout: 10000 });
  
  // 8. 获取第二次抽签的签号
  const secondSign = await page.textContent('div:has-text("灵签") + div');
  
  // 9. 断言两次抽签结果一致
  expect(firstSign).toEqual(secondSign);
});
