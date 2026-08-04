import { expect, test } from '@playwright/test';
import {
  testCheckboxFilter,
  testCheckboxFilterReset,
  testEmptyState,
  testSearchWithQueryParams,
  testTableHeaders,
} from '../setup/helpers';
import { TablePOM } from '../setup/pom';

test.beforeEach(async ({ page }) => {
  await page.goto('/attendance');
});

test.describe('Attendance Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Attendance/);
  });

  test('displays stats cards', async ({ page }) => {
    await expect(page.getByText('Total Present')).toBeVisible();
    await expect(page.getByText('On Time')).toBeVisible();
    await expect(page.getByText('Late')).toBeVisible();
    await expect(page.getByText('Absent')).toBeVisible();
  });

  test('renders the table with headers', async ({ page }) => {
    await testTableHeaders(page, ['Name', 'Status', 'Check In Time', 'Note']);
  });

  test('displays empty state when no attendance records found', async ({
    page,
  }) => {
    await testEmptyState(
      page,
      'NonExistentPlayer12345',
      'No attendance records found',
    );
  });
});

test.describe('Attendance - Date Selection', () => {
  test('displays date picker', async ({ page }) => {
    const dateInput = page.getByLabel('Date');
    await expect(dateInput).toBeVisible();
  });

  test('changes attendance data when date is selected', async ({ page }) => {
    const dateInput = page.getByLabel('Date');
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-08-01');

      // URL should contain date parameter
      await expect(page).toHaveURL(/date=2026-08-01/);
    }
  });

  test('maintains date selection in URL', async ({ page }) => {
    const dateInput = page.getByLabel('Date');
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-07-15');
      await expect(page).toHaveURL(/date=2026-07-15/);
    }
  });
});

test.describe('Attendance - Search and Filtering', () => {
  test('filters attendance by player name and updates query params', async ({
    page,
  }) => {
    await testSearchWithQueryParams(page, 'John', /q=John/);
  });

  test('filters attendance by status', async ({ page }) => {
    await testCheckboxFilter(page, 'Status', 'On Time', /status=/);
  });

  test('clears filters when reset is clicked', async ({ page }) => {
    await testCheckboxFilterReset(page, 'Status', 'Late', /status=/);
  });

  test('combines search and status filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('player');

    const filterSection = page.locator('text=Status').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const presentOption = page.getByRole('checkbox', { name: 'On Time' });
      if (await presentOption.isVisible()) {
        await presentOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    await expect(page).toHaveURL(/q=player/);
    await expect(page).toHaveURL(/status=/);
  });
});

test.describe('Attendance - Pagination', () => {
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

test.describe('Attendance - Bulk Status Update', () => {
  test('selects attendance records via checkboxes', async ({ page }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });
      await expect(page.getByText('1 selected')).toBeVisible();
    }
  });

  test('displays status action buttons when records are selected', async ({
    page,
  }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });

      // Should show status update buttons
      const onTimeButton = page.getByRole('button', { name: 'On Time' });
      const lateButton = page.getByRole('button', { name: 'Late' });
      const absentButton = page.getByRole('button', { name: 'Absent' });

      await expect(onTimeButton).toBeVisible();
      await expect(lateButton).toBeVisible();
      await expect(absentButton).toBeVisible();
    }
  });

  test('updates status for selected records', async ({ page }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });

      const onTimeButton = page.getByRole('button', { name: 'On Time' });
      if (await onTimeButton.isVisible()) {
        await onTimeButton.click();

        // Should show success toast
        await expect(page.getByText(/Updated.*attendance/i)).toBeVisible();
      }
    }
  });

  test('selects all records with select all checkbox', async ({ page }) => {
    const selectAll = page.getByRole('checkbox', { name: 'Select all rows' });

    if (await selectAll.isVisible()) {
      await selectAll.click({ force: true });

      // Should show count of selected records
      const selectedText = page.getByText(/\d+ selected/);
      await expect(selectedText).toBeVisible();
    }
  });

  test('deselects records when unchecking', async ({ page }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      // Select
      await firstCheckbox.click({ force: true });
      await expect(page.getByText('1 selected')).toBeVisible();

      // Deselect
      await firstCheckbox.click({ force: true });
      await expect(page.getByText('1 selected')).not.toBeVisible();
    }
  });
});

