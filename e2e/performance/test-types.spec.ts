import { expect, type Page, test } from '@playwright/test';

import {
  applyDrawerFilters,
  expectToast,
  resetDrawerFilters,
  testTableHeaders,
  uniqueName,
} from '../setup/helpers';

const dialog = (page: Page) => page.getByRole('dialog');
const typeRow = (page: Page, name: string) =>
  page.getByRole('row', { name: new RegExp(name) });

test.describe('Test types page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/periodic-testing/test-types');
  });

  test('has the title and the seeded tests with direction and target', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Test Types/);
    await testTableHeaders(page, [
      'Name',
      'Unit',
      'Progress',
      'Target',
      'Last Updated',
    ]);
    await expect(typeRow(page, '20m sprint')).toContainText('Seconds');
    await expect(typeRow(page, '20m sprint')).toContainText('Lower is better');
    await expect(typeRow(page, '20m sprint')).toContainText('3.2');
    await expect(typeRow(page, 'Standing long jump')).toContainText(
      'Higher is better',
    );
  });

  test('filters by unit and resets', async ({ page }) => {
    await applyDrawerFilters(page, ['Seconds']);
    await expect(page).toHaveURL(/unit=seconds/);
    await expect(typeRow(page, '20m sprint')).toBeVisible();
    await expect(typeRow(page, 'Beep test')).toHaveCount(0);

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/unit=/);
  });

  test('searches by name', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('sprint');
    await expect(page).toHaveURL(/q=sprint/);
    await expect(typeRow(page, '20m sprint')).toBeVisible();
    await expect(typeRow(page, 'Beep test')).toHaveCount(0);
  });

  test('keeps a test type that has results', async ({ page }) => {
    await typeRow(page, 'Beep test')
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, /Type is being in use/);
    await page.reload();
    await expect(typeRow(page, 'Beep test')).toBeVisible();
  });
});

test.describe.serial('Test type lifecycle', () => {
  const name = uniqueName('E2E Vertical jump');

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `/periodic-testing/test-types?q=${encodeURIComponent(name)}`,
    );
  });

  test('adds a test type with a unit, direction and target', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Add Test Type' }),
    ).toBeVisible();

    await dialog(page).getByLabel('Name').fill(name);
    await dialog(page)
      .getByRole('radiogroup', { name: 'Unit' })
      .getByText('Meters')
      .click();
    await dialog(page)
      .getByRole('radiogroup', { name: 'Progress' })
      .getByText('Higher is better')
      .click();
    await dialog(page).getByLabel('Target').fill('0.65');
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expectToast(page, /successfully/i);
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    const row = typeRow(page, name);
    await expect(row).toContainText('Meters');
    await expect(row).toContainText('0.65');
  });

  test('refuses a duplicate name', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await dialog(page).getByLabel('Name').fill(name);
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expect(dialog(page)).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    await expect(typeRow(page, name)).toHaveCount(1);
  });

  test('switches the direction to lower is better', async ({ page }) => {
    await typeRow(page, name).getByRole('cell', { name: 'Meters' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Update Test Type' }),
    ).toBeVisible();

    await dialog(page)
      .getByRole('radiogroup', { name: 'Progress' })
      .getByText('Lower is better')
      .click();
    await dialog(page).getByLabel('Target').fill('');
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expectToast(page, 'Test type updated successfully');
    await expect(typeRow(page, name)).toContainText('Lower is better');
    await expect(
      typeRow(page, name).getByRole('cell', { name: '-', exact: true }),
    ).toBeVisible();
  });

  test('deletes an unused test type', async ({ page }) => {
    await typeRow(page, name)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, /Successfully deleted 1 (test )?type/);
    await expect(typeRow(page, name)).toHaveCount(0);
  });
});
