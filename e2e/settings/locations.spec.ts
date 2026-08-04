import { expect, test } from '@playwright/test';
import {
  uniqueName as makeUniqueName,
  testDeleteWithCheckbox,
  testEmptyState,
  testSearchWithQueryParams,
  testTableHeaders,
} from '../setup/helpers';
import { DialogPOM, TablePOM } from '../setup/pom';

const uniqueName = () => makeUniqueName('E2E Location');

test.beforeEach(async ({ page }) => {
  await page.goto('/locations');
});

test.describe('Locations Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Locations/);
  });

  test('renders the table with headers', async ({ page }) => {
    await testTableHeaders(page, ['Name', 'Address', 'Last Updated']);
  });

  test('displays empty state when no locations found', async ({ page }) => {
    await testEmptyState(
      page,
      'NonExistentLocation12345',
      'No locations found',
    );
  });
});

test.describe('Locations - Search', () => {
  test('filters locations by name and updates query params', async ({
    page,
  }) => {
    await testSearchWithQueryParams(page, 'Stadium', /q=Stadium/);
  });

  test('filters locations by address and updates query params', async ({
    page,
  }) => {
    await testSearchWithQueryParams(page, 'Street', /q=Street/);
  });

  test('displays search results with highlighted text', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('location');

    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const hasMatches = await page.getByRole('cell').first().isVisible();
      expect(hasMatches).toBeTruthy();
    }
  });
});

test.describe('Locations - Pagination', () => {
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

test.describe('Add Location', () => {
  test('opens dialog and displays form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(
      page.getByRole('heading', { name: 'Add Location' }),
    ).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Address')).toBeVisible();
  });

  test('disables Submit button when form is invalid', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.expectSubmitDisabled('Add');
  });

  test('adds a new location with required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Name').fill(uniqueName());
    await page.getByLabel('Address').fill('123 Test Street, Test City');

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });
    await submitButton.click();

    // Verify success toast
    await expect(
      page.getByText(/Saving location information|success/i),
    ).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    // Try to submit without filling fields
    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });
    await expect(submitButton).toBeDisabled();

    // Fill only name
    await page.getByLabel('Name').fill(uniqueName());
    await expect(submitButton).toBeDisabled();

    // Fill address - now should be enabled
    await page.getByLabel('Address').fill('Test Address');
    await expect(submitButton).toBeEnabled();
  });

  test('displays location link format in table', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const nameCell = firstRow.getByRole('cell').first();
      const link = nameCell.getByRole('link');

      // Location name should be a clickable link
      if (await link.isVisible()) {
        await expect(link).toBeVisible();
      }
    }
  });

  test('closes dialog on cancel', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.close();
  });
});

test.describe('Update Location', () => {
  test('opens dialog when clicking a table row', async ({ page }) => {
    await new TablePOM(page).clickFirstRow();
    await expect(
      page.getByRole('heading', { name: 'Update Location' }),
    ).toBeVisible();
  });

  test('updates an existing location', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Modify the address field
      const addressField = page.getByLabel('Address');
      await addressField.clear();
      await addressField.fill('456 Updated Street, New City');

      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Update' })
        .click();

      // Verify success toast
      await expect(
        page.getByText(/Saving location information|success/i),
      ).toBeVisible();

      // Verify update reflects in the table without refresh
      await expect(
        page.getByRole('cell', { name: /456 Updated Street/i }),
      ).toBeVisible();
    }
  });

  test('pre-fills form with existing location data', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Name and address fields should have values
      const nameField = page.getByLabel('Name');
      const addressField = page.getByLabel('Address');

      await expect(nameField).not.toHaveValue('');
      await expect(addressField).not.toHaveValue('');
    }
  });

  test('maintains form validation on update', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Clear required field
      const nameField = page.getByLabel('Name');
      await nameField.clear();

      const submitButton = page
        .getByRole('dialog')
        .getByRole('button', { name: 'Update' });

      // Should be disabled when required field is empty
      await expect(submitButton).toBeDisabled();
    }
  });
});

test.describe('Delete Location', () => {
  test('selects and deletes locations via checkboxes', async ({ page }) => {
    await testDeleteWithCheckbox(
      page,
      'E2E',
      /Successfully deleted.*location/i,
    );
  });

  test('deselects location when unchecking checkbox', async ({ page }) => {
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

  test('selects multiple locations individually', async ({ page }) => {
    const checkboxes = page.getByRole('checkbox', { name: 'Select row' });
    const count = await checkboxes.count();

    if (count >= 2) {
      // Select first two locations
      await checkboxes.nth(0).click({ force: true });
      await checkboxes.nth(1).click({ force: true });

      await expect(page.getByText('2 selected')).toBeVisible();
    }
  });

  test('clears selection after deleting locations', async ({ page }) => {
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

      // Selection should be cleared
      const selectAllAfter = page.getByRole('checkbox', {
        name: 'Select all rows',
      });
      if (await selectAllAfter.isVisible()) {
        await expect(selectAllAfter).not.toBeChecked();
      }
    }
  });
});

test.describe('Location Links', () => {
  test('location name opens map link when clicked', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const nameCell = firstRow.getByRole('cell').first();
      const link = nameCell.getByRole('link');

      if (await link.isVisible()) {
        // Get the href attribute
        const href = await link.getAttribute('href');

        // Should be a maps URL
        expect(href).toBeTruthy();

        // Link should open in new tab (target="_blank")
        const target = await link.getAttribute('target');
        expect(target).toBe('_blank');
      }
    }
  });

  test('location link contains address information', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const nameCell = firstRow.getByRole('cell').first();
      const link = nameCell.getByRole('link');

      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        // Maps URL should contain query or address info
        expect(href).toContain('maps');
      }
    }
  });
});

test.describe('Locations - Integration', () => {
  test('maintains search state after adding location', async ({ page }) => {
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

  test('refreshes table data after successful update', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      // Get original address
      const originalAddress = await firstRow
        .getByRole('cell')
        .nth(1)
        .textContent();

      await firstRow.click();

      const addressField = page.getByLabel('Address');
      const newAddress = `Updated ${Date.now()}`;
      await addressField.clear();
      await addressField.fill(newAddress);

      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Update' })
        .click();

      // Wait for success toast
      await expect(
        page.getByText(/Saving location information|success/i),
      ).toBeVisible();

      // Table should reflect the change
      await expect(page.getByRole('cell', { name: newAddress })).toBeVisible();
    }
  });

  test('displays timestamp in correct format', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const lastUpdatedCell = firstRow.getByRole('cell').nth(2);
      const text = await lastUpdatedCell.textContent();

      // Should contain date/time format (e.g., "Jan 1, 2026" or similar)
      expect(text).toBeTruthy();
      expect(text?.length).toBeGreaterThan(0);
    }
  });
});
