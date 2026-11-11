import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { latestCompletedSessionDay } from '../setup/db';
import {
  applyDrawerFilters,
  expectToast,
  pickOption,
  resetDrawerFilters,
  testTableHeaders,
} from '../setup/helpers';

/** `/attendance` for one day; the page defaults to today. */
const dayUrl = (day: string) => `/attendance?from=${day}&to=${day}`;
/** A row of the attendance table (selectable, unlike the bulk dialog's). */
const playerRow = (page: Page, name: string) =>
  page.getByRole('row', { name: new RegExp(`Select row .*${name}`) });

let sessionDay = '';

test.beforeAll(async () => {
  // The seed records attendance for the six latest completed sessions.
  sessionDay = await latestCompletedSessionDay();
});

test.describe('Attendance page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(dayUrl(sessionDay));
  });

  test('has the title, stats and table for the chosen day', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Attendance/);
    for (const stat of ['On Time', 'Late Entry', 'Absent', 'Present Rate']) {
      await expect(page.getByText(stat, { exact: true }).first()).toBeVisible();
    }
    await testTableHeaders(page, [
      'Date',
      'Name',
      'Status',
      'Reason',
      'Last Updated',
    ]);
    // One row per active player, ten per page.
    await expect(
      page.getByRole('checkbox', { name: 'Select row' }),
    ).toHaveCount(10);
  });

  test('filters by status from a stat card', async ({ page }) => {
    // Stat cards are clickable while their count is not zero.
    await page.getByRole('button', { name: /On Time/ }).click();

    await expect(page).toHaveURL(/status=on_time/);
    const rows = page.getByRole('row', { name: /^Select row/ });
    for (const row of await rows.all()) {
      await expect(row).toContainText('On Time');
    }
  });

  test('filters by status in the drawer and resets', async ({ page }) => {
    await applyDrawerFilters(page, ['Absent']);
    await expect(page).toHaveURL(/status=absent/);

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/status=/);
  });

  test('searches players by name', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Khang');

    await expect(page).toHaveURL(/q=Khang/);
    await expect(playerRow(page, SEED.captain.name)).toBeVisible();
    await expect(page.getByRole('row', { name: /^Select row/ })).toHaveCount(1);
    await expect(playerRow(page, SEED.player.name)).toHaveCount(0);
  });

  test('picks another day with the date picker', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Date:/ });
    await trigger.click();
    await page.getByRole('button', { name: 'Today' }).click();

    await expect(trigger).toHaveAccessibleName('Date: Today');
    await expect(page).not.toHaveURL(new RegExp(`from=${sessionDay}`));
  });
});

test.describe.serial('Update attendance records', () => {
  test('changes the status of a selected record', async ({ page }) => {
    await page.goto(dayUrl(sessionDay));
    const row = playerRow(page, SEED.player.name);

    await row
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await expect(page.getByText('1 selected')).toBeVisible();

    // Offer the statuses the record can move to.
    const current = (await row.textContent())?.match(
      /On Time|Late|Absent/,
    )?.[0];
    const next = current === 'Late' ? 'Absent' : 'Late';
    await page.getByRole('button', { name: next, exact: true }).click();

    await expectToast(page, 'Updated 1 attendance record successfully');
    await expect(row).toContainText(next);
  });

  test('deletes a selected record', async ({ page }) => {
    await page.goto(dayUrl(sessionDay));
    const row = playerRow(page, SEED.player.name);

    await row
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 attendance record.');
    await expect(row).toHaveCount(0);
  });
});

test.describe('Mark attendance in bulk', () => {
  test('records an absence with a reason for a selected player', async ({
    page,
  }) => {
    // A day far enough ahead that no seeded record uses it.
    const day = new Date();
    day.setDate(day.getDate() + 60);
    const iso = day.toISOString().slice(0, 10);
    const [year, month, date] = iso.split('-');

    await page.goto('/attendance');
    await page.getByRole('button', { name: 'Mark Attendance' }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Mark Bulk Attendance' }),
    ).toBeVisible();

    const dateInput = dialog.getByRole('textbox', { name: 'Date' });
    await dateInput.fill(`${date}/${month}/${year}`);
    await dateInput.blur();

    await pickOption(
      page,
      dialog.getByRole('combobox', { name: 'Select players' }),
      new RegExp(SEED.player.name),
    );
    // Close the list without Escape, which would close the dialog too.
    await dialog.getByRole('heading', { name: 'Mark Bulk Attendance' }).click();

    // The picked player is listed, absent by default, with a reason picker.
    await expect(
      dialog.getByRole('cell', { name: SEED.player.name }),
    ).toBeVisible();
    await pickOption(
      page,
      dialog.getByRole('combobox', { name: 'Reason' }),
      'Family',
    );
    await dialog.getByPlaceholder('Details...').fill('Wedding');
    await dialog.getByRole('button', { name: 'Submit' }).click();

    await expectToast(page, 'Submitted leave requests for 1 player.');
    // The page jumps to the day just marked.
    await expect(page).toHaveURL(new RegExp(`from=${iso}`));
    await expect(playerRow(page, SEED.player.name)).toContainText(
      'Family · Wedding',
    );
  });
});
