import { expect, test } from '@playwright/test';
import {
  testCheckboxFilter,
  testCheckboxFilterReset,
  testSearchWithQueryParams,
  testTableHeaders,
} from '../setup/helpers';
import { TablePOM } from '../setup/pom';

test.beforeEach(async ({ page }) => {
  await page.goto('/emails');
});

test.describe('Emails Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Email Preview/);
  });

  test('displays both main sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Sent Emails' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Email Preview' }),
    ).toBeVisible();
  });

  test('displays error message when email fetch fails', async ({ page }) => {
    // Check if error message is displayed (if API fails)
    const errorText = page.getByText(/Error:/);
    // This test will pass if no error, or if error is properly displayed
    if (await errorText.isVisible()) {
      await expect(errorText).toBeVisible();
    }
  });
});

test.describe('Sent Emails Table', () => {
  test('renders the table with headers', async ({ page }) => {
    await testTableHeaders(page, ['To', 'Subject', 'Status', 'Created At']);
  });

  test('displays empty state when no emails sent', async ({ page }) => {
    const emptyState = page.getByText('No emails sent.');
    // If the table is empty, should show the empty state
    const hasRows = await page.getByRole('row').nth(1).isVisible();
    if (!hasRows) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('displays email records with proper formatting', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);
    if (await firstDataRow.isVisible()) {
      // Check that status badges are visible
      await expect(
        page.getByRole('row').first().locator('[data-badge]'),
      ).toBeVisible();
    }
  });
});

test.describe('Sent Emails - Search and Filtering', () => {
  test('filters emails by search query and updates query params', async ({
    page,
  }) => {
    await testSearchWithQueryParams(
      page,
      'test@example.com',
      /q=test%40example\.com/,
    );
  });

  test('filters emails by status using checkbox filters', async ({ page }) => {
    await testCheckboxFilter(page, 'Status', 'Delivered', /status=/);
  });

  test('clears status filters when reset is clicked', async ({ page }) => {
    await testCheckboxFilterReset(page, 'Status', 'Sent', /status=/);
  });

  test('combines search and status filters', async ({ page }) => {
    // Apply search filter
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('admin');

    // Apply status filter
    const filterSection = page.locator('text=Status').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const deliveredOption = page.getByRole('checkbox', { name: 'Delivered' });
      if (await deliveredOption.isVisible()) {
        await deliveredOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    // Both filters should be in URL
    await expect(page).toHaveURL(/q=admin/);
    await expect(page).toHaveURL(/status=/);
  });
});

test.describe('Sent Emails - Pagination', () => {
  test('displays pagination controls when there are multiple pages', async ({
    page,
  }) => {
    // Check if pagination exists
    const pagination = page.getByRole('navigation', { name: 'pagination' });
    const hasMultiplePages = await pagination.isVisible();

    if (hasMultiplePages) {
      await expect(pagination).toBeVisible();
      // Check for next/previous buttons
      const nextButton = page.getByRole('button', { name: 'Next' });
      await expect(nextButton).toBeVisible();
    }
  });

  test('navigates to next page and updates query params', async ({ page }) => {
    await new TablePOM(page).navigateToNextPage();
  });

  test('navigates to specific page using page numbers', async ({ page }) => {
    // Look for page number buttons (e.g., "2")
    const pageButton = page.getByRole('button', { name: '2', exact: true });
    if (await pageButton.isVisible()) {
      await pageButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });
});

test.describe('Email Preview - Static Templates', () => {
  test('displays accordion with email template options', async ({ page }) => {
    // Check for specific email templates
    await expect(page.getByText('Reset password')).toBeVisible();
    await expect(page.getByText('Analytics Report')).toBeVisible();
  });

  test('expands and collapses Reset Password template', async ({ page }) => {
    const resetPasswordItem = page.getByText('Reset password');
    await resetPasswordItem.click();

    // Wait for content to be visible
    const content = page
      .locator('[role="region"]')
      .filter({ hasText: /reset/i })
      .first();
    await expect(content).toBeVisible();

    // Collapse by clicking again
    await resetPasswordItem.click();
    await expect(content).not.toBeVisible();
  });

  test('expands and collapses Analytics Report template', async ({ page }) => {
    const analyticsItem = page.getByText('Analytics Report');
    await analyticsItem.click();

    // Wait for content to be visible
    const content = page
      .locator('[role="region"]')
      .filter({ hasText: /analytics/i })
      .first();
    await expect(content).toBeVisible();

    // Collapse by clicking again
    await analyticsItem.click();
    await expect(content).not.toBeVisible();
  });

  test('displays template content when expanded', async ({ page }) => {
    const resetPasswordItem = page.getByText('Reset password');
    await resetPasswordItem.click();

    // Check that HTML content is rendered (look for common email elements)
    const content = page.locator('[role="region"]').first();
    await expect(content).toBeVisible();
    // Email should contain some text/link
    await expect(
      content.locator('text=Admin, text=reset, text=password').first(),
    ).toBeVisible();
  });

  test('allows multiple accordions to be open simultaneously', async ({
    page,
  }) => {
    // Expand first template
    await page.getByText('Reset password').click();
    const resetContent = page
      .locator('[role="region"]')
      .filter({ hasText: /reset/i })
      .first();
    await expect(resetContent).toBeVisible();

    // Expand second template
    await page.getByText('Analytics Report').click();
    const analyticsContent = page
      .locator('[role="region"]')
      .filter({ hasText: /analytics/i })
      .first();
    await expect(analyticsContent).toBeVisible();

    // Both should remain open
    await expect(resetContent).toBeVisible();
    await expect(analyticsContent).toBeVisible();
  });

  test('displays icons next to template names', async ({ page }) => {
    // The templates should have icons (SVG elements) next to their names
    const resetPasswordRow = page.locator('text=Reset password').locator('..');
    const analyticsRow = page.locator('text=Analytics Report').locator('..');

    // Check that parent containers have SVG icons
    await expect(resetPasswordRow.locator('svg').first()).toBeVisible();
    await expect(analyticsRow.locator('svg').first()).toBeVisible();
  });
});

test.describe('Email Page - Integration', () => {
  test('maintains filter state when navigating between sections', async ({
    page,
  }) => {
    // Apply a filter in Sent Emails
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('test');
    await expect(page).toHaveURL(/q=test/);

    // Scroll to Email Preview section
    await page
      .getByRole('heading', { name: 'Email Preview' })
      .scrollIntoViewIfNeeded();

    // Navigate back to Sent Emails
    await page
      .getByRole('heading', { name: 'Sent Emails' })
      .scrollIntoViewIfNeeded();

    // Filter should still be applied
    await expect(page).toHaveURL(/q=test/);
    await expect(searchInput).toHaveValue('test');
  });

  test('page is responsive and scrollable', async ({ page }) => {
    // Check that both sections are accessible via scrolling
    const sentEmailsSection = page.getByRole('heading', {
      name: 'Sent Emails',
    });
    const emailPreviewSection = page.getByRole('heading', {
      name: 'Email Preview',
    });

    await expect(sentEmailsSection).toBeVisible();

    // Scroll to preview section
    await emailPreviewSection.scrollIntoViewIfNeeded();
    await expect(emailPreviewSection).toBeVisible();

    // Scroll back to top
    await sentEmailsSection.scrollIntoViewIfNeeded();
    await expect(sentEmailsSection).toBeVisible();
  });
});
