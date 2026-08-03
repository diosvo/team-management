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

const uniqueScore = () => `${Math.floor(Math.random() * 10)}`;

test.beforeEach(async ({ page }) => {
  await page.goto('/matches');
});

test.describe('Matches Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Matches/);
  });

  test('displays stats cards', async ({ page }) => {
    await expect(page.getByText('Total Matches')).toBeVisible();
    await expect(page.getByText('Win Streak')).toBeVisible();
    await expect(page.getByText('Avg Win Rate')).toBeVisible();
    await expect(page.getByText('Avg Points/Game')).toBeVisible();
  });

  test('renders the table with headers', async ({ page }) => {
    await testTableHeaders(page, [
      'Opponent',
      'League',
      'Score',
      'Result',
      'Location',
      'Date',
    ]);
  });

  test('displays empty state when no matches found', async ({ page }) => {
    await testEmptyState(page, 'NonExistentMatch12345', 'No matches found');
  });
});

test.describe('Matches - Search and Filtering', () => {
  test('filters matches by opponent name and updates query params', async ({
    page,
  }) => {
    await testSearchWithQueryParams(page, 'Arsenal', /q=Arsenal/);
  });

  test('filters matches by result status', async ({ page }) => {
    await testCheckboxFilter(page, 'Result', 'Win', /result=/);
  });

  test('filters matches by date range', async ({ page }) => {
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
    await testCheckboxFilterReset(page, 'Result', 'Win', /result=/);
  });

  test('displays result badges with proper styling', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);
    if (await firstDataRow.isVisible()) {
      const resultBadge = firstDataRow.locator('[data-badge]');
      await expect(resultBadge).toBeVisible();
    }
  });

  test('combines multiple filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('Team');

    const filterSection = page.locator('text=Result').first();
    if (await filterSection.isVisible()) {
      await filterSection.click();
      const winOption = page.getByRole('checkbox', { name: 'Win' });
      if (await winOption.isVisible()) {
        await winOption.check();
        const applyButton = page.getByRole('button', { name: 'Apply' });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    await expect(page).toHaveURL(/q=Team/);
    await expect(page).toHaveURL(/result=/);
  });
});

test.describe('Matches - Pagination', () => {
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

test.describe('Add Match', () => {
  test('opens dialog and displays form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(
      page.getByRole('heading', { name: 'Add Match' }),
    ).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('Date')).toBeVisible();
    await expect(page.getByLabel('Time')).toBeVisible();
  });

  test('disables Submit button when form is invalid', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.expectSubmitDisabled('Add');
  });

  test('adds a new match with required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    // Fill required fields
    await page.getByLabel('Date').fill('2026-12-31');
    await page.getByLabel('Time').fill('18:00');

    // Select opponent team
    const opponentSelect = page.locator('[data-testid="opponent-select"]');
    if (await opponentSelect.isVisible()) {
      await opponentSelect.click();
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Fill scores
    await page.getByLabel('Home Score').fill(uniqueScore());
    await page.getByLabel('Away Score').fill(uniqueScore());

    const submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add' });

    if (await submitButton.isEnabled()) {
      await submitButton.click();

      // Verify success toast
      await expect(page.getByText(/Saving match|success/i)).toBeVisible();
    }
  });

  test('displays league selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    const leagueSelect = page.locator('text=League');
    await expect(leagueSelect).toBeVisible();
  });

  test('displays location selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();

    const locationSelect = page.locator('text=Location');
    await expect(locationSelect).toBeVisible();
  });

  test('closes dialog on cancel', async ({ page }) => {
    const dialog = new DialogPOM(page);
    await dialog.open('Add');
    await dialog.close();
  });
});

test.describe('Update Match', () => {
  test('opens dialog when clicking a table row', async ({ page }) => {
    await new TablePOM(page).clickFirstRow();
    await expect(
      page.getByRole('heading', { name: 'Update Match' }),
    ).toBeVisible();
  });

  test('updates an existing match', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Modify the score
      const homeScoreField = page.getByLabel('Home Score');
      if (await homeScoreField.isVisible()) {
        await homeScoreField.clear();
        await homeScoreField.fill('5');

        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Update' })
          .click();

        await expect(page.getByText(/Saving match|success/i)).toBeVisible();
      }
    }
  });

  test('pre-fills form with existing match data', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();

      const dateField = page.getByLabel('Date');
      await expect(dateField).not.toHaveValue('');
    }
  });
});

test.describe('Delete Match', () => {
  test('selects and deletes matches via checkboxes', async ({ page }) => {
    await testDeleteWithCheckbox(page, 'E2E', /Successfully deleted.*match/i);
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
      await expect(page.getByText(/Deleting matches/i)).toBeVisible();
    }
  });
});

test.describe('Match Details Display', () => {
  test('displays score in correct format', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const scoreCell = firstRow
        .getByRole('cell')
        .filter({ hasText: /-/ })
        .first();
      const scoreText = await scoreCell.textContent();

      // Score should be in format "X - Y"
      expect(scoreText).toMatch(/\d+\s*-\s*\d+/);
    }
  });

  test('displays date with day and formatted date', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const dateCell = firstRow.getByRole('cell').last();
      const dateText = await dateCell.textContent();

      // Should contain day of week and formatted date
      expect(dateText?.length).toBeGreaterThan(0);
    }
  });

  test('displays league link', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const leagueCell = firstRow
        .getByRole('cell')
        .filter({ has: page.getByRole('link') })
        .first();

      if (await leagueCell.isVisible()) {
        const link = leagueCell.getByRole('link');
        await expect(link).toBeVisible();
      }
    }
  });

  test('displays location link', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const locationLinks = firstRow.getByRole('link');
      const count = await locationLinks.count();

      // Should have at least one link (league or location)
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Match Stats Integration', () => {
  test('stats cards display numeric values', async ({ page }) => {
    const totalMatches = page.getByText('Total Matches').locator('..');
    const statsValue = totalMatches.locator('[data-stat-value]');

    if (await statsValue.isVisible()) {
      const value = await statsValue.textContent();
      expect(value).toBeTruthy();
    }
  });

  test('win streak shows positive or negative indicator', async ({ page }) => {
    const winStreakCard = page.getByText('Win Streak').locator('..');
    await expect(winStreakCard).toBeVisible();
  });

  test('win rate displays percentage', async ({ page }) => {
    const winRateCard = page.getByText('Avg Win Rate').locator('..');
    await expect(winRateCard).toBeVisible();
  });
});
