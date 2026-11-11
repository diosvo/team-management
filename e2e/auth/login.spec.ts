import type { Page } from '@playwright/test';

import { SEED, SEED_PASSWORD } from '../setup/accounts';
import { expect, test } from '../setup/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

const email = (page: Page) => page.getByLabel('Email');
const password = (page: Page) => page.locator('input[name="password"]');
const signIn = (page: Page) => page.getByRole('button', { name: 'Sign In' });

test.describe('Login page', () => {
  test('shows the sign-in form', async ({ page }) => {
    await expect(page).toHaveTitle(/Auth \| SGR Portal/);
    await expect(
      page.getByRole('heading', { name: 'Sign in to your account' }),
    ).toBeVisible();
    await expect(email(page)).toBeFocused();
    await expect(email(page)).toHaveAttribute('autocomplete', 'email');
    await expect(password(page)).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
  });

  test('links to the forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot your password?' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('toggles the password visibility', async ({ page }) => {
    await password(page).fill('secret-value');
    await expect(password(page)).toHaveAttribute('type', 'password');

    await page
      .getByRole('button', { name: 'Toggle password visibility' })
      .click();
    await expect(password(page)).toHaveAttribute('type', 'text');
  });
});

test.describe('Validation', () => {
  test('keeps Sign In disabled until both fields are valid', async ({
    page,
  }) => {
    await expect(signIn(page)).toBeDisabled();

    await email(page).fill('not-an-email');
    await password(page).fill(SEED_PASSWORD);
    await expect(signIn(page)).toBeDisabled();

    await email(page).fill(SEED.coach.email);
    await expect(signIn(page)).toBeEnabled();

    await password(page).clear();
    await expect(signIn(page)).toBeDisabled();
  });
});

test.describe('Authentication', () => {
  test('rejects wrong credentials until one of them changes', async ({
    page,
  }) => {
    await email(page).fill(SEED.coach.email);
    await password(page).fill('WrongPass#1');
    await signIn(page).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    // The same pair would fail again: edit a field first.
    await expect(signIn(page)).toBeDisabled();

    await password(page).fill(`${SEED_PASSWORD}x`);
    await expect(page.getByText('Invalid email or password.')).toBeHidden();
    await expect(signIn(page)).toBeEnabled();
  });

  test('signs in with Enter and lands on the dashboard', async ({ page }) => {
    await email(page).fill(SEED.coach.email);
    await password(page).fill(SEED_PASSWORD);
    await password(page).press('Enter');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();

    // A signed-in visit to /login goes straight back to the app.
    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });

  test('sends signed-out visitors of a protected page to the login', async ({
    page,
  }) => {
    await page.goto('/roster');
    await expect(page).toHaveURL('/login');
  });
});
