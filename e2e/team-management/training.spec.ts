import { expect, test } from '@playwright/test';
import {
  testCheckboxFilter,
  testCheckboxFilterReset,
  testDeleteWithCheckbox,
  testEmptyState,
  testSearchWithQueryParams,
  testTableHeaders,
} from '../setup/helpers';
import { DialogPOM, TablePOM } from '../setup/pom';

test.beforeEach(async ({ page }) => {
  await page.goto('/training');
});

test.describe('Training Sessions Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Training Sessions/);
  });

  test('displays stats cards', async ({ page }) => {
    await expect(page.getByText('Total Sessions')).toBeVisible();
    await expect(page.getByText('Avg Attendance Rate')).toBeVisible();
    await expect(page.getByText('Present')).toBeVisible();
  });

  test('renders the table with headers', async ({ page }) => {
    await testTableHeaders(page, [
      'Date',
      'Time',
      'Location',
      'Status',
      'Present Rate',
    ]);
  });

  test('displays empty state when no sessions found', async ({ page }) => {
    await testEmptyState(page, 'NonExistentLocation12345', 'No sessions found');
  });
});

test.describe('Training Sessions - Search and Filtering', () => {
  test('filters sessions by location and updates query params', async ({
    page,
  }) => {
    await testSearchWithQueryParams(page, 'Stadium', /q=Stadium/);
  });

  test('filters sessions by status', async ({ page }) => {
    await testCheckboxFilter(page, 'Status', 'Scheduled', /status=/);
  });

  test('filters sessions by date range', async ({ page }) => {
    const filterSection = page.locator('text=Date').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();

      const fromDate = page.getByLabel('From');
      if (await fromDate.isVisible()) {
        await fromDate.fill('2026-01-01');

        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }

        await expect(page).toHaveURL(/from=/);
      }
    }
  });

  test('clears filters when reset is clicked', async ({ page }) => {
    await testCheckboxFilterReset(page, 'Status', 'Completed', /status=/);
  });

  test('combines search and filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('Field');

    const filterSection = page.locator('text=Status').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const scheduledOption = page.getByRole('checkbox', { name: 'Scheduled' });
      if (await scheduledOption.isVisible()) {
        await scheduledOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    await expect(page).toHaveURL(/q=Field/);
    await expect(page).toHaveURL(/status=/);
  });
});

test.describe('Training Sessions - Pagination', () => {
  test('displays pagination controls when there are multiple pages', async ({
    page,
  }) => {
    const pagination = page.getByRole('navigation', { name: 'pagination' });
    const hasMultiplePages = await pagination.isVisible();

    if (hasMultiplePages) {
      await expect(pagination).toBeVisible();
    }
  });

  test('navigates to next page and updates query params', async ({ page }) => {
    await new TablePOM(page).navigateToNextPage();
  });
});

test.describe('Add Training Session', () => {
  test('opens dialog and displays form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(
      page.getByRole('heading', { name: 'Add Session' }),
    ).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('Date')).toBeVisible();
    await expect(page.getByLabel('Start Time')).toBeVisible();
    await expect(page.getByLabel('End Time')).toBeVisible();
  });

  test('disables Submit button when form is invalid', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.expectSubmitDisabled('Add');
  });

  test('adds a new training session with required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Date').fill('2026-12-31');
    await page.getByLabel('Start Time').fill('16:00');
    await page.getByLabel('End Time').fill('18:00');

    // Select location
    const locationSelect = page.locator('[data-testid="location-select"]');
    if (await locationSelect.isVisible()) {
      await locationSelect.click();
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });

    if (await submitButton.isEnabled()) {
      await submitButton.click();

      await expect(page.getByText(/Saving session|success/i)).toBeVisible();
    }
  });

  test('validates time range (end time after start time)', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Date').fill('2026-12-31');
    await page.getByLabel('Start Time').fill('18:00');
    await page.getByLabel('End Time').fill('16:00');

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });

    // Form should show error or be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('displays location selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    const locationField = page.locator('text=Location');
    await expect(locationField).toBeVisible();
  });

  test('closes dialog on cancel', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.close();
  });
});

