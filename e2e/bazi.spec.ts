import { test, expect } from '@playwright/test';

/**
 * E2E 测试：八字排盘端到端
 * 进 /bazi → 填表 → 排盘 → 断言四柱渲染
 */
test('八字排盘端到端：进 /bazi → 填表 → 排盘 → 断言四柱渲染', async ({ page }) => {
  // 1. 访问八字排盘页面
  await page.goto('/bazi');
  
  // 2. 等待页面加载完成
  await expect(page.locator('h1:has-text("八字排盘")')).toBeVisible();
  
  // 3. 填写生辰表单（使用默认值）
  // 年份选择
  await page.selectOption('select[name="year"]', '1990');
  // 月份选择
  await page.selectOption('select[name="month"]', '5');
  // 日期选择
  await page.selectOption('select[name="day"]', '15');
  // 性别选择
  await page.click('input[value="male"]');
  
  // 4. 提交表单
  await page.click('button:has-text("排盘")');
  
  // 5. 等待排盘结果出现
  await expect(page.locator('section:has-text("四柱命盘")')).toBeVisible({ timeout: 30000 });
  
  // 6. 断言四柱渲染
  await expect(page.locator('div:has-text("年柱")')).toBeVisible();
  await expect(page.locator('div:has-text("月柱")')).toBeVisible();
  await expect(page.locator('div:has-text("日柱")')).toBeVisible();
  await expect(page.locator('div:has-text("时柱")')).toBeVisible();
});
