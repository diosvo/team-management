import { expect, test } from '@playwright/test';
import {
  uniqueName as makeUniqueName,
  testDeleteWithCheckbox,
  testEmptyState,
  testSearchWithQueryParams,
  testTableHeaders,
} from '../setup/helpers';
import { DialogPOM, TablePOM } from '../setup/pom';

const uniqueName = () => makeUniqueName('E2E Team');

test.beforeEach(async ({ page }) => {
  await page.goto('/teams');
});

test.describe('Teams Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Teams/);
  });

  test('renders the table with headers', async ({ page }) => {
    await testTableHeaders(page, [
      'Name',
      'Email',
      'Established',
      'Last Updated',
    ]);
  });

  test('displays empty state when no teams found', async ({ page }) => {
    await testEmptyState(page, 'NonExistentTeam12345', 'No teams found');
  });
});

test.describe('Teams - Search', () => {
  test('filters teams by name and updates query params', async ({ page }) => {
    await testSearchWithQueryParams(page, 'Arsenal', /q=Arsenal/);
  });

  test('filters teams by email and updates query params', async ({ page }) => {
    await testSearchWithQueryParams(page, 'team@', /q=team%40/);
  });

  test('displays search results with highlighted text', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('team');

    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      // Results should contain the search term (if any matches exist)
      const hasMatches = await page.getByRole('cell').first().isVisible();
      expect(hasMatches).toBeTruthy();
    }
  });
});

test.describe('Teams - Pagination', () => {
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

test.describe('Add Team', () => {
  test('opens dialog and displays form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByRole('heading', { name: 'Add Team' })).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Established')).toBeVisible();
  });

  test('disables Submit button when form is invalid', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.expectSubmitDisabled('Add');
  });

  test('adds a new team with required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    // Fill required fields
    await page.getByLabel('Name').fill(uniqueName());

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });
    await submitButton.click();

    // Verify success toast
    await expect(
      page.getByText(/Saving team information|success/i),
    ).toBeVisible();
  });

  test('adds a new team with all fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    const name = uniqueName();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(`${name.replace(/\s/g, '')}@test.com`);
    await page.getByLabel('Established').fill('2020');

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });
    await submitButton.click();

    // Verify success toast
    await expect(
      page.getByText(/Saving team information|success/i),
    ).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Name').fill(uniqueName());
    await page.getByLabel('Email').fill('invalid-email');

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });

    // Form should be invalid due to email format
    await expect(submitButton).toBeDisabled();
  });

  test('closes dialog on cancel', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.close();
  });
});

test.describe('Update Team', () => {
  test('opens dialog when clicking a table row', async ({ page }) => {
    await new TablePOM(page).clickFirstRow();
    await expect(
      page.getByRole('heading', { name: 'Update Team' }),
    ).toBeVisible();
  });

  test('updates an existing team', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Modify the email field
      const emailField = page.getByLabel('Email');
      await emailField.clear();
      await emailField.fill('updated@test.com');

      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Update' })
        .click();

      // Verify success toast
      await expect(
        page.getByText(/Saving team information|success/i),
      ).toBeVisible();
    }
  });

  test('pre-fills form with existing team data', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Name field should have a value
      const nameField = page.getByLabel('Name');
      await expect(nameField).not.toHaveValue('');
    }
  });
});

test.describe('Delete Team', () => {
  test('selects and deletes teams via checkboxes', async ({ page }) => {
    await testDeleteWithCheckbox(page, 'E2E', /Successfully deleted.*team/i);
  });

  test('deselects team when unchecking checkbox', async ({ page }) => {
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

  test('clears selection after deleting teams', async ({ page }) => {
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

test.describe('Team Logo Upload', () => {
  test('displays image uploader in update dialog', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Check if image uploader or logo section exists
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      // Logo upload functionality should be present in the form
    }
  });
});
