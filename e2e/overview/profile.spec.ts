import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { expectToast } from '../setup/helpers';

/** The card with `title` ("Personal Information" / "Team Information"). */
const section = (page: Page, title: string) =>
  page
    .locator('form')
    .filter({ has: page.getByRole('heading', { name: title }) });

test.describe('Profile of a player, seen by an admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/profile/${SEED.player.id}`);
  });

  test('summarizes the player in the header', async ({ page }) => {
    await expect(page).toHaveTitle(/Profile/);
    await expect(
      page.getByRole('heading', { name: SEED.player.name }),
    ).toBeVisible();
    await expect(page.getByText('SF', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/^Member for .+ · joined/)).toBeVisible();
    await expect(page.getByLabel('Jersey number 23')).toBeVisible();
  });

  test('links to the player’s performance', async ({ page }) => {
    await page.getByRole('link', { name: 'View performance' }).click();
    await expect(page).toHaveURL(`/performance/${SEED.player.id}`);
  });

  test('lists contact details as links and the full citizen ID', async ({
    page,
  }) => {
    const personal = section(page, 'Personal Information');
    await expect(
      personal.getByRole('link', { name: SEED.player.email }),
    ).toHaveAttribute('href', `mailto:${SEED.player.email}`);
    await expect(personal.getByText(/years old$/)).toBeVisible();
    // Admins see the whole ID, not the masked one.
    await expect(personal.getByText(/^079\d{9}$/)).toBeVisible();
  });

  test('shows position and jersey in team information', async ({ page }) => {
    const team = section(page, 'Team Information');
    await expect(team.getByText('#23')).toBeVisible();
    await expect(team.getByText('Active')).toBeVisible();
    await expect(team.getByText(/ago\)$/)).toBeVisible();
  });
});

test.describe.serial('Edit a profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/profile/${SEED.player.id}`);
  });

  test('updates personal information', async ({ page }) => {
    const personal = section(page, 'Personal Information');
    await personal.getByRole('button', { name: 'Edit' }).click();

    // Email is the sign-in identity: shown, never editable.
    await expect(personal.getByRole('textbox').first()).toBeDisabled();
    const save = personal.getByRole('button', { name: 'Save' });
    await expect(save).toBeDisabled();

    await personal.getByLabel('Phone Number').fill('0909123456');
    await save.click();

    await expectToast(page, 'Updated personal information successfully');
    await expect(
      personal.getByRole('link', { name: '0909123456' }),
    ).toHaveAttribute('href', 'tel:0909123456');
  });

  test('cancels an edit without saving', async ({ page }) => {
    const personal = section(page, 'Personal Information');
    await personal.getByRole('button', { name: 'Edit' }).click();
    await personal.getByLabel('Phone Number').fill('0911111111');
    await personal.getByRole('button', { name: 'Close' }).click();

    await expect(personal.getByText('0911111111')).toHaveCount(0);
    await expect(
      personal.getByRole('link', { name: '0909123456' }),
    ).toBeVisible();
  });

  test('updates team information', async ({ page }) => {
    const team = section(page, 'Team Information');
    await team.getByRole('button', { name: 'Edit' }).click();

    const jersey = team.getByRole('spinbutton');
    await jersey.fill('32');
    await team.getByRole('button', { name: 'Save' }).click();

    await expectToast(page, 'Updated team information successfully');
    await expect(team.getByText('#32')).toBeVisible();
    await expect(page.getByLabel('Jersey number 32')).toBeVisible();
  });

  test('rejects a jersey number another player wears', async ({ page }) => {
    const team = section(page, 'Team Information');
    await team.getByRole('button', { name: 'Edit' }).click();

    // #7 belongs to the captain.
    await team.getByRole('spinbutton').fill('7');
    await team.getByRole('button', { name: 'Save' }).click();

    await expectToast(page, "Jersey number '7' is already taken");
  });
});

test.describe('Own profile as admin', () => {
  test('is read-only', async ({ page }) => {
    await page.goto(`/profile/${SEED.admin.id}`);

    await expect(page.getByText('View Only')).toBeVisible();
    for (const title of ['Personal Information', 'Team Information']) {
      await expect(
        section(page, title).getByRole('button', { name: 'View Only' }),
      ).toBeDisabled();
    }
    // Not a player: no jersey, no performance link.
    await expect(
      page.getByRole('link', { name: 'View performance' }),
    ).toHaveCount(0);
  });

  test('is reachable from the avatar menu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Profile' }).click();

    await expect(page).toHaveURL(`/profile/${SEED.admin.id}`);
  });
});
