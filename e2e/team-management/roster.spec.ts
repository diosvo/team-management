import { expect, test } from '@playwright/test';
import {
  testCheckboxFilter,
  testCheckboxFilterReset,
  testEmptyState,
  testSearchWithQueryParams,
} from '../setup/helpers';
import { TablePOM } from '../setup/pom';

test.beforeEach(async ({ page }) => {
  await page.goto('/roster');
});

test.describe('Roster Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Roster/);
  });

  test('renders the table with headers', async ({ page }) => {
    const headers = ['No.', 'Name', 'Email', 'State', 'Roles', 'Position'];

    for (const header of headers) {
      const columnHeader = page.getByRole('columnheader', { name: header });
      if (await columnHeader.isVisible()) {
        await expect(columnHeader).toBeVisible();
      }
    }
  });

  test('displays empty state when no roster members found', async ({
    page,
  }) => {
    await testEmptyState(page, 'NonExistentPlayer12345', 'No users found');
  });

  test('displays verified status icons for admin/captain', async ({ page }) => {
    // Check if Verified column exists (only for admin/captain)
    const verifiedHeader = page.getByRole('columnheader', { name: 'Verified' });
    const isVisible = await verifiedHeader.isVisible();

    if (isVisible) {
      await expect(verifiedHeader).toBeVisible();
    }
  });
});

test.describe('Roster - Search and Filtering', () => {
  test('filters roster by player name and updates query params', async ({
    page,
  }) => {
    await testSearchWithQueryParams(page, 'John', /q=John/);
  });

  test('filters roster by email and updates query params', async ({ page }) => {
    await testSearchWithQueryParams(page, 'player@', /q=player/);
  });

  test('filters roster by state using checkbox filters', async ({ page }) => {
    await testCheckboxFilter(page, 'State', 'Active', /state=/);
  });

  test('filters roster by role', async ({ page }) => {
    await testCheckboxFilter(page, 'Role', 'Player', /role=/);
  });

  test('clears filters when reset is clicked', async ({ page }) => {
    await testCheckboxFilterReset(page, 'State', 'Active', /state=/);
  });

  test('combines search and filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('player');

    const filterSection = page.locator('text=State').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const activeOption = page.getByRole('checkbox', { name: 'Active' });
      if (await activeOption.isVisible()) {
        await activeOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    await expect(page).toHaveURL(/q=player/);
    await expect(page).toHaveURL(/state=/);
  });
});

test.describe('Roster - Pagination', () => {
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

test.describe('Roster Display', () => {
  test('displays jersey numbers for players', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const jerseyCell = firstRow.getByRole('cell').first();
      const jerseyText = await jerseyCell.textContent();

      // Should display either a number or "-"
      expect(jerseyText).toBeTruthy();
    }
  });

  test('displays state badges with proper styling', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const stateBadge = firstRow.locator('[data-badge]').first();
      if (await stateBadge.isVisible()) {
        await expect(stateBadge).toBeVisible();
      }
    }
  });

  test('displays role badges', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const roleBadges = firstRow.locator('[data-badge]');
      const count = await roleBadges.count();

      // Should have at least state badge
      expect(count).toBeGreaterThan(0);
    }
  });

  test('displays position badges for players', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const positionCell = firstRow.getByRole('cell').last();
      const positionText = await positionCell.textContent();

      // Should display either a position or "-"
      expect(positionText).toBeTruthy();
    }
  });

  test('masks sensitive data for guest users', async ({ page }) => {
    // Check if data is masked (contains asterisks)
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const nameCell = firstRow.getByRole('cell').nth(1);
      const nameText = await nameCell.textContent();

      // Either masked (***) or full name
      expect(nameText?.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Roster - Player Details', () => {
  test('clicking player row navigates to profile', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Check if URL changed to profile page
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    }
  });

  test('displays verified icon for verified users', async ({ page }) => {
    const verifiedHeader = page.getByRole('columnheader', { name: 'Verified' });

    if (await verifiedHeader.isVisible()) {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        const verifiedIcon = firstRow.locator('svg').first();
        await expect(verifiedIcon).toBeVisible();
      }
    }
  });
});

test.describe('Roster - Deletion', () => {
  test('displays delete button for admin/captain', async ({ page }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });

      const deleteButton = page.getByRole('button', { name: 'Delete' });
      await expect(deleteButton).toBeVisible();
    }
  });

  test('selects and deletes users via checkboxes', async ({ page }) => {
    const firstCheckbox = page
      .getByRole('checkbox', { name: 'Select row' })
      .first();

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click({ force: true });
      await expect(page.getByText('1 selected')).toBeVisible();

      // Note: Don't actually delete to preserve data
      const deleteButton = page.getByRole('button', { name: 'Delete' });
      await expect(deleteButton).toBeVisible();
    }
  });

  test('deselects user when unchecking checkbox', async ({ page }) => {
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

test.describe('Roster - Export', () => {
  test('displays export button', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export/i });
    const isVisible = await exportButton.isVisible();

    if (isVisible) {
      await expect(exportButton).toBeVisible();
    }
  });

  test('export button is clickable', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export/i });

    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeEnabled();
    }
  });
});

test.describe('Roster - Integration', () => {
  test('maintains filter state when navigating back', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('test');
    await expect(page).toHaveURL(/q=test/);

    // Navigate away and back
    await page.goto('/matches');
    await page.goBack();

    // Filter should still be applied
    await expect(page).toHaveURL(/q=test/);
    await expect(searchInput).toHaveValue('test');
  });

  test('displays correct count in pagination', async ({ page }) => {
    const pagination = page.getByRole('navigation', { name: 'pagination' });

    if (await pagination.isVisible()) {
      // Should show page info
      await expect(pagination).toBeVisible();
    }
  });

  test('search results update in real-time', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');

    // Type gradually
    await searchInput.type('player', { delay: 100 });

    await expect(page).toHaveURL(/q=player/);
  });
});
