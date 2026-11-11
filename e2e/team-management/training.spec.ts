import { expect, type Page, test } from '@playwright/test';

import {
  applyDrawerFilters,
  expectToast,
  fillDate,
  pickOption,
  resetDrawerFilters,
  testTableHeaders,
} from '../setup/helpers';

const LOCATION = 'Nhà thi đấu Rạch Miễu';

/** An ISO day `days` from today. */
function isoIn(days: number) {
  const day = new Date();
  day.setDate(day.getDate() + days);
  return day.toISOString().slice(0, 10);
}

const dayUrl = (iso: string) => `/training?from=${iso}&to=${iso}`;
const sessionRow = (page: Page) =>
  page.getByRole('row').filter({ hasText: LOCATION });

test.describe('Training sessions page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/training');
  });

  test('has the title, stats and table', async ({ page }) => {
    await expect(page).toHaveTitle(/Training Sessions/);
    for (const stat of [
      'Completed Sessions',
      'Average Attendance',
      'Total Hours',
    ]) {
      await expect(page.getByText(stat, { exact: true })).toBeVisible();
    }
    await testTableHeaders(page, [
      'Date',
      'Time',
      'Location',
      'Status',
      'Present Rate',
    ]);
    // Seeded sessions run at Sân Hoa Viên, 20:00 - 21:30.
    await expect(
      page.getByRole('cell', { name: /Sân Hoa Viên/ }).first(),
    ).toBeVisible();
  });

  test('narrows the time range', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Time:/ });
    await expect(trigger).toHaveAccessibleName('Time: This year');

    await trigger.click();
    await page.getByRole('button', { name: 'Last month' }).click();

    await expect(trigger).toHaveAccessibleName('Time: Last month');
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-01/);
  });

  test('shows completed sessions from the stat card', async ({ page }) => {
    await page.getByText('Completed Sessions', { exact: true }).click();
    await expect(page).toHaveURL(/status=completed/);
    await expect(page.getByRole('cell', { name: 'Scheduled' })).toHaveCount(0);
  });

  test('filters by status in the drawer and resets', async ({ page }) => {
    await applyDrawerFilters(page, ['Cancelled']);
    await expect(page).toHaveURL(/status=cancelled/);
    await expect(page.getByRole('cell', { name: 'Completed' })).toHaveCount(0);

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/status=/);
  });
});

test.describe.serial('Session lifecycle', () => {
  // A day with no seeded session, so the new one is the only row.
  const day = isoIn(45);

  test('validates the time range before creating', async ({ page }) => {
    await page.goto('/training');
    await page.getByRole('button', { name: 'New Session' }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Create Session' }),
    ).toBeVisible();

    await dialog.getByLabel('Start Time').fill('19:00');
    await dialog.getByLabel('End Time').fill('18:00');
    // An end before the start cannot be submitted...
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled();

    // ...until the range is fixed.
    await dialog.getByLabel('End Time').fill('20:00');
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  test('creates a session', async ({ page }) => {
    await page.goto('/training');
    await page.getByRole('button', { name: 'New Session' }).click();
    const dialog = page.getByRole('dialog');

    await fillDate(page, 'Date', day);
    // The weekday follows the picked date.
    await expect(dialog.getByLabel('Day')).not.toHaveValue('');
    await dialog.getByLabel('Start Time').fill('18:00');
    await dialog.getByLabel('End Time').fill('19:30');
    await pickOption(
      page,
      dialog.getByRole('combobox', { name: 'Select locations' }),
      LOCATION,
    );
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expectToast(page, 'Created training session successfully');

    await page.goto(dayUrl(day));
    await expect(sessionRow(page)).toHaveCount(1);
    await expect(sessionRow(page)).toContainText('18:00');
    await expect(sessionRow(page)).toContainText('Scheduled');
  });

  test('updates the session from its row', async ({ page }) => {
    await page.goto(dayUrl(day));
    // Not the location cell: it is a maps link that keeps the click to itself.
    await sessionRow(page).getByRole('cell', { name: /18:00/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Update Session' }),
    ).toBeVisible();
    // Stored with seconds; the time input accepts either form.
    await expect(dialog.getByLabel('Start Time')).toHaveValue(/^18:00/);

    await dialog.getByLabel('End Time').fill('20:00');
    await dialog.getByRole('button', { name: 'Update' }).click();

    await expectToast(page, 'Updated training session successfully');
    await expect(sessionRow(page)).toContainText('20:00');
  });

  test('deletes the session', async ({ page }) => {
    await page.goto(dayUrl(day));
    await sessionRow(page)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await page.getByRole('button', { name: 'Delete' }).click();

    await expectToast(page, 'Successfully deleted 1 session.');
    await expect(sessionRow(page)).toHaveCount(0);
  });
});
