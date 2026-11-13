import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import {
  applyDrawerFilters,
  expectToast,
  fillDate,
  pickOption,
  resetDrawerFilters,
  testTableHeaders,
  uniqueName,
} from '../setup/helpers';

const dialog = (page: Page) => page.getByRole('dialog');
const leagueRow = (page: Page, name: string | RegExp) =>
  page.getByRole('row', {
    name: typeof name === 'string' ? new RegExp(name) : name,
  });

/** An ISO day `days` from today. */
function isoIn(days: number) {
  const day = new Date();
  day.setDate(day.getDate() + days);
  return day.toISOString().slice(0, 10);
}

test.describe('Leagues page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leagues');
  });

  test('has the title and lists the seeded leagues', async ({ page }) => {
    await expect(page).toHaveTitle(/Leagues/);
    await testTableHeaders(page, [
      'Name',
      'No. Players',
      'Start Date',
      'End Date',
      'Status',
    ]);
    await expect(leagueRow(page, /^.*Autumn Cup/)).toContainText('Ongoing');
    await expect(leagueRow(page, /Spring Invitational/)).toContainText(
      'Upcoming',
    );
    await expect(leagueRow(page, /Saigon Open/)).toContainText('Ended');
  });

  test('offers recording an achievement only for ended leagues', async ({
    page,
  }) => {
    await expect(
      leagueRow(page, /Saigon Open/).getByRole('link', {
        name: 'Record achievement',
      }),
    ).toBeVisible();
    await expect(
      leagueRow(page, /Spring Invitational/).getByRole('link', {
        name: 'Record achievement',
      }),
    ).toHaveCount(0);
  });

  test('filters by status and resets', async ({ page }) => {
    await applyDrawerFilters(page, ['Upcoming']);
    await expect(page).toHaveURL(/status=upcoming/);
    await expect(leagueRow(page, /Spring Invitational/)).toBeVisible();
    await expect(leagueRow(page, /Saigon Open/)).toHaveCount(0);

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/status=/);
  });

  test('searches leagues by name', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Summer');

    await expect(page).toHaveURL(/q=Summer/);
    await expect(leagueRow(page, /Saigon Summer League/)).toBeVisible();
    await expect(leagueRow(page, /Autumn Cup/)).toHaveCount(0);
  });

  test('opens a league that has started read-only', async ({ page }) => {
    await leagueRow(page, /Autumn Cup/)
      .getByRole('cell', { name: /Autumn Cup/ })
      .click();

    await expect(dialog(page).getByText('Readonly')).toBeVisible();
    await expect(dialog(page).getByLabel('Name')).toBeDisabled();
    await expect(
      dialog(page).getByRole('button', { name: 'Update' }),
    ).toHaveCount(0);
  });
});

test.describe.serial('League lifecycle', () => {
  const name = uniqueName('E2E Cup');

  test.beforeEach(async ({ page }) => {
    await page.goto(`/leagues?q=${encodeURIComponent(name)}`);
  });

  test('adds an upcoming league with a roster', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Add League' }),
    ).toBeVisible();

    await dialog(page).getByLabel('Name').fill(name);
    await fillDate(page, 'Start Date', isoIn(90));
    await fillDate(page, 'End Date', isoIn(120));
    await dialog(page).getByPlaceholder('Comment...').fill('Created by e2e');
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select players' }),
      new RegExp(SEED.captain.name),
    );
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select players' }),
      new RegExp(SEED.player.name),
    );
    // The multi-select list stays open; Escape closes just the list.
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: 'Add League' }),
    ).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expectToast(page, 'League information saved successfully.');
    // Adding keeps the dialog open, emptied for the next league.
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    await expect(leagueRow(page, name)).toContainText('Upcoming');
    await expect(leagueRow(page, name)).toContainText('2');
  });

  test('rejects an end date before the start date', async ({ page }) => {
    await leagueRow(page, name).getByRole('cell', { name }).click();

    await fillDate(page, 'End Date', isoIn(60));
    // An end before the start (day 90) cannot be saved.
    await expect(
      dialog(page).getByRole('button', { name: 'Update' }),
    ).toBeDisabled();
  });

  test('updates the league and its roster', async ({ page }) => {
    await leagueRow(page, name).getByRole('cell', { name }).click();
    await expect(
      page.getByRole('dialog', { name: /Update League/ }),
    ).toBeVisible();
    await expect(dialog(page).getByLabel('Name')).toHaveValue(name);

    await dialog(page).getByPlaceholder('Comment...').fill('Edited by e2e');
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expectToast(page, 'League information saved successfully.');
    await page.reload();
    await leagueRow(page, name).getByRole('cell', { name }).click();
    await expect(dialog(page).getByPlaceholder('Comment...')).toHaveValue(
      'Edited by e2e',
    );
  });

  test('deletes the league', async ({ page }) => {
    await leagueRow(page, name)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 league.');
    await expect(leagueRow(page, name)).toHaveCount(0);
  });
});