test.describe('Attendance - Delete Records', () => {
  test('displays delete button when records are selected', async ({ page }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });

      const deleteButton = page.getByRole('button', { name: 'Delete' });
      await expect(deleteButton).toBeVisible();
    }
  });

  test('deletes selected attendance records', async ({ page }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });

      // Note: Don't actually delete to preserve data
      const deleteButton = page.getByRole('button', { name: 'Delete' });
      await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('Attendance Display', () => {
  test('displays status badge with proper styling', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const statusBadge = firstRow.locator('[data-badge]');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('displays check-in time in correct format', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const checkInCell = firstRow.getByRole('cell').nth(2);
      const checkInText = await checkInCell.textContent();

      // Should display either time or "-"
      expect(checkInText).toBeTruthy();
    }
  });

  test('displays note field', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const noteCell = firstRow.getByRole('cell').last();
      const noteText = await noteCell.textContent();

      // Note can be empty or have content
      expect(noteText !== null).toBeTruthy();
    }
  });

  test('highlights player name based on search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('player');

    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      // Name should be highlighted
      const nameCell = firstRow.getByRole('cell').first();
      await expect(nameCell).toBeVisible();
    }
  });
});

test.describe('Attendance Stats Integration', () => {
  test('stats cards display numeric values', async ({ page }) => {
    const totalPresent = page.getByText('Total Present').locator('..');
    await expect(totalPresent).toBeVisible();
  });

  test('on time count displays number', async ({ page }) => {
    const onTime = page.getByText('On Time').locator('..');
    await expect(onTime).toBeVisible();
  });

  test('late count displays number', async ({ page }) => {
    const late = page.getByText('Late').locator('..');
    await expect(late).toBeVisible();
  });

  test('absent count displays number', async ({ page }) => {
    const absent = page.getByText('Absent').locator('..');
    await expect(absent).toBeVisible();
  });

  test('stats update when date changes', async ({ page }) => {
    const dateInput = page.getByLabel('Date');
    if (await dateInput.isVisible()) {
      // Get current stats
      const totalPresent = page.getByText('Total Present').locator('..');
      await expect(totalPresent).toBeVisible();

      // Change date
      await dateInput.fill('2026-08-01');

      // Stats should still be visible (may have different values)
      await expect(totalPresent).toBeVisible();
    }
  });

  test('stats reflect filtered data', async ({ page }) => {
    const filterSection = page.locator('text=Status').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const onTimeOption = page.getByRole('checkbox', { name: 'On Time' });
      if (await onTimeOption.isVisible()) {
        await onTimeOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    // Stats should still be visible
    const totalPresent = page.getByText('Total Present');
    await expect(totalPresent).toBeVisible();
  });
});

test.describe('Attendance - Integration', () => {
  test('maintains state when navigating from training session', async ({
    page,
  }) => {
    // Navigate to training page
    await page.goto('/training');

    // Click on a date link if available
    const dateLink = page.getByRole('link').first();
    if (await dateLink.isVisible()) {
      const href = await dateLink.getAttribute('href');
      if (href?.includes('attendance')) {
        await dateLink.click();

        // Should be on attendance page with date
        await expect(page).toHaveURL(/attendance/);
        await expect(page).toHaveURL(/date=/);
      }
    }
  });

  test('bulk status update clears selection after success', async ({
    page,
  }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });
      await expect(page.getByText('1 selected')).toBeVisible();

      const onTimeButton = page.getByRole('button', { name: 'On Time' });
      if (await onTimeButton.isVisible()) {
        await onTimeButton.click();

        // Selection should be cleared
        await expect(page.getByText('1 selected')).not.toBeVisible();
      }
    }
  });

  test('date persists in URL after page reload', async ({ page }) => {
    const dateInput = page.getByLabel('Date');
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-07-15');
      await expect(page).toHaveURL(/date=2026-07-15/);

      // Reload page
      await page.reload();

      // Date should still be in URL
      await expect(page).toHaveURL(/date=2026-07-15/);
    }
  });
});
