import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { expectToast, testTableHeaders, uniqueName } from '../setup/helpers';

const dialog = (page: Page) => page.getByRole('dialog');
const teamRow = (page: Page, name: string) =>
  page.getByRole('row', { name: new RegExp(name) });

test.describe('Teams page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teams');
  });

  test('lists the opponents, not the club itself', async ({ page }) => {
    await expect(page).toHaveTitle(/Teams/);
    await testTableHeaders(page, [
      'Name',
      'Email',
      'Established',
      'Last Updated',
    ]);
    // 19 opponents, ten per page.
    await expect(
      page.getByRole('checkbox', { name: 'Select row' }),
    ).toHaveCount(10);
    await page.getByPlaceholder(/search/i).fill('Phú Nhuận');
    await expect(teamRow(page, 'CLB Bóng rổ Phú Nhuận')).toContainText(
      'bongro.phunhuan@example.com',
    );
    await page.getByPlaceholder(/search/i).fill('Saigon Rovers');
    await expect(teamRow(page, SEED.team)).toHaveCount(0);
  });

  test('searches by name and by email', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Thủ Đức');
    await expect(page).toHaveURL(/q=/);
    await expect(teamRow(page, 'CLB Bóng rổ Thủ Đức')).toBeVisible();
    await expect(teamRow(page, 'CLB Bóng rổ Phú Nhuận')).toHaveCount(0);

    await page.getByPlaceholder(/search/i).fill('bongro.cantho');
    await expect(teamRow(page, 'CLB Bóng rổ Cần Thơ')).toBeVisible();
  });

  test('keeps a team that has match history', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Phú Nhuận');
    await teamRow(page, 'CLB Bóng rổ Phú Nhuận')
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, /This team appears in \d+ match\(es\)/);
    await page.reload();
    await expect(teamRow(page, 'CLB Bóng rổ Phú Nhuận')).toBeVisible();
  });
});

test.describe.serial('Team lifecycle', () => {
  const name = uniqueName('E2E Opponents');

  test.beforeEach(async ({ page }) => {
    await page.goto(`/teams?q=${encodeURIComponent(name)}`);
  });

  test('validates the email and establish year', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    const add = dialog(page).getByRole('button', { name: 'Add' });

    await dialog(page).getByLabel('Name').fill(name);
    await dialog(page).getByLabel('Email').fill('not-an-email');
    await expect(add).toBeDisabled();

    await dialog(page).getByLabel('Email').fill('');
    await dialog(page).getByLabel('Establish Year').fill('1990');
    await expect(add).toBeDisabled();
  });

  test('adds an opponent team', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog', { name: 'Add Team' })).toBeVisible();

    await dialog(page).getByLabel('Name').fill(name);
    await dialog(page).getByLabel('Email').fill('e2e.opponents@example.com');
    await dialog(page).getByLabel('Establish Year').fill('2020');
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expectToast(page, 'Added team successfully');
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    await expect(teamRow(page, name)).toContainText('2020');
  });

  test('updates the team from its row', async ({ page }) => {
    await teamRow(page, name).getByRole('cell', { name: '2020' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Update Team' }),
    ).toBeVisible();
    await expect(dialog(page).getByLabel('Name')).toHaveValue(name);

    await dialog(page).getByLabel('Establish Year').fill('2018');
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expectToast(page, 'Updated team successfully');
    await expect(teamRow(page, name)).toContainText('2018');
  });

  test('deletes a team without matches', async ({ page }) => {
    await teamRow(page, name)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 team.');
    await expect(teamRow(page, name)).toHaveCount(0);
  });
});
