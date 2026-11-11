import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { expectToast, pickOption } from '../setup/helpers';

const cell = (page: Page, stat: string, name: string) =>
  page.getByRole('spinbutton', { name: `${stat} for ${name}` });

test.describe('Box Score', () => {
  test('opens from the matches page', async ({ page }) => {
    await page.goto('/matches');
    await page.getByRole('link', { name: 'Box Score', exact: true }).click();

    await expect(page).toHaveURL('/matches/stats');
    await expect(page).toHaveTitle(/Box Score/);
    await expect(page.getByText('No players on the sheet')).toBeVisible();
    // Nothing to save, and no players to pick, until a match is chosen.
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('shows the recorded sheet of a match that has one', async ({ page }) => {
    await page.goto('/matches/stats');
    // Seeded box scores cover the ten latest 5x5 games, 10 players each.
    await page.getByRole('combobox', { name: 'Match' }).click();
    await page
      .locator('[role="listbox"][data-state="open"]')
      .getByRole('option', { name: /10 recorded/, includeHidden: true })
      .first()
      .click();

    await expect(page).toHaveURL(/match=[0-9a-f-]{36}/);
    await expect(
      page.getByRole('spinbutton', { name: /^Points for / }),
    ).toHaveCount(10);
  });
});

test.describe.serial('Record a box score', () => {
  let matchUrl = '';

  test('records stats for a player on an unrecorded match', async ({
    page,
  }) => {
    await page.goto('/matches/stats');
    await page.getByRole('combobox', { name: 'Match' }).click();
    await page
      .locator('[role="listbox"][data-state="open"]')
      .getByRole('option', { name: /Not recorded/, includeHidden: true })
      .first()
      .click();
    await expect(page).toHaveURL(/match=/);
    matchUrl = new URL(page.url()).pathname + new URL(page.url()).search;

    await pickOption(
      page,
      page.getByRole('combobox', { name: 'Select players' }),
      new RegExp(SEED.player.name),
    );
    await page.keyboard.press('Escape');

    await cell(page, 'Points', SEED.player.name).fill('21');
    await cell(page, 'Rebounds', SEED.player.name).fill('7');
    await cell(page, 'Assists', SEED.player.name).fill('4');

    await page.getByRole('button', { name: 'Save' }).click();
    await expectToast(page, 'Saved box score for 1 player');
  });

  test('keeps the saved stats on reload', async ({ page }) => {
    await page.goto(matchUrl);

    await expect(cell(page, 'Points', SEED.player.name)).toHaveValue('21');
    await expect(cell(page, 'Rebounds', SEED.player.name)).toHaveValue('7');
    await expect(cell(page, 'Assists', SEED.player.name)).toHaveValue('4');
  });

  test('takes a player off the sheet', async ({ page }) => {
    await page.goto(matchUrl);

    await page
      .getByRole('button', { name: `Remove "${SEED.player.name}"?` })
      .click();
    await expect(cell(page, 'Points', SEED.player.name)).toHaveCount(0);
    await expect(page.getByText('No players on the sheet')).toBeVisible();
  });
});
