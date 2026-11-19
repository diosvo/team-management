import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { openOptions, pickOption } from '../setup/helpers';

const MONTHLY = 'Monthly · last month, on the 1st';
const YEARLY = 'Yearly · last year, on 1 January';

const dialog = (page: Page) => page.getByRole('dialog');
const row = (page: Page, name: string) =>
  page.getByRole('row', { name: new RegExp(name) });
/** The row's enable switch (its hidden checkbox input). */
const toggle = (page: Page, name: string) =>
  row(page, name).getByLabel('Enable schedule');

test.beforeEach(async ({ page }) => {
  await page.goto('/reports');
});

test.describe('Reports page', () => {
  test('has the page title and both sections', async ({ page }) => {
    await expect(page).toHaveTitle(/Reports/);
    await expect(
      page.getByRole('heading', { name: 'Report Schedules' }),
    ).toBeVisible();
    await expect(page.getByText('Report History')).toBeVisible();
  });

  test('lists the seeded monthly schedule', async ({ page }) => {
    const monthly = row(page, MONTHLY);
    await expect(monthly).toBeVisible();
    await expect(monthly.getByText('1 recipient(s)')).toBeVisible();
    await expect(toggle(page, MONTHLY)).toBeChecked();
  });
});

// One file owns the report schedules, so these run in order against them.
test.describe.serial('Schedule lifecycle', () => {
  test('pauses and resumes a schedule', async ({ page }) => {
    const monthly = row(page, MONTHLY);

    await toggle(page, MONTHLY).click({ force: true });
    await expect(
      page.getByText('Schedule disabled successfully'),
    ).toBeVisible();
    await expect(toggle(page, MONTHLY)).not.toBeChecked();
    await expect(toggle(page, MONTHLY)).toBeEnabled();
    // A paused schedule cannot run and has no next run.
    await expect(
      monthly.getByRole('button', { name: 'Run now' }),
    ).toBeDisabled();

    await toggle(page, MONTHLY).click({ force: true });
    await expect(page.getByText('Schedule enabled successfully')).toBeVisible();
    await expect(toggle(page, MONTHLY)).toBeChecked();
    await expect(
      monthly.getByRole('button', { name: 'Run now' }),
    ).toBeEnabled();
  });

  test('runs a schedule on demand and reports the outcome', async ({
    page,
  }) => {
    await row(page, MONTHLY).getByRole('button', { name: 'Run now' }).click();

    await expect(page.getByText('Generating report...')).toBeVisible();
    // The e2e server has no PDF renderer, mail or blob credentials, so the
    // run ends in a handled failure rather than emailing anyone: the loading
    // toast resolves, and the attempt is logged as a manual run.
    await expect(page.getByText('Generating report...')).toBeHidden({
      timeout: 60_000,
    });
    await expect(
      page.getByRole('row', { name: /Last month .*Manual/ }),
    ).toBeVisible();
  });

  test('adds a yearly schedule, offering only the unused report', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'New Schedule' }).click();
    await expect(
      dialog(page).getByRole('heading', { name: 'Add Report Schedule' }),
    ).toBeVisible();
    const save = dialog(page).getByRole('button', { name: 'Add' });
    await expect(save).toBeDisabled();

    await dialog(page).getByRole('combobox', { name: 'Report' }).click();
    // Monthly is already scheduled, so only Yearly is offered.
    await expect(openOptions(page)).toHaveText([YEARLY]);
    await openOptions(page).first().click();

    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select recipients' }),
      new RegExp(SEED.coach.name),
    );
    await page.keyboard.press('Escape');

    await expect(save).toBeEnabled();
    await save.click();

    await expect(
      page.getByText('Added report schedule successfully'),
    ).toBeVisible();
    await expect(row(page, YEARLY)).toBeVisible();
    // Both reports are now scheduled.
    await expect(
      page.getByRole('button', { name: 'New Schedule' }),
    ).toBeDisabled();
  });

  test('edits the recipients of a schedule', async ({ page }) => {
    await row(page, YEARLY).getByText('1 recipient(s)').click();
    await expect(
      dialog(page).getByRole('heading', { name: 'Update Report Schedule' }),
    ).toBeVisible();

    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select recipients' }),
      new RegExp(SEED.captain.name),
    );
    await page.keyboard.press('Escape');
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expect(
      page.getByText('Updated report schedule successfully'),
    ).toBeVisible();
    await expect(row(page, YEARLY).getByText('2 recipient(s)')).toBeVisible();
  });

  test('deletes a schedule through the row selection', async ({ page }) => {
    await row(page, YEARLY)
      .getByRole('checkbox', { name: 'Select row' })
      .click({ force: true });
    await expect(page.getByText('1 selected')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(
      page.getByText('Deleted 1 schedule(s) successfully'),
    ).toBeVisible();
    await expect(row(page, YEARLY)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'New Schedule' }),
    ).toBeEnabled();
  });
});
