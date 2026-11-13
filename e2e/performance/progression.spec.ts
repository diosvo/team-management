import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import {
  applyDrawerFilters,
  expectToast,
  pickOption,
  resetDrawerFilters,
  testTableHeaders,
} from '../setup/helpers';

/** The innermost block holding both the note's text and its buttons. */
const noteCard = (page: Page, text: string) =>
  page
    .locator('div')
    .filter({ hasText: text })
    .filter({ has: page.getByRole('button', { name: 'Edit note' }) })
    .last();

const typeSelect = (page: Page) =>
  page.getByRole('combobox').filter({ hasText: /\(.+\)/ });

test.describe('Progression list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/periodic-testing/progression');
  });

  test('has the page title, stats and table', async ({ page }) => {
    await expect(page).toHaveTitle(/Performance Progression/);
    for (const stat of ['Improving', 'Regressing', 'Team Average']) {
      await expect(page.getByText(stat, { exact: true }).first()).toBeVisible();
    }
    await testTableHeaders(page, ['Player', 'Baseline', 'Latest', 'Trend']);
    // Seeded results cover every active and temporarily absent player.
    await expect(
      page.getByRole('row', { name: new RegExp(SEED.captain.name) }),
    ).toBeVisible();
  });

  test('switches the test type through the URL', async ({ page }) => {
    await pickOption(page, typeSelect(page), '20m sprint (Seconds)');

    await expect(page).toHaveURL(/type=[0-9a-f-]{36}/);
    await expect(typeSelect(page)).toHaveText(/20m sprint/);
  });

  test('filters by trend and resets the filters', async ({ page }) => {
    await applyDrawerFilters(page, ['Improving']);
    await expect(page).toHaveURL(/status=improving/);
    await expect(
      page.getByRole('button', { name: /^Filters\s*1/ }),
    ).toBeVisible();

    await resetDrawerFilters(page);
    await expect(page).not.toHaveURL(/status=/);
  });

  test('searches players by name', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('Khang');

    await expect(page).toHaveURL(/q=Khang/);
    await expect(
      page.getByRole('row', { name: new RegExp(SEED.captain.name) }),
    ).toBeVisible();
    await expect(
      page.getByRole('row', { name: new RegExp(SEED.player.name) }),
    ).toHaveCount(0);
  });

  test('opens a player’s progression from their row', async ({ page }) => {
    await page
      .getByRole('row', { name: new RegExp(SEED.captain.name) })
      .click();

    await expect(page).toHaveURL(
      `/periodic-testing/progression/${SEED.captain.id}`,
    );
    await expect(page.getByText(SEED.captain.name).first()).toBeVisible();
  });
});

test.describe('Player progression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/periodic-testing/progression/${SEED.captain.id}`);
  });

  test('shows a card per test with its direction, and the test history', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Player Progression/);
    await expect(page.getByText('(lower is better)').first()).toBeVisible();
    await expect(page.getByText('(higher is better)').first()).toBeVisible();
    await expect(page.getByText('Test History')).toBeVisible();
    await testTableHeaders(page, ['Date', 'Test', 'Result', 'Team Avg']);
  });

  test('lists the seeded coaching note with its goal', async ({ page }) => {
    await expect(
      page.getByText('Work on the first step; add reaction drills.'),
    ).toBeVisible();
    await expect(page.getByText(/^Goal: 3\.3/)).toBeVisible();
    await expect(page.getByText(new RegExp(SEED.coach.name))).toBeVisible();
  });

  test('goes back to the progression list', async ({ page }) => {
    await page.getByRole('link', { name: 'Progression' }).first().click();
    await expect(page).toHaveURL(/\/periodic-testing\/progression$/);
  });
});

test.describe.serial('Coaching notes', () => {
  const observation = `E2E observation ${Date.now()}`;
  const edited = `${observation} (edited)`;

  test.beforeEach(async ({ page }) => {
    await page.goto(`/periodic-testing/progression/${SEED.captain.id}`);
  });

  test('adds a note with a focus area and a goal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Note' }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Add Note' }),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();

    await pickOption(
      page,
      dialog.getByRole('combobox', { name: 'Focus Area' }),
      'Standing long jump',
    );
    await dialog.getByLabel('Observation').fill(observation);
    await dialog.getByLabel(/Goal for Next Test/).fill('2.3');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expectToast(page, 'Note added successfully');
    await expect(page.getByText(observation)).toBeVisible();
  });

  test('edits the note', async ({ page }) => {
    await noteCard(page, observation)
      .getByRole('button', { name: 'Edit note' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Edit Note' }),
    ).toBeVisible();
    await expect(dialog.getByLabel('Observation')).toHaveValue(observation);

    await dialog.getByLabel('Observation').fill(edited);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expectToast(page, 'Note updated successfully');
    await expect(page.getByText(edited)).toBeVisible();
  });

  test('removes the note', async ({ page }) => {
    await noteCard(page, edited)
      .getByRole('button', { name: 'Remove note' })
      .click();

    await expectToast(page, 'Note removed successfully');
    await expect(page.getByText(edited)).not.toBeVisible();
  });
});
