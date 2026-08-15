import { test, expect } from '@playwright/test';

/**
 * E2E 测试：个人中心
 * /profile 可达 + 收藏显示
 */
test('个人中心：/profile 可达 + 收藏显示', async ({ page }) => {
  // 1. 访问个人中心页面
  await page.goto('/profile');
  
  // 2. 等待页面加载完成
  await expect(page.locator('h1:has-text("个人中心")')).toBeVisible();
  
  // 3. 断言收藏区域可见
  await expect(page.locator('text=我的收藏')).toBeVisible();
  
  // 4. 断言收藏列表存在（即使为空）
  await expect(page.locator('div:has-text("暂无收藏")').or(page.locator('div:has-text("收藏")'))).toBeVisible();
  
  // 5. 验证收藏统计信息
  const favoritesCount = await page.textContent('text=我的收藏 + div > span:text-matches("[0-9]+ 项")');
  expect(favoritesCount).toBeTruthy();
  
  // 6. 验证历史记录区域可见
  await expect(page.locator('text=历史记录')).toBeVisible();
});
