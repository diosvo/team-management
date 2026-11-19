import { expect, type Page, test } from '@playwright/test';

import {
  applyDrawerFilters,
  expectToast,
  fillDate,
  pickOption,
  resetDrawerFilters,
  testTableHeaders,
} from '../setup/helpers';

const OPPONENT = 'CLB Bóng rổ Đà Lạt';
const dialog = (page: Page) => page.getByRole('dialog');

/** An ISO day `days` from today. */
function isoIn(days: number) {
  const day = new Date();
  day.setDate(day.getDate() + days);
  return day.toISOString().slice(0, 10);
}

test.describe('Matches page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/matches');
  });

  test('has the title, stats and table', async ({ page }) => {
    await expect(page).toHaveTitle(/Matches/);
    for (const stat of [
      'Total Matches',
      'Avg Win Rate',
      'Avg Points/Game',
      'Win Streak',
    ]) {
      await expect(page.getByText(stat, { exact: true })).toBeVisible();
    }
    await testTableHeaders(page, [
      'Opponent',
      'League',
      'Status',
      'Score',
      'Result',
      'Location',
      'Date',
    ]);
  });

  test('filters by game type, match type and status, then resets', async ({
    page,
  }) => {
    await applyDrawerFilters(page, ['Friendly', 'Completed']);
    await expect(page).toHaveURL(/match_type=friendly/);
    await expect(page).toHaveURL(/status=completed/);
    await expect(page.getByRole('cell', { name: 'Scheduled' })).toHaveCount(0);

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/match_type=|status=/);

    await applyDrawerFilters(page, ['3x3']);
    await expect(page).toHaveURL(/game_type=/);
  });

  test('searches by opponent', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Phú Nhuận');

    await expect(page).toHaveURL(/q=/);
    const rows = page.getByRole('row', { name: /^Select row/ });
    await expect(rows.first()).toBeVisible();
    for (const row of await rows.all()) {
      await expect(row).toContainText('Phú Nhuận');
    }
  });

  test('changes the time range', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Time:/ });
    await trigger.click();
    await page.getByRole('button', { name: 'Last year' }).click();

    await expect(trigger).toHaveAccessibleName('Time: Last year');
    await expect(page).toHaveURL(/from=\d{4}-01-01/);
  });

  test('opens the box score of a played match', async ({ page }) => {
    await page.getByRole('link', { name: 'Record box score' }).first().click();
    await expect(page).toHaveURL(/\/matches\/stats\?match=[0-9a-f-]{36}/);
  });
});

test.describe.serial('Match lifecycle', () => {
  const day = isoIn(10);
  const listUrl = `/matches?from=${day}&to=${day}`;
  const matchRow = (page: Page) =>
    page.getByRole('row', { name: new RegExp(`Select row .*${OPPONENT}`) });

  test('schedules a friendly match', async ({ page }) => {
    await page.goto('/matches');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog', { name: 'Add match' })).toBeVisible();

    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select opponents' }),
      OPPONENT,
    );
    await fillDate(page, 'Date', day);
    await dialog(page).getByLabel('Time').fill('19:00');
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select locations' }),
      'Nhà thi đấu Phú Thọ',
    );
    // An unplayed match has no score fields.
    await expect(
      dialog(page).getByRole('spinbutton', { name: 'Our Score' }),
    ).toHaveCount(0);
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expectToast(page, 'Added match successfully');
    await dialog(page).getByRole('button', { name: 'Close' }).click();

    await page.goto(listUrl);
    await expect(matchRow(page)).toContainText('Scheduled');
  });

  test('records the result once played', async ({ page }) => {
    await page.goto(listUrl);
    await matchRow(page).getByRole('cell', { name: 'Scheduled' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Update match' }),
    ).toBeVisible();

    await dialog(page).getByText('Completed', { exact: true }).click();
    await dialog(page)
      .getByRole('spinbutton', { name: 'Our Score' })
      .fill('82');
    await dialog(page)
      .getByRole('spinbutton', { name: 'Their Score' })
      .fill('71');
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expectToast(page, 'Updated match successfully');
    await expect(matchRow(page)).toContainText('82 - 71');
    await expect(matchRow(page)).toContainText('Win');
  });

  test('deletes the match', async ({ page }) => {
    await page.goto(listUrl);
    await matchRow(page)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 match.');
    await expect(matchRow(page)).toHaveCount(0);
  });
});
