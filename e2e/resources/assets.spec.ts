import { expect, test } from '@playwright/test';

test('goes to Assets page', async ({ page }) => {
  await page.goto('/assets');

  await expect(page).toHaveTitle(/Assets/);
});
