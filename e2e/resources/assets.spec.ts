import { expect, test } from '@playwright/test';

const uniqueName = () => `E2E Asset ${Date.now()}`;

test.beforeEach(async ({ page }) => {
  await page.goto('/assets');
});

test.describe('Assets Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Assets/);
  });

  test('displays stats cards', async ({ page }) => {
    await expect(page.getByText('Total Items')).toBeVisible();
    await expect(page.getByText('Need Replacement')).toBeVisible();
  });

  test('clicking "Total Items" resets filters', async ({ page }) => {
    // Apply a condition filter first
    await page.getByTestId('condition-filter').click();
    await page.getByRole('listbox').waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'Poor' }).click();
    await expect(page).toHaveURL(/condition=POOR/);

    // Click "Total Items" to reset
    await page.getByText('Total Items').click();
    await expect(page).not.toHaveURL(/condition=/);
  });

  test('clicking "Need Replacement" filters by Poor condition', async ({
    page,
  }) => {
    await page.getByText('Need Replacement').click();
    await expect(page).toHaveURL(/condition=POOR/);
  });

  test('renders the table with headers', async ({ page }) => {
    for (const header of [
      'Name',
      'Category',
      'Quantity',
      'Condition',
      'Last Updated',
      'Note',
    ]) {
      await expect(
        page.getByRole('columnheader', { name: header }),
      ).toBeVisible();
    }
  });
});

test.describe('Filtering', () => {
  test('filters assets by name and updates query params', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('Ball');

    await expect(page).toHaveURL(/q=Ball/);

    // Clear search
    await searchInput.clear();
    await expect(page).not.toHaveURL(/q=/);
  });

  test('filters assets by Condition and updates query params', async ({
    page,
  }) => {
    // Open condition select
    await page.getByTestId('condition-filter').click();
    await page.getByRole('listbox').waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'Good' }).click();

    await expect(page).toHaveURL(/condition=GOOD/);

    // Clear filter
    await page.getByTestId('condition-filter').click();
    await page.getByRole('listbox').waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'All' }).click();
    await expect(page).not.toHaveURL(/condition=/);
  });

  test('filters assets by Category and updates query params', async ({
    page,
  }) => {
    // Open condition select
    await page.getByTestId('category-filter').click();
    await page.getByRole('listbox').waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'Equipment' }).click();

    await expect(page).toHaveURL(/category=EQUIPMENT/);

    // Clear filter
    await page.getByTestId('category-filter').click();
    await page.getByRole('listbox').waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'All', exact: true }).click();
    await expect(page).not.toHaveURL(/category=/);
  });
});

test.describe('Add Asset', () => {
  test('opens dialog and adds a new asset with required fields', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    // Dialog should be visible
    await expect(page.getByRole('heading', { name: 'Add Item' })).toBeVisible();

    // Fill required fields
    await page.getByLabel('Name').fill(uniqueName());

    // Verify defaults are pre-selected
    await expect(page.getByLabel('Equipment')).toBeChecked();
    await expect(page.getByLabel('Good')).toBeChecked();

    await page.getByRole('button', { name: 'Add' }).click();

    // Verify success toast
    await expect(page.getByText('Added asset successfully')).toBeVisible();
  });

  test('disables Submit button when form is empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Add' }),
    ).toBeDisabled();
  });

  test('adds a new asset with all fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    // Fill all fields
    await page.getByLabel('Name').fill(uniqueName());
    await page.getByLabel('Quantity').fill('5');
    await page
      .getByRole('radiogroup', { name: 'Category' })
      .getByText('Training')
      .click();
    await page
      .getByRole('radiogroup', { name: 'Condition' })
      .getByText('Fair')
      .click();
    await page.getByLabel('Note').fill('E2E test note');

    await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();

    // Success toast
    await expect(page.getByText('Added asset successfully')).toBeVisible();
  });
});

test.describe('Update Asset', () => {
  test('opens dialog and updates an existing asset', async ({ page }) => {
    // Click the first data row to open the update dialog
    const firstRow = page.getByRole('row').nth(1);
    await firstRow.click();

    await expect(
      page.getByRole('heading', { name: 'Update Item' }),
    ).toBeVisible();

    // Modify the note field
    const noteField = page.getByLabel('Note');
    await noteField.clear();
    await noteField.fill('Updated via E2E');

    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Update' })
      .click();

    // Verify success toast
    await expect(page.getByText('Updated asset successfully')).toBeVisible();
    // Verify update reflects in the table without refresh
    await expect(
      page.getByRole('cell', { name: 'Updated via E2E' }),
    ).toBeVisible();
  });
});

test.describe('Delete Asset', () => {
  test('selects and deletes assets via checkboxes', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('E2E');

    const count = await page
      .getByRole('checkbox', { name: 'Select row' })
      .count();

    if (count > 0) {
      const selectAll = page.getByRole('checkbox', { name: 'Select all rows' });
      await selectAll.click({ force: true });

      // Selection action bar should appear
      await expect(page.getByText(`${count} selected`)).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).click();

      // Success toast
      await expect(
        page.getByText(`Successfully deleted ${count} asset(s).`),
      ).toBeVisible();

      // Action bar should disappear after deletion
      await expect(page.getByText(`${count} selected`)).not.toBeVisible();
    }

    await page.getByText('No items found').waitFor({ state: 'visible' });
  });
});
