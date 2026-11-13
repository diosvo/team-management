import type { Page } from '@playwright/test';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';

import { SEED, SEED_PASSWORD, STORAGE_STATE } from './accounts';
import { expect, test as setup } from './test';

async function signIn(page: Page, email: string, file: string) {
  await page.goto(LOGIN_PATH);

  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // The session cookie lands over a redirect chain; wait for the final URL.
  await page.waitForURL(DEFAULT_LOGIN_REDIRECT);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();

  await page.context().storageState({ path: file });
}

setup('authenticate as admin', async ({ page }) => {
  await signIn(page, SEED.admin.email, STORAGE_STATE.admin);
});

setup('authenticate as player', async ({ page }) => {
  await signIn(page, SEED.player.email, STORAGE_STATE.player);
});
