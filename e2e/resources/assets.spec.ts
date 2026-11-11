import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import {
  applyDrawerFilters,
  expectToast,
  pickOption,
  resetDrawerFilters,
  testTableHeaders,
  uniqueName,
} from '../setup/helpers';

const dialog = (page: Page) => page.getByRole('dialog');
const assetRow = (page: Page, name: string) =>
  page.getByRole('row', { name: new RegExp(name) });

test.describe('Assets page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assets');
  });

  test('has the title, stats and table', async ({ page }) => {
    await expect(page).toHaveTitle(/Assets/);
    for (const stat of ['Total Quantity', 'Need Replacement', 'Outdated']) {
      await expect(page.getByText(stat, { exact: true })).toBeVisible();
    }
    await testTableHeaders(page, [
      'Name',
      'Category',
      'Quantity',
      'Condition',
      'Assigned To',
      'Acquired Date',
      'Last Updated',
      'Note',
    ]);
    await expect(assetRow(page, 'Tactics board')).toContainText(
      SEED.coach.name,
    );
  });

  test('filters by condition from the stat cards and clears them', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Need Replacement/ }).click();
    await expect(page).toHaveURL(/condition=poor/);
    await expect(assetRow(page, 'Agility ladders')).toBeVisible();
    await expect(assetRow(page, 'Tactics board')).toHaveCount(0);

    await page.getByRole('button', { name: /Outdated/ }).click();
    await expect(page).toHaveURL(/condition=obsolete/);
    await expect(assetRow(page, 'Stopwatches')).toBeVisible();

    // The total resets every filter.
    await page.getByRole('button', { name: /Total Quantity/ }).click();
    await expect(page).not.toHaveURL(/condition=/);
  });

  test('filters by category in the drawer and resets', async ({ page }) => {
    await applyDrawerFilters(page, ['Training']);
    await expect(page).toHaveURL(/category=training/);
    await expect(assetRow(page, 'Training cones')).toBeVisible();
    await expect(assetRow(page, 'Tactics board')).toHaveCount(0);

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/category=/);
  });

  test('filters by acquired date and clears back to all time', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: /^Acquired Date:/ });
    await expect(trigger).toHaveAccessibleName('Acquired Date: All time');

    await trigger.click();
    await page.getByRole('button', { name: 'This year' }).click();
    await expect(page).toHaveURL(/from=\d{4}-01-01/);

    await page.getByRole('button', { name: 'Clear Acquired Date' }).click();
    await expect(trigger).toHaveAccessibleName('Acquired Date: All time');
    await expect(page).not.toHaveURL(/from=/);
  });

  test('searches assets by name', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('jersey');

    await expect(page).toHaveURL(/q=jersey/);
    await expect(assetRow(page, 'Home jerseys')).toBeVisible();
    await expect(assetRow(page, 'Tactics board')).toHaveCount(0);
  });
});

test.describe.serial('Asset lifecycle', () => {
  const name = uniqueName('E2E Water bottles');

  test.beforeEach(async ({ page }) => {
    // Searched to the new asset: the table pages 10 rows at a time.
    await page.goto(`/assets?q=${encodeURIComponent(name)}`);
  });

  test('adds an asset assigned to a member, with a note', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(
      dialog(page).getByRole('heading', { name: 'Add Item' }),
    ).toBeVisible();
    const add = dialog(page).getByRole('button', { name: 'Add' });
    await expect(add).toBeDisabled();

    await dialog(page).getByLabel('Name').fill(name);
    await dialog(page).getByRole('spinbutton').fill('12');
    await dialog(page)
      .getByRole('radiogroup', { name: 'Category' })
      .getByText('Training')
      .click();
    await dialog(page)
      .getByRole('radiogroup', { name: 'Condition' })
      .getByText('Fair')
      .click();
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select owner' }),
      new RegExp(SEED.captain.name),
    );
    await dialog(page).locator('[contenteditable="true"]').fill('Keep cold.');
    await add.click();

    await expectToast(page, 'Added asset successfully');
    // The dialog stays open, emptied for the next item.
    await expect(dialog(page).getByLabel('Name')).toHaveValue('');
    await dialog(page).getByRole('button', { name: 'Close' }).click();

    const row = assetRow(page, name);
    await expect(row).toContainText('12');
    await expect(row).toContainText('Training');
    await expect(row).toContainText(SEED.captain.name);
  });

  test('rejects a duplicate name in the team', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await dialog(page).getByLabel('Name').fill(name);
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Added asset successfully')).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    await expect(assetRow(page, name)).toHaveCount(1);
  });

  test('updates the asset from its row', async ({ page }) => {
    await assetRow(page, name).getByRole('cell', { name }).click();
    await expect(
      dialog(page).getByRole('heading', { name: 'Update Item' }),
    ).toBeVisible();
    await expect(dialog(page).getByLabel('Name')).toHaveValue(name);

    await dialog(page).getByRole('spinbutton').fill('20');
    await dialog(page)
      .getByRole('radiogroup', { name: 'Condition' })
      .getByText('Poor')
      .click();
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expectToast(page, 'Updated asset successfully');
    await expect(assetRow(page, name)).toContainText('20');
    await expect(assetRow(page, name)).toContainText('Poor');
  });

  test('deletes the asset', async ({ page }) => {
    await assetRow(page, name)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await expect(page.getByText('1 selected')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 asset.');
    await expect(assetRow(page, name)).toHaveCount(0);
  });
});
