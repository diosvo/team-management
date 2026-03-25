import { expect, test as setup } from '@playwright/test';
import path from 'path';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';

import env from '@env';
const adminFile = path.join(__dirname, '../../playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Perform authentication steps
  await page.goto(LOGIN_PATH);

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.getByLabel('Email').fill(env.PW_USERNAME);
  await page.locator('input[name="password"]').fill(env.PW_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait until the page receives the session.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL(DEFAULT_LOGIN_REDIRECT);

  // End of authentication steps.
  await page.context().storageState({ path: adminFile });
});
