import { expect, test } from '@playwright/test';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_PATH);
  });

  test.describe('Page Load', () => {
    test('has correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/Team Management/);
    });

    test('redirects to /login when accessing a protected route unauthenticated', async ({
      page,
    }) => {
      await page.goto(DEFAULT_LOGIN_REDIRECT);
      await expect(page).toHaveURL(LOGIN_PATH);
    });

    test('displays login form', async ({ page }) => {
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

    test('loads without errors', async ({ page }) => {
      const errorAlert = page.locator('[role="alert"][data-status="error"]');
      await expect(errorAlert).not.toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('navigates to forgot password page', async ({ page }) => {
      await page.getByRole('link', { name: 'Forgot your password?' }).click();
      await expect(page).toHaveURL('/forgot-password');
    });
  });

  test.describe('Form Validation', () => {
    test('email field is required', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      await passwordInput.fill('password123');
      await submitButton.click();

      // Email field should show validation error
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('password field is required', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      await emailInput.fill('test@example.com');
      await submitButton.click();

      // Password field should show validation error
      await expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('validates email format', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      await emailInput.fill('invalid-email');
      await passwordInput.fill('password123');
      await submitButton.click();

      // Should show validation error for invalid email
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('accepts valid email format', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      await emailInput.fill('test@example.com');
      await emailInput.blur();

      // Should not show validation error
      await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('Authentication', () => {
    test('shows error for invalid credentials', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();

      // Should show error alert
      const errorAlert = page.locator('[role="alert"][data-status="error"]');
      await expect(errorAlert).toBeVisible();
    });

    test('shows loading state during submission', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      await submitButton.click();

      // Should show loading state
      await expect(submitButton).toBeDisabled();
      await expect(
        page.getByRole('button', { name: /directing/i }),
      ).toBeVisible();
    });

    test('disables form fields during submission', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      await submitButton.click();

      // Fields should be disabled during submission
      await expect(emailInput).toBeDisabled();
      await expect(passwordInput).toBeDisabled();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can navigate form with Tab key', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      const forgotPasswordLink = page.getByRole('link', {
        name: 'Forgot your password?',
      });
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      // Tab through form elements
      await emailInput.focus();
      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(forgotPasswordLink).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();
    });

    test('can submit form with Enter key', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      await passwordInput.press('Enter');

      // Should submit form and show loading state
      const submitButton = page.getByRole('button', { name: /directing/i });
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('email field has proper attributes', async ({ page }) => {
      const emailInput = page.getByLabel('Email');

      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(emailInput).toHaveAttribute('autofocus');
    });

    test('password field has proper attributes', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');

      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(passwordInput).toHaveAttribute(
        'autocomplete',
        'current-password',
      );
    });

    test('error messages are associated with fields', async ({ page }) => {
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', { name: 'Sign In' });

      await submitButton.click();

      // Error message should be associated with the field
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('Responsive Design', () => {
    test('displays correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const heading = page.getByRole('heading', {
        name: 'Sign in to your account',
      });
      await expect(heading).toBeVisible();

      const emailInput = page.getByLabel('Email');
      const passwordInput = page.locator('input[name="password"]');
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('displays correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const heading = page.getByRole('heading', {
        name: 'Sign in to your account',
      });
      await expect(heading).toBeVisible();
    });
  });
});
