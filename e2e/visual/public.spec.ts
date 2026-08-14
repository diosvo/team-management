import { expect, test } from '@playwright/test';

// Screenshots of public (unauthenticated) Chakra UI screens. Baselines are
// captured before the docs (Tailwind/Fumadocs) migration; any later diff
// means docs CSS is bleeding into the main app.

test.use({ storageState: { cookies: [], origins: [] } });

for (const path of ['/login', '/forgot-password']) {
  test(`page ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`${path.slice(1)}.png`, {
      fullPage: true,
    });
  });
}
