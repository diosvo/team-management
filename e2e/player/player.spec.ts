import { expect, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { expectToast, pickOption } from '../setup/helpers';

/**
 * Signed in as a regular player (not the captain). These specs cover what a
 * player can do and, as importantly, what stays out of reach.
 */

test.describe('Navigation as a player', () => {
  test('shows only the pages a player may view', async ({ page }) => {
    await page.goto('/dashboard');
    const nav = page.getByRole('navigation', { name: 'Main' });

    for (const item of ['Dashboard', 'Roster', 'Attendance', 'Progression']) {
      await expect(nav.getByRole('link', { name: item })).toBeVisible();
    }
    // Managing test types needs create rights (admins, coaches, captains);
    // leagues and locations are settings a player cannot view.
    for (const item of ['Test Types', 'Leagues', 'Locations']) {
      await expect(nav.getByRole('link', { name: item })).toHaveCount(0);
    }
  });

  test('is turned away from an admin-only page', async ({ page }) => {
    await page.goto('/leagues');

    await expect(page).toHaveURL('/forbidden');
    await expect(page.getByText('Access Denied')).toBeVisible();
    await page.getByRole('link', { name: 'Return Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('cannot open another player’s performance', async ({ page }) => {
    // The page streams, so the refusal renders in place of the content.
    await page.goto(`/performance/${SEED.captain.id}`);

    await expect(page.getByText('Access Denied')).toBeVisible();
    await expect(page.getByText(SEED.captain.name)).toHaveCount(0);
  });
});

test.describe('Attendance as a player', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/attendance');
  });

  test('offers a leave request, not bulk marking', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Submit Leave Request' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Mark Attendance' }),
    ).toHaveCount(0);
  });

  test('submits a leave request with a reason and details', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Submit Leave Request' }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Submit Leave Request' }),
    ).toBeVisible();

    // A day no seeded leave request uses.
    const day = new Date();
    day.setDate(day.getDate() + 40);
    const [year, month, date] = day.toISOString().slice(0, 10).split('-');
    const input = dialog.getByRole('textbox', { name: 'Date' });
    await input.fill(`${date}/${month}/${year}`);
    await input.blur();

    await pickOption(
      page,
      dialog.getByRole('combobox', { name: 'Reason' }),
      'Study / Exams',
    );
    await dialog.getByLabel('Details').fill('Midterm exams');
    await dialog.getByRole('button', { name: 'Submit' }).click();

    await expectToast(page, 'Leave request submitted successfully');
  });

  test('refuses a second leave request for the same day', async ({ page }) => {
    // Same day as the request above (tests in a file run in order).
    await page.getByRole('button', { name: 'Submit Leave Request' }).click();
    const dialog = page.getByRole('dialog');

    const day = new Date();
    day.setDate(day.getDate() + 40);
    const [year, month, date] = day.toISOString().slice(0, 10).split('-');
    const input = dialog.getByRole('textbox', { name: 'Date' });
    await input.fill(`${date}/${month}/${year}`);
    await input.blur();
    await dialog.getByRole('button', { name: 'Submit' }).click();

    await expectToast(page, /Already submitted/);
  });
});

test.describe('Profiles as a player', () => {
  test('edits their own profile and sees their full citizen ID', async ({
    page,
  }) => {
    await page.goto(`/profile/${SEED.player.id}`);

    await expect(page.getByText('View Only')).toHaveCount(0);
    await expect(page.getByText(/^079\d{9}$/)).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View performance' }),
    ).toBeVisible();
  });

  test('sees a teammate’s profile read-only, with the citizen ID masked', async ({
    page,
  }) => {
    await page.goto(`/profile/${SEED.captain.id}`);

    await expect(page.getByText('View Only')).toBeVisible();
    await expect(page.getByText(/^•+\d{4}$/)).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View performance' }),
    ).toHaveCount(0);
  });

  test('opens their own performance from the account menu', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Performance' }).click();

    await expect(page).toHaveURL(`/performance/${SEED.player.id}`);
    await expect(page.getByText('My Performance')).toBeVisible();
  });
});
