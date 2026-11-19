import { expect, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { testTableHeaders } from '../setup/helpers';

const url = `/performance/${SEED.captain.id}`;

test.describe('Player performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url);
  });

  test('shows the player, their honors and headline stats', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Performance/);
    await expect(page.getByText(SEED.captain.name).first()).toBeVisible();
    await expect(page.getByText('Captain').first()).toBeVisible();
    for (const stat of [
      'Attendance Rate',
      'Current Streak',
      'Tests Taken',
      'Individual Honors',
    ]) {
      await expect(page.getByText(stat, { exact: true })).toBeVisible();
    }
  });

  test('opens on the attendance tab', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Attendance' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByText('Breakdown')).toBeVisible();
    await expect(page.getByText('Attendance Rate Trend')).toBeVisible();
  });

  test('changes the time range through the URL', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Time:/ });
    await expect(trigger).toHaveAccessibleName('Time: This year');

    await trigger.click();
    await page.getByRole('button', { name: 'Last year' }).click();

    await expect(trigger).toHaveAccessibleName('Time: Last year');
    await expect(page).toHaveURL(/from=\d{4}-01-01/);
  });

  test('charts the picked test on the testing tab', async ({ page }) => {
    await page.getByRole('tab', { name: 'Testing' }).click();
    await expect(page).toHaveURL(/tab=testing/);
    await expect(page.getByText('Latest Results')).toBeVisible();
    await expect(page.getByText('Team Standing')).toBeVisible();

    await page.getByText('Standing long jump', { exact: true }).first().click();
    await expect(page).toHaveURL(
      /test=Standing\+long\+jump|test=Standing%20long%20jump/,
    );
    await expect(
      page.getByText(/^Standing long jump \(Meters\) ·/),
    ).toBeVisible();
  });

  test('lists and narrows the activity log', async ({ page }) => {
    await page.getByRole('tab', { name: 'Activity' }).click();
    await expect(page).toHaveURL(/tab=activity/);
    await expect(page.getByText('Activity Log')).toBeVisible();
    await testTableHeaders(page, ['Date', 'Type', 'Details', 'Outcome']);

    await page
      .getByRole('radio', { name: 'Fitness tests' })
      .click({ force: true });
    await expect(page).toHaveURL(/kind=test/);
    // Only the three seeded test days remain; the Type column drops out.
    await expect(page.getByRole('row', { name: /5 test types/ })).toHaveCount(
      3,
    );
    await expect(page.getByRole('columnheader', { name: 'Type' })).toHaveCount(
      0,
    );

    await page.getByRole('radio', { name: 'All' }).click({ force: true });
    await expect(page).not.toHaveURL(/kind=/);
    await expect(
      page.getByRole('columnheader', { name: 'Type' }),
    ).toBeVisible();
  });

  test('shows box scores on the matches tab', async ({ page }) => {
    await page.getByRole('tab', { name: 'Matches' }).click();
    await expect(page).toHaveURL(/tab=matches/);
    await expect(page.getByText('Recent Match Statistics')).toBeVisible();
    await expect(page.getByText('Box Scores')).toBeVisible();
  });

  test('explains that a coach has no performance data', async ({ page }) => {
    await page.goto(`/performance/${SEED.coach.id}`);

    await expect(
      page.getByRole('heading', { name: 'Players only' }),
    ).toBeVisible();
    await expect(
      page.getByText(`${SEED.coach.name} is not a player`),
    ).toBeVisible();
  });
});
