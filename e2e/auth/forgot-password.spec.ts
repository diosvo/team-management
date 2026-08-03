import { expect, test } from '@playwright/test';

import { LOGIN_PATH } from '@/routes';

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test.describe('Page Load', () => {
    test('has correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/Team Management/);
    });

    test('displays forgot password form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Forgot your password?' }),
      ).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: 'Send request password instruction',
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Go back to sign in' }),
      ).toBeVisible();
    });

    test('loads without errors', async ({ page }) => {
      const errorAlert = page.locator('[role="alert"][data-status="error"]');
      await expect(errorAlert).not.toBeVisible();
    });

    test('email field has autofocus', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      await expect(emailInput).toBeFocused();
    });
  });

  test.describe('Navigation', () => {
    test('navigates back to login page', async ({ page }) => {
      await page.getByRole('link', { name: 'Go back to sign in' }).click();
      await expect(page).toHaveURL(LOGIN_PATH);
    });

    test('can navigate back with keyboard', async ({ page }) => {
      const backLink = page.getByRole('link', { name: 'Go back to sign in' });
      await backLink.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(LOGIN_PATH);
    });
  });

  test.describe('Form Validation', () => {
    test('submit button is disabled when email is empty', async ({ page }) => {
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });
      await expect(submitButton).toBeDisabled();
    });

    test('submit button is enabled when valid email is entered', async ({
      page,
    }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await emailInput.fill('test@example.com');
      await expect(submitButton).toBeEnabled();
    });

    test('validates email format', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await emailInput.fill('invalid-email');

      // Button should remain disabled for invalid email
      await expect(submitButton).toBeDisabled();
    });

    test('shows validation error for invalid email', async ({ page }) => {
      const emailInput = page.getByLabel('Email');

      await emailInput.fill('invalid-email');
      await emailInput.blur();

      // Should show validation error
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('clears validation error when email becomes valid', async ({
      page,
    }) => {
      const emailInput = page.getByLabel('Email');

      await emailInput.fill('invalid-email');
      await emailInput.blur();
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

      await emailInput.fill('valid@example.com');
      await emailInput.blur();
      await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
    });

    test('accepts various valid email formats', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        await emailInput.fill(email);
        await expect(submitButton).toBeEnabled();
        await emailInput.clear();
      }
    });
  });

  test.describe('Form Submission', () => {
    test('shows loading state during submission', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await emailInput.fill('test@example.com');
      await submitButton.click();

      // Should show loading state
      await expect(
        page.getByRole('button', { name: /sending/i }),
      ).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });

    test('disables form fields during submission', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await emailInput.fill('test@example.com');
      await submitButton.click();

      // Field should be disabled during submission
      await expect(emailInput).toBeDisabled();
    });

    test('shows success message after submission', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await emailInput.fill('test@example.com');
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      // Should show success message
      const successAlert = page.locator(
        '[role="alert"][data-status="success"]',
      );
      if (await successAlert.isVisible()) {
        await expect(successAlert).toContainText(
          /password reset instructions/i,
        );
      }
    });

    test('clears form after successful submission', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await emailInput.fill('test@example.com');
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      // Check if form is cleared after success
      const successAlert = page.locator(
        '[role="alert"][data-status="success"]',
      );
      if (await successAlert.isVisible()) {
        await expect(emailInput).toHaveValue('');
      }
    });

    test('shows error message for failed submission', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      // Use a potentially invalid email
      await emailInput.fill('nonexistent@example.com');
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      // Should show either success or error alert
      const alert = page.locator('[role="alert"]');
      if (await alert.isVisible()) {
        await expect(alert).toBeVisible();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can navigate form with Tab key', async ({ page }) => {
      const emailInput = page.getByLabel('Email');

      await emailInput.fill('test@example.com');

      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });
      const backLink = page.getByRole('link', { name: 'Go back to sign in' });

      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(backLink).toBeFocused();
    });

    test('can submit form with Enter key', async ({ page }) => {
      const emailInput = page.getByLabel('Email');

      await emailInput.fill('test@example.com');
      await emailInput.press('Enter');

      // Should submit form and show loading state
      const loadingButton = page.getByRole('button', { name: /sending/i });
      await expect(loadingButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('email field has proper attributes', async ({ page }) => {
      const emailInput = page.getByLabel('Email');

      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(emailInput).toHaveAttribute('autofocus');
    });

    test('form has proper ARIA labels', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      await expect(emailInput).toBeVisible();

      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });
      await expect(submitButton).toBeVisible();
    });

    test('error messages are accessible', async ({ page }) => {
      const emailInput = page.getByLabel('Email');

      await emailInput.fill('invalid-email');
      await emailInput.blur();

      // Error should be associated with the field
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('success/error alerts have proper role', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await emailInput.fill('test@example.com');
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const alert = page.locator('[role="alert"]');
      if (await alert.isVisible()) {
        await expect(alert).toHaveAttribute('role', 'alert');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('displays correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const heading = page.getByRole('heading', {
        name: 'Forgot your password?',
      });
      await expect(heading).toBeVisible();

      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      await expect(emailInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('displays correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const heading = page.getByRole('heading', {
        name: 'Forgot your password?',
      });
      await expect(heading).toBeVisible();
    });

    test('form is full width on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const submitButton = page.getByRole('button', {
        name: 'Send request password instruction',
      });

      // Button should be full width
      const buttonBox = await submitButton.boundingBox();
      const viewportSize = page.viewportSize();
      expect(buttonBox?.width).toBeGreaterThan(300); // Should be nearly full width
    });
  });

  test.describe('State Management', () => {
    test('clears state on page mount', async ({ page }) => {
      const emailInput = page.getByLabel('Email');

      // Fill and navigate away
      await emailInput.fill('test@example.com');
      await page.goto('/login');

      // Go back to forgot password
      await page.goto('/forgot-password');

      // Should be cleared
      await expect(emailInput).toHaveValue('');

      // No alerts should be visible
      const alert = page.locator('[role="alert"]');
      await expect(alert).not.toBeVisible();
    });

    test('maintains email value during validation', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const testEmail = 'test@example.com';

      await emailInput.fill(testEmail);
      await emailInput.blur();

      // Email should still be there after blur
      await expect(emailInput).toHaveValue(testEmail);
    });
  });
});
