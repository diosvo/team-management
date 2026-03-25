import { expect, test } from '@playwright/test';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';

test.beforeEach(async ({ page }) => {
  await page.goto(LOGIN_PATH);
});

test('redirects to /login when accessing a protected route unauthenticated', async ({
  page,
}) => {
  await page.goto(DEFAULT_LOGIN_REDIRECT);
  await expect(page).toHaveURL(LOGIN_PATH);
});

test('renders the login form', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Sign in to your account' }),
  ).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Forgot your password?' }),
  ).toBeVisible();
});

test('navigates to forgot password page', async ({ page }) => {
  await page.getByRole('link', { name: 'Forgot your password?' }).click();
  await expect(page).toHaveURL('/forgot-password');
});
