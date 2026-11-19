import { expect, type Page, test } from '@playwright/test';

import { SEED } from '../setup/accounts';
import { pickOption, uniqueName } from '../setup/helpers';

const dialog = (page: Page) => page.getByRole('dialog');

/** Pick an option in a Chakra select inside the open dialog. */
async function choose(page: Page, label: string, option: string) {
  await pickOption(
    page,
    dialog(page).getByRole('combobox', { name: label }),
    option,
  );
}

/** The timeline card holding `title`; its edit/delete buttons live inside it. */
const card = (page: Page, title: string) =>
  page
    .locator('.group')
    .filter({ has: page.getByText(title, { exact: true }) });

test.describe('Achievements page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/achievements');
  });

  test('has the page title and hero', async ({ page }) => {
    await expect(page).toHaveTitle(/Achievements/);
    await expect(
      page.getByRole('heading', { name: 'Our Journey. Our Pride.' }),
    ).toBeVisible();
  });

  test('lists the seeded honors, typed ones by their translated type', async ({
    page,
  }) => {
    // Typed honors store no title: the type label stands in.
    await expect(page.getByText('Runner-up', { exact: true })).toBeVisible();
    await expect(page.getByText('3rd Place', { exact: true })).toBeVisible();
    await expect(page.getByText('MVP', { exact: true })).toBeVisible();
    // Individual honors read under the player's name.
    await expect(page.getByText(new RegExp(SEED.captain.name))).toBeVisible();
    // A custom honor keeps its own title and shows as standalone.
    await expect(page.getByText('Fair Play Award')).toBeVisible();
    await expect(page.getByText('Standalone honor')).toBeVisible();
  });
});

test.describe.serial('Record, edit and delete a custom honor', () => {
  const title = uniqueName('E2E Spirit Award');

  test('requires a title only for a custom honor', async ({ page }) => {
    await page.goto('/achievements');
    await page.getByRole('button', { name: 'Record' }).click();

    await expect(
      dialog(page).getByRole('heading', { name: 'Add Achievement' }),
    ).toBeVisible();
    const save = dialog(page).getByRole('button', { name: 'Add' });

    // Champion (the default) is valid untitled: the type name is shown.
    await expect(dialog(page).getByPlaceholder('Champion')).toHaveValue('');
    await expect(save).toBeEnabled();

    await choose(page, 'Type', 'Custom');
    await expect(
      dialog(page).getByPlaceholder('Fair Play Award'),
    ).toBeVisible();
    await expect(save).toBeDisabled();
  });

  test('records a standalone custom honor', async ({ page }) => {
    await page.goto('/achievements');
    await page.getByRole('button', { name: 'Record' }).click();

    await choose(page, 'Type', 'Custom');
    await dialog(page).getByPlaceholder('Fair Play Award').fill(title);
    await dialog(page)
      .getByPlaceholder('Comment...')
      .fill('Voted by the E2E crowd.');
    await dialog(page).getByRole('button', { name: 'Add' }).click();

    await expect(
      page.getByText('Recorded achievement successfully'),
    ).toBeVisible();
    await expect(card(page, title)).toBeVisible();
  });

  test('edits the honor with its values prefilled', async ({ page }) => {
    await page.goto('/achievements');
    await card(page, title)
      .getByRole('button', { name: 'Edit achievement' })
      .click();

    await expect(
      dialog(page).getByRole('heading', { name: 'Update Achievement' }),
    ).toBeVisible();
    await expect(dialog(page).getByPlaceholder('Fair Play Award')).toHaveValue(
      title,
    );
    await expect(dialog(page).getByPlaceholder('Comment...')).toHaveValue(
      'Voted by the E2E crowd.',
    );

    const description = dialog(page).getByPlaceholder('Comment...');
    await description.fill('Edited by the E2E crowd.');
    await dialog(page).getByRole('button', { name: 'Update' }).click();

    await expect(
      page.getByText('Updated achievement successfully'),
    ).toBeVisible();
    await expect(dialog(page)).not.toBeVisible();

    // Reopen: the edit was stored.
    await card(page, title)
      .getByRole('button', { name: 'Edit achievement' })
      .click();
    await expect(dialog(page).getByPlaceholder('Comment...')).toHaveValue(
      'Edited by the E2E crowd.',
    );
  });

  test('deletes the honor', async ({ page }) => {
    await page.goto('/achievements');
    await card(page, title)
      .getByRole('button', { name: 'Delete achievement' })
      .click();

    await expect(
      page.getByText('Deleted achievement successfully'),
    ).toBeVisible();
    await expect(page.getByText(title)).not.toBeVisible();
  });
});

test.describe('Record from a league', () => {
  test('opens the dialog for an ended league and needs a player for an individual honor', async ({
    page,
  }) => {
    await page.goto('/leagues');
    // Seeded with only a Runner-up honor, so a Top Scorer is still free.
    await page
      .getByRole('row', { name: /District 11 Amateur Cup/ })
      .getByRole('link', { name: 'Record achievement' })
      .click();

    await expect(page).toHaveURL(/\/achievements\?record=/);
    await expect(
      dialog(page).getByRole('heading', { name: 'Add Achievement' }),
    ).toBeVisible();
    // The league fixes the year.
    await expect(
      dialog(page).getByText('Derived from the selected league.'),
    ).toBeVisible();

    await choose(page, 'Type', 'Top Scorer');
    const save = dialog(page).getByRole('button', { name: 'Add' });
    await expect(save).toBeDisabled();

    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Select players' }),
      new RegExp(SEED.player.name),
    );
    await expect(save).toBeEnabled();

    await save.click();
    await expect(
      page.getByText('Recorded achievement successfully'),
    ).toBeVisible();
    await expect(page.getByText('Top Scorer').first()).toBeVisible();
  });
});
