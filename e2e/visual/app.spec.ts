import { expect, test, type Page } from '@playwright/test';

// Screenshots of authenticated Chakra UI screens. Requires a working
// PW_USERNAME/PW_PASSWORD login against the dev database (see the `setup`
// project); runs under the `visual-app` project only.

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  // Charts and skeletons animate via JS, outside Playwright's
  // `animations: 'disabled'` reach — give them a moment to finish.
  await page.waitForTimeout(1_500);
}

for (const path of ['/dashboard', '/roster', '/team-rule', '/profile']) {
  test(`page ${path}`, async ({ page }) => {
    await page.goto(path);
    await settle(page);
    await expect(page).toHaveScreenshot(`${path.slice(1)}.png`, {
      fullPage: true,
    });
  });
}
