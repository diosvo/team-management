import { expect, type Page, test } from '@playwright/test';

/** An email template's accordion trigger and its rendered preview. */
const template = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/emails');
});

test.describe('Emails page', () => {
  test('has the title and both sections', async ({ page }) => {
    await expect(page).toHaveTitle(/Email Preview/);
    await expect(
      page.getByRole('heading', { name: /^Sent Emails/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /^Email Preview/ }).first(),
    ).toBeVisible();
  });

  test('reports when the sent emails cannot be loaded', async ({ page }) => {
    // The e2e server holds no valid Resend key, so the list call fails and
    // the page says so instead of crashing or showing an empty table.
    await expect(page.getByText(/^Error: /)).toBeVisible();
  });
});

test.describe('Email templates', () => {
  test('previews the reset password email', async ({ page }) => {
    const trigger = template(page, 'Reset password');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('region', { name: 'Reset password' }),
    ).toContainText(/password/i);

    // Collapsible: a second click closes it.
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('previews the analytics report email', async ({ page }) => {
    const trigger = template(page, 'Analytics Report');
    await trigger.click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('region', { name: 'Analytics Report' }),
    ).toBeVisible();
  });

  test('keeps one template open at a time', async ({ page }) => {
    await template(page, 'Reset password').click();
    await template(page, 'Analytics Report').click();

    await expect(template(page, 'Analytics Report')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(template(page, 'Reset password')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