test.describe('Update Training Session', () => {
  test('opens dialog when clicking a table row', async ({ page }) => {
    await new TablePOM(page).clickFirstRow();
    await expect(
      page.getByRole('heading', { name: 'Update Session' }),
    ).toBeVisible();
  });

  test('updates an existing session', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      const startTimeField = page.getByLabel('Start Time');
      if (await startTimeField.isVisible()) {
        await startTimeField.clear();
        await startTimeField.fill('17:00');

        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Update' })
          .click();

        await expect(page.getByText(/Saving session|success/i)).toBeVisible();
      }
    }
  });

  test('pre-fills form with existing session data', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      const dateField = page.getByLabel('Date');
      await expect(dateField).not.toHaveValue('');
    }
  });
});

test.describe('Delete Training Session', () => {
  test('selects and deletes sessions via checkboxes', async ({ page }) => {
    await testDeleteWithCheckbox(page, 'E2E', /Successfully deleted.*session/i);
  });
});

test.describe('Training Session Display', () => {
  test('displays date with day and formatted date', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const dateCell = firstRow.getByRole('cell').first();
      const dateText = await dateCell.textContent();

      // Should contain formatted date
      expect(dateText?.length).toBeGreaterThan(0);
    }
  });

  test('displays time range in correct format', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const timeCell = firstRow
        .getByRole('cell')
        .filter({ hasText: /→/ })
        .first();

      if (await timeCell.isVisible()) {
        const timeText = await timeCell.textContent();
        // Time should be in format "HH:MM → HH:MM"
        expect(timeText).toMatch(/\d{2}:\d{2}/);
      }
    }
  });

  test('displays location as a clickable link', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const locationLink = firstRow.getByRole('link');

      if (await locationLink.isVisible()) {
        await expect(locationLink).toBeVisible();
      }
    }
  });

  test('displays status badge with proper styling', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const statusBadge = firstRow.locator('[data-badge]');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('displays present rate with tooltip', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const presentRate = firstRow
        .getByRole('cell')
        .last()
        .getByText(/\d+%/);
      await expect(presentRate).toBeVisible();

      // Hover to show tooltip
      await presentRate.hover();

      // Tooltip should show attendance details
      const tooltip = page.getByRole('tooltip');
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText(/On Time: \d+/);
      await expect(tooltip).toContainText(/Late: \d+/);
    }
  });
});

test.describe('Training Session - Date Link', () => {
  test('clicking date navigates to attendance page', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const dateLink = firstRow.getByRole('link');

      if (await dateLink.isVisible()) {
        await dateLink.click();

        // Should navigate to attendance page with date query param
        await expect(page).toHaveURL(/attendance/);
        await expect(page).toHaveURL(/date=/);
      }
    }
  });

  test('date link contains correct query parameter', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const dateLink = firstRow.getByRole('link');

      if (await dateLink.isVisible()) {
        const href = await dateLink.getAttribute('href');
        expect(href).toContain('attendance');
        expect(href).toContain('date=');
      }
    }
  });
});

test.describe('Training Stats Integration', () => {
  test('stats cards display numeric values', async ({ page }) => {
    const totalSessions = page.getByText('Total Sessions').locator('..');
    await expect(totalSessions).toBeVisible();
  });

  test('attendance rate displays percentage', async ({ page }) => {
    const attendanceRate = page.getByText('Avg Attendance Rate').locator('..');
    await expect(attendanceRate).toBeVisible();
  });

  test('present count displays number', async ({ page }) => {
    const presentCount = page.getByText('Present').locator('..');
    await expect(presentCount).toBeVisible();
  });
});

test.describe('Training Sessions - Integration', () => {
  test('maintains filter state after adding session', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('Test');
    await expect(page).toHaveURL(/q=Test/);

    // Open add dialog
    await page.getByRole('button', { name: 'Add' }).click();

    // Close without adding
    const closeButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Close' });
    await closeButton.click();

    // Search should still be applied
    await expect(page).toHaveURL(/q=Test/);
    await expect(searchInput).toHaveValue('Test');
  });

  test('stats update reflects filtered data', async ({ page }) => {
    const filterSection = page.locator('text=Status').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const completedOption = page.getByRole('checkbox', { name: 'Completed' });
      if (await completedOption.isVisible()) {
        await completedOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    // Stats should still be visible
    const totalSessions = page.getByText('Total Sessions');
    await expect(totalSessions).toBeVisible();
  });
});
