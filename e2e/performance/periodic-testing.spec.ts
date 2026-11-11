import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { expectToast, pickOption } from '../setup/helpers';

const TEST = 'Beep test';

/** The matrix cell of `player` in the `test` column. */
async function scoreCell(page: Page, player: string, test: string) {
  const headers = await page.getByRole('columnheader').allTextContents();
  const column = headers.findIndex((text) => text.trim() === test);
  expect(column).toBeGreaterThan(-1);
  return page
    .getByRole('row', { name: new RegExp(player) })
    .getByRole('cell')
    .nth(column);
}

/**
 * The matrix opens on today's date; pick a seeded test date (`index` in the
 * date list, newest first) so there are scores to show.
 */
async function openTestDate(page: Page, index = 0) {
  await page.getByRole('combobox', { name: 'Date' }).click();
  await page
    .locator('[role="listbox"][data-state="open"]')
    .getByRole('option', { includeHidden: true })
    .nth(index)
    .click();
  await expect(page).toHaveURL(/date=\d{4}-\d{2}-\d{2}/);
}

/** Type a score into an in-place editable cell and commit it with Enter. */
async function editScore(
  cell: Awaited<ReturnType<typeof scoreCell>>,
  value: string,
) {
  await cell.click();
  const input = cell.getByRole('spinbutton');
  await input.fill(value);
  await input.press('Enter');
}

// One file for the matrix and Add Result: adding results creates a new test
// date, which would change what the matrix opens on mid-run.
test.describe('Periodic testing matrix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/periodic-testing');
  });

  test('opens on today, empty until a test date is picked', async ({
    page,
  }) => {
    await expect(page.getByText('No test result found')).toBeVisible();
    await openTestDate(page);
    await expect(page.getByText('No test result found')).toHaveCount(0);
  });

  test('has the title, stats and one column per test', async ({ page }) => {
    await openTestDate(page);
    await expect(page).toHaveTitle(/Periodic Testing/);
    await expect(page.getByText('Players Joined')).toBeVisible();
    await expect(page.getByText('Completed Tests')).toBeVisible();
    for (const header of [
      'Player',
      '1-minute push-ups',
      '20m sprint',
      'Beep test',
      'Free throw percentage',
      'Standing long jump',
    ]) {
      await expect(
        page.getByRole('columnheader', { name: header, exact: true }),
      ).toBeVisible();
    }
  });

  test('switches between test dates', async ({ page }) => {
    await openTestDate(page, 0);
    const latest = new URL(page.url()).searchParams.get('date');

    // Seeded tests ran on three dates; pick an older one.
    await openTestDate(page, 2);
    expect(new URL(page.url()).searchParams.get('date')).not.toBe(latest);
  });

  test('opens a player’s progression from their name', async ({ page }) => {
    await openTestDate(page);
    await page.getByRole('link', { name: SEED.captain.name }).click();
    await expect(page).toHaveURL(
      `/periodic-testing/progression/${SEED.captain.id}`,
    );
  });

  test('links to Add Result', async ({ page }) => {
    await page.getByRole('link', { name: 'Add Result' }).click();
    await expect(page).toHaveURL('/periodic-testing/add-result');
  });
});

test.describe.serial('Edit scores in place', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/periodic-testing');
    await openTestDate(page);
  });

  test('updates a score', async ({ page }) => {
    const cell = await scoreCell(page, SEED.player.name, TEST);
    await editScore(cell, '11.5');

    await expectToast(page, 'Test result updated successfully');
    await page.reload();
    await expect(await scoreCell(page, SEED.player.name, TEST)).toHaveText(
      '11.5',
    );
  });

  test('clears a score, deleting the result', async ({ page }) => {
    const cell = await scoreCell(page, SEED.player.name, TEST);
    await editScore(cell, '');

    await expectToast(page, 'Test result deleted successfully');
    await page.reload();
    await expect(await scoreCell(page, SEED.player.name, TEST)).toHaveText('-');
  });
});

test.describe.serial('Add Result', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/periodic-testing/add-result');
  });

  test('needs players, test types and results before saving', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Add Test Result/);
    await expect(page.getByText('No configuration set.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('records results for the picked players and tests', async ({ page }) => {
    await pickOption(
      page,
      page.getByRole('combobox', { name: 'Select players' }),
      new RegExp(SEED.player.name),
    );
    await page.keyboard.press('Escape');
    await pickOption(
      page,
      page.getByRole('combobox', { name: 'Select types' }),
      TEST,
    );
    await page.keyboard.press('Escape');

    await page
      .getByRole('spinbutton', { name: `${TEST} for ${SEED.player.name}` })
      .fill('9.4');
    await page.getByRole('button', { name: 'Save' }).click();

    await expectToast(page, 'Results saved');
    // Lands on the matrix for the day just recorded.
    await expect(page).toHaveURL(/\/periodic-testing\?date=\d{4}-\d{2}-\d{2}/);
    await expect(await scoreCell(page, SEED.player.name, TEST)).toHaveText(
      '9.4',
    );
  });
});
