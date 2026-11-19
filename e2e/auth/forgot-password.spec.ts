import { expect, test } from '../setup/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/forgot-password');
});

test.describe('Forgot password page', () => {
  test('shows the request form', async ({ page }) => {
    await expect(page).toHaveTitle(/Auth \| SGR Portal/);
    await expect(
      page.getByRole('heading', { name: 'Forgot your password?' }),
    ).toBeVisible();
    await expect(page.getByLabel('Email')).toBeFocused();
    await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email');
  });

  test('goes back to sign in', async ({ page }) => {
    await page.getByRole('link', { name: 'Go back to sign in' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('only submits a valid email', async ({ page }) => {
    const submit = page.getByRole('button', {
      name: 'Send request password instruction',
    });
    await expect(submit).toBeDisabled();

    await page.getByLabel('Email').fill('not-an-email');
    await expect(submit).toBeDisabled();

    await page.getByLabel('Email').fill('someone@example.com');
    await expect(submit).toBeEnabled();
  });

  test('confirms the request without revealing whether the account exists', async ({
    page,
  }) => {
    await page.getByLabel('Email').fill('no-such-member@example.com');
    await page
      .getByRole('button', { name: 'Send request password instruction' })
      .click();

    await expect(
      page.getByText(
        'Password reset instructions have been sent to your email.',
      ),
    ).toBeVisible();
    // The form resets for another request.
    await expect(page.getByLabel('Email')).toHaveValue('');
  });
});
