import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { expectToast, pickOption } from '../setup/helpers';

const preview = (page: Page) =>
  page
    .locator('.chakra-card__root')
    .filter({ has: page.getByText('Preview', { exact: true }) });

/** Pick every active player and a league, which unlocks the preview. */
async function prepare(page: Page) {
  await page.getByRole('button', { name: 'Select all' }).click();
  await pickOption(
    page,
    page.getByRole('combobox', { name: 'Select leagues' }),
    /Autumn Cup/,
  );
}

test.describe('Registration page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/registration');
  });

  test('starts with nothing to preview', async ({ page }) => {
    await expect(page).toHaveTitle(/Tournament Registration/);
    await expect(page.getByText('Nothing to preview yet')).toBeVisible();
    for (const action of ['CSV', 'PDF', 'Save']) {
      await expect(
        preview(page).getByRole('button', { name: action }),
      ).toBeDisabled();
    }
    await expect(page.getByText('No saved registrations yet')).toBeVisible();
  });

  test('selects and clears players', async ({ page }) => {
    await page.getByRole('button', { name: 'Select all' }).click();
    // Only active players can be registered.
    await expect(page.getByText('15 selected')).toBeVisible();

    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.getByText('0 selected')).toBeVisible();
  });

  test('previews the roster as a table once players and a league are set', async ({
    page,
  }) => {
    await prepare(page);

    await expect(
      page.getByText('No PDF uploaded - showing the registration as a table.'),
    ).toBeVisible();
    await expect(
      preview(page).getByRole('cell', { name: SEED.captain.name }),
    ).toBeVisible();
    for (const action of ['CSV', 'PDF', 'Save']) {
      await expect(
        preview(page).getByRole('button', { name: action }),
      ).toBeEnabled();
    }
  });

  test('downloads the registration as CSV and as PDF', async ({ page }) => {
    await prepare(page);

    const csv = page.waitForEvent('download');
    await preview(page).getByRole('button', { name: 'CSV' }).click();
    expect((await csv).suggestedFilename()).toMatch(/\.csv$/);
    await expectToast(page, 'CSV downloaded');

    const pdf = page.waitForEvent('download');
    await preview(page).getByRole('button', { name: 'PDF' }).click();
    expect((await pdf).suggestedFilename()).toMatch(/\.pdf$/);
    await expectToast(page, 'PDF downloaded');
  });
});

test.describe.serial('Saved registrations', () => {
  test('saves, finds, downloads and removes a registration', async ({
    page,
  }) => {
    await page.goto('/registration');
    await prepare(page);
    await preview(page).getByRole('button', { name: 'Save' }).click();
    await expectToast(page, 'Registration saved');

    const saved = page.getByRole('row', { name: /Autumn Cup/ });
    await expect(saved).toContainText('15');

    // Saved per browser, so it survives a reload.
    await page.reload();
    await expect(saved).toBeVisible();

    await page.getByPlaceholder('Filter by name...').fill('Autumn');
    await expect(saved).toBeVisible();
    await page.getByPlaceholder('Filter by name...').fill('No such league');
    await expect(saved).toHaveCount(0);
    await page.getByPlaceholder('Filter by name...').clear();

    const download = page.waitForEvent('download');
    await saved.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);

    await saved.getByRole('button', { name: 'Remove' }).click();
    await expectToast(page, 'Registration removed');
    await expect(page.getByText('No saved registrations yet')).toBeVisible();
  });
});
