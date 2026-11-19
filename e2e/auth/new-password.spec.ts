import type { Page } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { createResetToken } from '../setup/db';
import { expect, test } from '../setup/test';

// The form's only text field (its label also matches the visibility toggle).
const password = (page: Page) => page.locator('form input').first();
const submit = (page: Page) => page.getByRole('button', { name: 'Submit' });

/** A rule's list item, checked once its circle turns into a check. */
const rule = (page: Page, text: string) =>
  page.getByRole('listitem').filter({ hasText: text });

test.describe('New password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new-password?token=unused');
  });

  test('shows the form and the password rules', async ({ page }) => {
    await expect(page).toHaveTitle(/Auth \| SGR Portal/);
    await expect(
      page.getByRole('heading', { name: 'Create a new password' }),
    ).toBeVisible();
    for (const text of [
      'Be between 8 and 128 characters long',
      'Contain at least one letter',
      'Contain at least one number',
      'Contain at least one special character',
    ]) {
      await expect(rule(page, text)).toBeVisible();
    }
  });

  test('enables Submit only once every rule is met', async ({ page }) => {
    await expect(submit(page)).toBeDisabled();

    for (const weak of ['abc', 'abcdefgh', 'abcdefg1', '12345678!']) {
      await password(page).fill(weak);
      await expect(submit(page)).toBeDisabled();
    }

    await password(page).fill('Abcdefg1!');
    await expect(submit(page)).toBeEnabled();
  });

  test('rejects an invalid or expired link', async ({ page }) => {
    await password(page).fill('Abcdefg1!');
    await submit(page).click();

    await expect(
      page.getByText('This link is invalid or has expired.'),
    ).toBeVisible();
  });

  test('goes back to sign in', async ({ page }) => {
    await page.getByRole('link', { name: 'Go back to sign in' }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Reset a password end to end', () => {
  test('sets a new password from a reset link, then signs in with it', async ({
    page,
  }) => {
    // The guest account: no other spec signs in with it.
    const token = await createResetToken(SEED.guest.id);
    const newPassword = 'Guest#Reset2026';

    await page.goto(`/new-password?token=${token}`);
    await password(page).fill(newPassword);
    await submit(page).click();

    await expect(
      page.getByText('Create new password successful.'),
    ).toBeVisible();
    await expect(page).toHaveURL('/login');

    await page.getByLabel('Email').fill(SEED.guest.email);
    await page.locator('input[name="password"]').fill(newPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('cannot reuse a reset link', async ({ page }) => {
    const token = await createResetToken(SEED.guest.id);

    await page.goto(`/new-password?token=${token}`);
    await password(page).fill('Guest#Once2026');
    await submit(page).click();
    await expect(page).toHaveURL('/login');

    await page.goto(`/new-password?token=${token}`);
    await password(page).fill('Guest#Twice2026');
    await submit(page).click();
    await expect(
      page.getByText('This link is invalid or has expired.'),
    ).toBeVisible();
  });
});
