import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import {
  applyDrawerFilters,
  expectToast,
  pickOption,
  resetDrawerFilters,
  testTableHeaders,
} from '../setup/helpers';

const dialog = (page: Page) => page.getByRole('dialog');
const memberRow = (page: Page, name: string) =>
  page.getByRole('row', { name: new RegExp(name) });

test.describe('Roster page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roster');
  });

  test('has the title and the team table', async ({ page }) => {
    await expect(page).toHaveTitle(/Roster/);
    await testTableHeaders(page, [
      'No.',
      'Name',
      'Email',
      'State',
      'Roles',
      'Position',
    ]);
    await page.getByPlaceholder(/search/i).fill(SEED.captain.name);
    await expect(memberRow(page, SEED.captain.name)).toContainText(
      SEED.captain.email,
    );
  });

  test('filters by state and role, then resets', async ({ page }) => {
    await applyDrawerFilters(page, ['Inactive']);
    await expect(page).toHaveURL(/state=inactive/);
    await expect(memberRow(page, 'Lâm Tấn Phát')).toBeVisible();
    await expect(memberRow(page, SEED.captain.name)).toHaveCount(0);

    await resetDrawerFilters(page);
    await applyDrawerFilters(page, ['Coach']);
    await expect(page).toHaveURL(/role=coach/);
    await expect(memberRow(page, SEED.coach.name)).toBeVisible();

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/state=|role=/);
  });

  test('searches by name and keeps the search on reload', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Bảo');
    await expect(page).toHaveURL(/q=/);
    await expect(memberRow(page, SEED.player.name)).toBeVisible();

    await page.reload();
    await expect(page.getByPlaceholder(/search/i)).toHaveValue('Bảo');
    await expect(memberRow(page, SEED.player.name)).toBeVisible();
  });

  test('opens a member’s profile and performance from the row actions', async ({
    page,
  }) => {
    await page.getByPlaceholder(/search/i).fill(SEED.player.name);
    const row = memberRow(page, SEED.player.name);

    await expect(
      row.getByRole('link', { name: 'View performance' }),
    ).toHaveAttribute('href', `/performance/${SEED.player.id}`);
    await row.getByRole('link', { name: 'View profile' }).click();
    await expect(page).toHaveURL(`/profile/${SEED.player.id}`);
  });

  test('offers no performance page for a coach', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill(SEED.coach.name);
    await expect(
      memberRow(page, SEED.coach.name).getByRole('link', {
        name: 'View performance',
      }),
    ).toHaveCount(0);
  });
});

test.describe.serial('Member lifecycle', () => {
  const stamp = Date.now();
  const name = `E2E Member ${stamp}`;
  const email = `e2e.member.${stamp}@example.com`;

  test('adds a player to the roster', async ({ page }) => {
    await page.goto('/roster');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Add to Roster' }),
    ).toBeVisible();
    const add = dialog(page).getByRole('button', { name: 'Add' });
    await expect(add).toBeDisabled();

    await dialog(page).getByLabel('Fullname').fill(name);
    await dialog(page).getByLabel('Email').fill(email);
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'State' }),
      'Active',
    );
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Role' }),
      'Player',
    );
    await expect(add).toBeEnabled();
    await add.click();

    // The account is created, then an invite is emailed. The e2e server
    // cannot send email, so only the outcome on the roster is asserted.
    await expect(page.getByText('Adding user to database...')).toBeHidden({
      timeout: 30_000,
    });
    await page.goto(`/roster?q=${encodeURIComponent(name)}`);
    await expect(memberRow(page, name)).toContainText(email);
  });

  test('rejects a second member with the same email', async ({ page }) => {
    await page.goto('/roster');
    await page.getByRole('button', { name: 'Add' }).click();
    await dialog(page).getByLabel('Fullname').fill(`${name} twin`);
    await dialog(page).getByLabel('Email').fill(email);
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'State' }),
      'Active',
    );
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Role' }),
      'Player',
    );
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expectToast(page, /already exists|exist/i);
  });

  test('removes the member', async ({ page }) => {
    await page.goto(`/roster?q=${encodeURIComponent(name)}`);
    await memberRow(page, name)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 user.');
    await expect(memberRow(page, name)).toHaveCount(0);
  });
});
