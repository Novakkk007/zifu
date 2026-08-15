import { test, expect } from '@playwright/test';

/**
 * E2E 测试：术语悬浮
 * 八字结果页 hover 术语 → 断言 tooltip 出现
 */
test('术语悬浮：八字结果页 hover 术语 → 断言 tooltip 出现', async ({ page }) => {
  // 1. 访问八字排盘页面
  await page.goto('/bazi');
  
  // 2. 填写生辰表单并提交（使用默认值）
  await page.selectOption('select[name="year"]', '1990');
  await page.selectOption('select[name="month"]', '5');
  await page.selectOption('select[name="day"]', '15');
  await page.click('input[value="male"]');
  await page.click('button:has-text("排盘")');
  
  // 3. 等待排盘结果出现
  await expect(page.locator('section:has-text("四柱命盘")')).toBeVisible({ timeout: 30000 });
  
  // 4. 找到术语元素（假设术语有data-testid或特定class）
  // 使用文本选择器作为fallback
  const termElement = page.locator('text=十神');
  
  // 5. 悬停在术语上
  await termElement.hover();
  
  // 6. 断言tooltip出现
  await expect(page.locator('div[role="tooltip"]')).toBeVisible({ timeout: 5000 });
  
  // 7. 验证tooltip内容包含相关术语信息
  const tooltipText = await page.textContent('div[role="tooltip"]');
  expect(tooltipText).toContain('十神');
});
