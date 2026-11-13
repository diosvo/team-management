import { expect, type Page, test } from '@playwright/test';

import { expectToast, testTableHeaders, uniqueName } from '../setup/helpers';

const dialog = (page: Page) => page.getByRole('dialog');
const locationRow = (page: Page, name: string) =>
  page.getByRole('row', { name: new RegExp(name) });

test.describe('Locations page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/locations');
  });

  test('has the title and lists the seeded courts', async ({ page }) => {
    await expect(page).toHaveTitle(/Locations/);
    await testTableHeaders(page, ['Name', 'Address', 'Last Updated']);
    await expect(locationRow(page, 'Sân Hoa Viên')).toContainText(
      '02 Lê Đại Hành',
    );
  });

  test('links each court to Google Maps', async ({ page }) => {
    const link = locationRow(page, 'Sân Hoa Viên').getByRole('link', {
      name: 'Sân Hoa Viên',
    });
    await expect(link).toHaveAttribute(
      'href',
      /google\.com\/maps\/search\/\?api=1&query=S%C3%A2n%20Hoa%20Vi%C3%AAn/,
    );
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('searches by name or address', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Quận 7');

    await expect(page).toHaveURL(/q=/);
    await expect(locationRow(page, 'Trung tâm TDTT Quận 7')).toBeVisible();
    await expect(locationRow(page, 'Sân Hoa Viên')).toHaveCount(0);
  });
});

test.describe.serial('Location lifecycle', () => {
  const name = uniqueName('E2E Court');

  test.beforeEach(async ({ page }) => {
    await page.goto(`/locations?q=${encodeURIComponent(name)}`);
  });

  test('requires both a name and an address', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    const add = dialog(page).getByRole('button', { name: 'Add' });
    await expect(add).toBeDisabled();

    await dialog(page).getByLabel('Name').fill(name);
    await expect(add).toBeDisabled();
  });

  test('adds a location', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Add Location' }),
    ).toBeVisible();

    await dialog(page).getByLabel('Name').fill(name);
    await dialog(page).getByLabel('Address').fill('1 E2E Street, District 1');
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expectToast(page, 'Added location successfully');
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    await expect(locationRow(page, name)).toContainText('1 E2E Street');
  });

  test('updates the location from its address cell', async ({ page }) => {
    // The name cell is a maps link, which keeps the click to itself.
    await locationRow(page, name)
      .getByRole('cell', { name: /E2E Street/ })
      .click();
    await expect(
      page.getByRole('dialog', { name: 'Update Location' }),
    ).toBeVisible();
    await expect(dialog(page).getByLabel('Name')).toHaveValue(name);

    await dialog(page).getByLabel('Address').fill('2 E2E Avenue, District 3');
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expectToast(page, 'Updated location successfully');
    await expect(locationRow(page, name)).toContainText('2 E2E Avenue');
  });

  test('deletes the location', async ({ page }) => {
    await locationRow(page, name)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 location.');
    await expect(locationRow(page, name)).toHaveCount(0);
  });
});
