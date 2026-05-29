import { test, expect } from '@playwright/test';

test('홈페이지 접속 확인', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/');
});
