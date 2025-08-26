import { test, expect } from '@playwright/test';

const base = 'http://localhost:3000';

test('signup -> login -> create post', async ({ page }) => {
  const email = `e2e+pw${Date.now()}@example.com`;
  const password = 'Password123!';
  // signup
  await page.goto(`${base}/signup`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="name"]', 'E2E User');
  await page.click('button[type="submit"]');
  // assume redirect to profile or dashboard
  await page.waitForTimeout(1000);
  // login
  await page.goto(`${base}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  // create post
  await page.goto(`${base}/new`);
  await page.fill('input[name="title"]', 'E2E Test Post');
  await page.fill('textarea[name="content"]', 'This is an e2e test post.');
  await page.click('button:has-text("저장")');
  // wait and assert post page
  await page.waitForURL('**/post/**');
  await expect(page.locator('h1')).toContainText('E2E Test Post');
});
