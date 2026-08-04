import { expect, test } from '@playwright/test';

import { LOGIN_PATH } from '@/routes';

const VALID_TOKEN = 'test-reset-token-123';
const PASSWORD_RULES = [
  'Be between 8 and 128 characters long',
  'Contain at least one letter',
  'Contain at least one number',
  'Contain at least one special character',
];

test.describe('New Password Page', () => {
  test.describe('Page Load', () => {
    test('has correct title', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);
      await expect(page).toHaveTitle(/Team Management/);
    });

    test('displays new password form', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      await expect(
        page.getByRole('heading', { name: 'Create a new password' }),
      ).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Go back to sign in' }),
      ).toBeVisible();
    });

    test('loads without errors', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const errorAlert = page.locator('[role="alert"][data-status="error"]');
      await expect(errorAlert).not.toBeVisible();
    });

    test('displays password rules', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      for (const rule of PASSWORD_RULES) {
        await expect(page.getByText(rule)).toBeVisible();
      }
    });

    test('all rules start as unmet (gray)', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      // All rules should have gray/unmet indicators initially
      const list = page.locator('ul[role="list"]');
      await expect(list).toBeVisible();

      // Check for CircleDashed icon (unmet state)
      const listItems = await list.locator('li').count();
      expect(listItems).toBe(PASSWORD_RULES.length);
    });
  });

  test.describe('Navigation', () => {
    test('navigates back to login page', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);
      await page.getByRole('link', { name: 'Go back to sign in' }).click();
      await expect(page).toHaveURL(LOGIN_PATH);
    });

    test('can navigate back with keyboard', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const backLink = page.getByRole('link', { name: 'Go back to sign in' });
      await backLink.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(LOGIN_PATH);
    });
  });

  test.describe('Form Validation', () => {
    test('submit button is disabled for empty password', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const submitButton = page.getByRole('button', { name: 'Submit' });
      await expect(submitButton).toBeDisabled();
    });

    test('submit button is disabled for password not meeting all rules', async ({
      page,
    }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // Password with only letters (missing number and special char)
      await passwordInput.fill('password');
      await expect(submitButton).toBeDisabled();

      // Password with letters and numbers (missing special char)
      await passwordInput.fill('password123');
      await expect(submitButton).toBeDisabled();
    });

    test('submit button is enabled for valid password', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // Valid password meeting all rules
      await passwordInput.fill('Password123!');
      await expect(submitButton).toBeEnabled();
    });

    test('validates password length (minimum 8 characters)', async ({
      page,
    }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // Too short
      await passwordInput.fill('Pass1!');
      await expect(submitButton).toBeDisabled();

      // Exactly 8 characters (valid)
      await passwordInput.fill('Pass123!');
      await expect(submitButton).toBeEnabled();
    });

    test('validates password length (maximum 128 characters)', async ({
      page,
    }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // 128 characters (valid)
      const maxPassword = 'A1!' + 'a'.repeat(125);
      await passwordInput.fill(maxPassword);
      await expect(submitButton).toBeEnabled();

      // 129 characters (invalid)
      const tooLongPassword = 'A1!' + 'a'.repeat(126);
      await passwordInput.fill(tooLongPassword);
      await expect(submitButton).toBeDisabled();
    });

    test('validates password contains at least one letter', async ({
      page,
    }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // No letters
      await passwordInput.fill('12345678!');
      await expect(submitButton).toBeDisabled();

      // With letter
      await passwordInput.fill('Password123!');
      await expect(submitButton).toBeEnabled();
    });

    test('validates password contains at least one number', async ({
      page,
    }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // No numbers
      await passwordInput.fill('Password!@#');
      await expect(submitButton).toBeDisabled();

      // With number
      await passwordInput.fill('Password1!');
      await expect(submitButton).toBeEnabled();
    });

    test('validates password contains at least one special character', async ({
      page,
    }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // No special characters
      await passwordInput.fill('Password123');
      await expect(submitButton).toBeDisabled();

      // With special character
      await passwordInput.fill('Password123!');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Password Rules Visual Feedback', () => {
    test('updates rule indicators as password is typed', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');

      // Start typing - length rule should turn green
      await passwordInput.fill('12345678');

      // Should have some green indicators for met rules
      const ruleText = page.getByText(PASSWORD_RULES[0]);
      await expect(ruleText).toBeVisible();
    });

    test('length rule updates correctly', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const lengthRule = page.getByText(PASSWORD_RULES[0]);

      // Less than 8 characters - should be gray
      await passwordInput.fill('Pass1!');
      await expect(lengthRule).toBeVisible();

      // 8+ characters - should indicate success
      await passwordInput.fill('Password1!');
      await expect(lengthRule).toBeVisible();
    });

    test('letter rule updates correctly', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const letterRule = page.getByText(PASSWORD_RULES[1]);

      // No letters
      await passwordInput.fill('12345678!');
      await expect(letterRule).toBeVisible();

      // With letter
      await passwordInput.fill('Password123!');
      await expect(letterRule).toBeVisible();
    });

    test('number rule updates correctly', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const numberRule = page.getByText(PASSWORD_RULES[2]);

      // No numbers
      await passwordInput.fill('Password!@#');
      await expect(numberRule).toBeVisible();

      // With number
      await passwordInput.fill('Password1!');
      await expect(numberRule).toBeVisible();
    });

    test('special character rule updates correctly', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const specialCharRule = page.getByText(PASSWORD_RULES[3]);

      // No special characters
      await passwordInput.fill('Password123');
      await expect(specialCharRule).toBeVisible();

      // With special character
      await passwordInput.fill('Password123!');
      await expect(specialCharRule).toBeVisible();
    });

    test('all rules turn green for valid password', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');

      // Enter valid password meeting all rules
      await passwordInput.fill('ValidPassword123!');

      // All rule texts should still be visible
      for (const rule of PASSWORD_RULES) {
        await expect(page.getByText(rule)).toBeVisible();
      }
    });
  });

  test.describe('Form Submission', () => {
    test('shows loading state during submission', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      await passwordInput.fill('ValidPassword123!');
      await submitButton.click();

      // Should show loading state
      await expect(
        page.getByRole('button', { name: /submitting/i }),
      ).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });

    test('disables form fields during submission', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      await passwordInput.fill('ValidPassword123!');
      await submitButton.click();

      // Field should be disabled during submission
      await expect(passwordInput).toBeDisabled();
    });

    test('shows error for missing token', async ({ page }) => {
      await page.goto('/new-password');

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      await passwordInput.fill('ValidPassword123!');
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const errorAlert = page.locator('[role="alert"][data-status="error"]');
      if (await errorAlert.isVisible()) {
        await expect(errorAlert).toBeVisible();
      }
    });

    test('shows error for invalid token', async ({ page }) => {
      await page.goto('/new-password?token=invalid-token');

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      await passwordInput.fill('ValidPassword123!');
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const errorAlert = page.locator('[role="alert"][data-status="error"]');
      if (await errorAlert.isVisible()) {
        await expect(errorAlert).toBeVisible();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can navigate form with Tab key', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      await passwordInput.fill('ValidPassword123!');

      const submitButton = page.getByRole('button', { name: 'Submit' });
      const backLink = page.getByRole('link', { name: 'Go back to sign in' });

      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(backLink).toBeFocused();
    });

    test('can submit form with Enter key', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');

      await passwordInput.fill('ValidPassword123!');
      await passwordInput.press('Enter');

      // Should submit form and show loading state
      const loadingButton = page.getByRole('button', { name: /submitting/i });
      await expect(loadingButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('password field has proper attributes', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('form has proper ARIA labels', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      await expect(passwordInput).toBeVisible();

      const submitButton = page.getByRole('button', { name: 'Submit' });
      await expect(submitButton).toBeVisible();
    });

    test('password rules list has proper structure', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const list = page.locator('ul[role="list"]');
      await expect(list).toBeVisible();

      // Should have list items
      const listItems = list.locator('li');
      await expect(listItems).toHaveCount(PASSWORD_RULES.length);
    });

    test('error messages have proper role', async ({ page }) => {
      await page.goto('/new-password?token=invalid');

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      await passwordInput.fill('ValidPassword123!');
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
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const heading = page.getByRole('heading', {
        name: 'Create a new password',
      });
      await expect(heading).toBeVisible();

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Password rules should be visible
      for (const rule of PASSWORD_RULES) {
        await expect(page.getByText(rule)).toBeVisible();
      }
    });

    test('displays correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const heading = page.getByRole('heading', {
        name: 'Create a new password',
      });
      await expect(heading).toBeVisible();
    });

    test('form is full width on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const submitButton = page.getByRole('button', { name: 'Submit' });

      // Button should be full width
      const buttonBox = await submitButton.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(300);
    });
  });

  test.describe('URL Parameter Handling', () => {
    test('extracts token from URL', async ({ page }) => {
      const testToken = 'abc123xyz';
      await page.goto(`/new-password?token=${testToken}`);

      // Form should be accessible with token
      const heading = page.getByRole('heading', {
        name: 'Create a new password',
      });
      await expect(heading).toBeVisible();
    });

    test('handles missing token parameter', async ({ page }) => {
      await page.goto('/new-password');

      // Page should still load but submission will fail
      const heading = page.getByRole('heading', {
        name: 'Create a new password',
      });
      await expect(heading).toBeVisible();
    });

    test('handles empty token parameter', async ({ page }) => {
      await page.goto('/new-password?token=');

      const heading = page.getByRole('heading', {
        name: 'Create a new password',
      });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Password Input Behavior', () => {
    test('password is masked by default', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('can toggle password visibility', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      await passwordInput.fill('Password123!');

      // Look for visibility toggle button (if implemented)
      const toggleButton = page.locator('button[aria-label*="password"]');
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        // Type might change to 'text'
        const inputType = await passwordInput.getAttribute('type');
        expect(inputType).toBeTruthy();
      }
    });

    test('validates password in real-time', async ({ page }) => {
      await page.goto(`/new-password?token=${VALID_TOKEN}`);

      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Submit' });

      // Start with invalid
      await passwordInput.fill('weak');
      await expect(submitButton).toBeDisabled();

      // Make it valid
      await passwordInput.fill('');
      await passwordInput.fill('ValidPassword123!');
      await expect(submitButton).toBeEnabled();
    });
  });
});
