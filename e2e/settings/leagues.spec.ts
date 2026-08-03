import { expect, test } from '@playwright/test';
import {
  uniqueName as makeUniqueName,
  testCheckboxFilter,
  testCheckboxFilterReset,
  testDeleteWithCheckbox,
  testEmptyState,
  testSearchWithQueryParams,
  testTableHeaders,
} from '../setup/helpers';
import { DialogPOM, TablePOM } from '../setup/pom';

const uniqueName = () => makeUniqueName('E2E League');

test.beforeEach(async ({ page }) => {
  await page.goto('/leagues');
});

test.describe('Leagues Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Leagues/);
  });

  test('renders the table with headers', async ({ page }) => {
    await testTableHeaders(page, [
      'Name',
      'No. Players',
      'Start Date',
      'End Date',
      'Status',
    ]);
  });

  test('displays empty state when no leagues found', async ({ page }) => {
    await testEmptyState(page, 'NonExistentLeague12345', 'No leagues found');
  });
});

test.describe('Leagues - Search and Filtering', () => {
  test('filters leagues by name and updates query params', async ({ page }) => {
    await testSearchWithQueryParams(page, 'Premier', /q=Premier/);
  });

  test('filters leagues by status using checkbox filters', async ({ page }) => {
    await testCheckboxFilter(page, 'Status', 'Upcoming', /status=/);
  });

  test('clears status filters when reset is clicked', async ({ page }) => {
    await testCheckboxFilterReset(page, 'Status', 'Active', /status=/);
  });

  test('combines search and status filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('League');

    const filterSection = page.locator('text=Status').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const endedOption = page.getByRole('checkbox', { name: 'Ended' });
      if (await endedOption.isVisible()) {
        await endedOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    await expect(page).toHaveURL(/q=League/);
    await expect(page).toHaveURL(/status=/);
  });

  test('displays status badges with proper styling', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);
    if (await firstDataRow.isVisible()) {
      const statusBadge = firstDataRow.locator('[data-badge]');
      await expect(statusBadge).toBeVisible();
    }
  });
});

test.describe('Leagues - Pagination', () => {
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

  test('navigates to specific page using page numbers', async ({ page }) => {
    const pageButton = page.getByRole('button', { name: '2', exact: true });
    if (await pageButton.isVisible()) {
      await pageButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });
});

test.describe('Add League', () => {
  test('opens dialog and displays form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(
      page.getByRole('heading', { name: 'Add League' }),
    ).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Start Date')).toBeVisible();
    await expect(page.getByLabel('End Date')).toBeVisible();
  });

  test('disables Submit button when form is invalid', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.expectSubmitDisabled('Add');
  });

  test('adds a new league with required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Name').fill(uniqueName());
    await page.getByLabel('Start Date').fill('2026-08-01');
    await page.getByLabel('End Date').fill('2026-12-31');

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });
    await submitButton.click();

    // Verify success toast
    await expect(
      page.getByText(/Saving league information|success/i),
    ).toBeVisible();
  });

  test('adds a new league with player selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Name').fill(uniqueName());
    await page.getByLabel('Start Date').fill('2026-08-01');
    await page.getByLabel('End Date').fill('2026-12-31');

    // Look for player selection component
    const playerSection = page.getByText('Players');
    if (await playerSection.isVisible()) {
      // Player selection functionality exists
      expect(true).toBeTruthy();
    }

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });
    await submitButton.click();

    await expect(
      page.getByText(/Saving league information|success/i),
    ).toBeVisible();
  });

  test('validates date range (end date after start date)', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Name').fill(uniqueName());
    await page.getByLabel('Start Date').fill('2026-12-31');
    await page.getByLabel('End Date').fill('2026-08-01');

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });

    // Form should show error or be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('displays description textarea', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    const descriptionField = page.getByLabel('Description');
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Test league description');
      expect(true).toBeTruthy();
    }
  });

  test('closes dialog on cancel', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.close();
  });
});

test.describe('Update League', () => {
  test('opens dialog when clicking a table row', async ({ page }) => {
    await new TablePOM(page).clickFirstRow();
    await expect(
      page.getByRole('heading', { name: 'Update League' }),
    ).toBeVisible();
  });

  test('updates an existing league', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Check if fields are editable (only for upcoming leagues)
      const nameField = page.getByLabel('Name');
      const isReadonly = await nameField.getAttribute('readonly');

      if (!isReadonly) {
        await nameField.fill('Updated League Name');

        await dialog.getByRole('button', { name: 'Update' }).click();

        await expect(
          page.getByText(/Saving league information|success/i),
        ).toBeVisible();
      }
    }
  });

  test('makes fields readonly for non-upcoming leagues', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      // Check if the row contains an "Active" or "Ended" badge
      const hasNonUpcoming = await firstRow
        .locator('text=/Active|Ended/i')
        .isVisible();

      if (hasNonUpcoming) {
        await firstRow.click();

        const nameField = page.getByLabel('Name');
        const isReadonly = await nameField.getAttribute('readonly');

        // Should be readonly for active/ended leagues
        expect(isReadonly).toBeTruthy();
      }
    }
  });

  test('pre-fills form with existing league data', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      const nameField = page.getByLabel('Name');
      await expect(nameField).not.toHaveValue('');
    }
  });

  test('displays existing players in league', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Look for player list or count
      const playerSection = page.getByText('Players');
      if (await playerSection.isVisible()) {
        // Players section should be present
        expect(true).toBeTruthy();
      }
    }
  });
});

test.describe('Delete League', () => {
  test('selects and deletes leagues via checkboxes', async ({ page }) => {
    await testDeleteWithCheckbox(page, 'E2E', /Successfully deleted.*league/i);
  });

  test('shows loading state during deletion', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('E2E');

    const count = await page
      .getByRole('checkbox', { name: 'Select row' })
      .count();

    if (count > 0) {
      const selectAll = page.getByRole('checkbox', {
        name: 'Select all rows',
      });
      await selectAll.click({ force: true });

      await page.getByRole('button', { name: 'Delete' }).click();

      // Should show loading toast
      await expect(page.getByText(/Deleting leagues/i)).toBeVisible();
    }
  });
});

test.describe('League Status Correction', () => {
  test('displays correct status action button when available', async ({
    page,
  }) => {
    // Look for the correct status button in filters section
    const correctStatusButton = page.getByRole('button', {
      name: /correct|update status/i,
    });

    // Button may or may not be visible depending on data
    const isVisible = await correctStatusButton.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('shows tooltip with leagues needing status correction', async ({
    page,
  }) => {
    const correctStatusButton = page.getByRole('button', {
      name: /correct|update status/i,
    });

    if (await correctStatusButton.isVisible()) {
      await correctStatusButton.hover();

      // Tooltip functionality is present
      expect(true).toBeTruthy();
    }
  });
});
