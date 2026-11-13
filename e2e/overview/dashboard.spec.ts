import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { pickOption } from '../setup/helpers';

/** The dashboard card titled `title`. */
const card = (page: Page, title: string) =>
  page
    .locator('.chakra-card__root')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard');
});

test.describe('Overview', () => {
  test('has the page title and the club’s headline numbers', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Dashboard/);
    const overview = card(page, 'Overview');

    await expect(overview.getByText(/of playing together$/)).toBeVisible();
    // 15 of the 17 seeded players are active.
    await expect(overview).toContainText(/Active Players\s*15/);
    await expect(overview.getByText('Win Rate')).toBeVisible();
    await expect(overview.getByText('champions, MVP, ...')).toBeVisible();
  });
});

test.describe('Quick actions', () => {
  test('jumps to the training schedule', async ({ page }) => {
    await card(page, 'Quick Actions')
      .getByRole('link', { name: 'View Schedule' })
      .click();
    await expect(page).toHaveURL(/\/training/);
  });

  test('jumps to the match results', async ({ page }) => {
    await card(page, 'Quick Actions')
      .getByRole('link', { name: 'Match Results' })
      .click();
    await expect(page).toHaveURL(/\/matches/);
  });

  test('opens bulk attendance marking', async ({ page }) => {
    await card(page, 'Quick Actions')
      .getByRole('button', { name: 'Mark Attendance' })
      .click();
    await expect(
      page.getByRole('dialog').getByRole('heading', {
        name: 'Mark Bulk Attendance',
      }),
    ).toBeVisible();
  });
});

test.describe('Upcoming', () => {
  test('lists the next three training sessions', async ({ page }) => {
    const sessions = card(page, 'Upcoming Sessions');
    await expect(sessions.getByText('Next 3 training sessions')).toBeVisible();
    // Seeded sessions run 20:00 - 21:30 on Tuesdays and Thursdays.
    await expect(sessions.getByText(/20:00/)).toHaveCount(3);
  });

  test('lists the next three scheduled matches', async ({ page }) => {
    const matches = card(page, 'Upcoming Matches');
    await expect(matches.getByText('Next 3 scheduled games')).toBeVisible();
    await expect(matches.getByText('Nothing here')).toHaveCount(0);
  });
});

test.describe('Analytics', () => {
  test('shows every analytics card with data', async ({ page }) => {
    for (const title of [
      'Matches Record',
      'Attendance Rate Trend',
      'Player Attendance Rankings',
      'Most Common Absence Reasons',
    ]) {
      await expect(card(page, title)).toBeVisible();
    }
    await expect(page.getByText('Attendance Stars')).toBeVisible();
    await expect(page.getByText('Need a Boost', { exact: true })).toBeVisible();
    // Reason categories are translated, with "Unknown" for absences without one.
    const reasons = card(page, 'Most Common Absence Reasons');
    await expect(reasons.getByRole('listitem').first()).toBeVisible();
    await expect(reasons.getByText('Work')).toBeVisible();
  });

  test('narrows the analytics to another time range', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Time:/ });
    await expect(trigger).toHaveAccessibleName('Time: This year');

    await trigger.click();
    await page.getByRole('button', { name: 'This month' }).click();

    await expect(trigger).toHaveAccessibleName('Time: This month');
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-01/);
  });

  test('links from the matches record to the matches page', async ({
    page,
  }) => {
    await card(page, 'Matches Record')
      .getByRole('link', { name: 'View Matches' })
      .click();
    await expect(page).toHaveURL(/\/matches/);
  });
});

test.describe('Export report', () => {
  test('reports a failed download instead of hanging', async ({ page }) => {
    await page.getByRole('button', { name: 'Export Report' }).click();
    await page.getByRole('menuitem', { name: 'Download' }).click();

    // The e2e server has no PDF renderer, so the download fails gracefully.
    await expect(page.getByText('Download failed')).toBeVisible({
      timeout: 60_000,
    });
  });

  test('emails the report only once a recipient is chosen', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Export Report' }).click();
    await page.getByRole('menuitem', { name: 'Send To...' }).click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Email Analytics Report' }),
    ).toBeVisible();
    const submit = dialog.getByRole('button', { name: 'Generate & Email' });
    await expect(submit).toBeDisabled();

    await pickOption(
      page,
      dialog.getByRole('combobox', { name: 'Select recipients' }),
      new RegExp(SEED.coach.name),
    );
    await page.keyboard.press('Escape');
    await expect(
      dialog.getByText(/report will be emailed to 1 recipient/),
    ).toBeVisible();
    await expect(submit).toBeEnabled();

    await submit.click();
    // No PDF renderer or mail key in e2e: the failure is reported, nothing is sent.
    await expect(
      page.getByText(/Email failed|Download failed/).first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});
