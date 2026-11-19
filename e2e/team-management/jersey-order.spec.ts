import { expect, type Page, test } from '@playwright/test';
import { Workbook } from 'exceljs';

// Read-only: nothing here saves a profile or signs in to Google, so the dev
// database and the user's Drive stay untouched.

const YEAR = new Date().getFullYear();

const openJerseyForm = async (page: Page) => {
  await page.goto('/roster');
  await page.getByRole('button', { name: 'Jersey form' }).click();
  const dialog = page.getByRole('dialog', { name: 'Jersey order form' });
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe('Roster - Jersey order form', () => {
  test('opens with provider, default price and export actions', async ({
    page,
  }) => {
    const dialog = await openJerseyForm(page);

    await expect(
      dialog.getByRole('combobox', { name: 'Uniform provider' }),
    ).toHaveText(/Hoops/);
    await expect(
      dialog.getByRole('spinbutton', {
        name: 'Default price per jersey (VND)',
      }),
    ).toHaveValue('360,000');
    await expect(
      dialog.getByRole('button', { name: 'Download' }),
    ).toBeVisible();
  });

  test('lists the catch-all provider as "Others"', async ({ page }) => {
    const dialog = await openJerseyForm(page);

    await dialog.getByRole('combobox', { name: 'Uniform provider' }).click();

    await expect(page.getByRole('option', { name: 'Others' })).toBeVisible();
  });

  test('downloads the order workbook', async ({ page }) => {
    const dialog = await openJerseyForm(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'Download' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(`[Rovers] Đặt đồ - ${YEAR}.xlsx`);

    const workbook = new Workbook();
    await workbook.xlsx.readFile(await download.path());

    expect(workbook.worksheets.map(({ name }) => name)).toEqual([
      'Đội',
      'Ngoài đội',
      'Bảng size',
      'Mẫu đồ',
    ]);

    const team = workbook.getWorksheet('Đội')!;
    expect(String(team.getCell('A1').value)).toContain('trùng');
    expect(team.getRow(2).values).toEqual(
      expect.arrayContaining([
        'STT',
        'Tên',
        'Số áo',
        'Tên trên áo',
        'Size áo',
        'Size quần',
        'Loại quần',
        'Đã thu tiền',
        'Note',
      ]),
    );
    // No per-row price: the summary multiplies the fixed price.
    expect(team.getRow(2).values).not.toContain('Đơn giá mặc định');
    expect(team.getCell('K2').value).toBe('Đơn giá');
    expect(team.getCell('L2').value).toBe(360_000);

    // Active players are prefilled and start unpaid.
    expect(team.getCell('B3').value).toBeTruthy();
    expect(team.getCell('H3').value).toBe(false);
    expect(team.getCell('E3').dataValidation.formulae?.[0]).toContain('XS');
    expect(team.getCell('H3').dataValidation.formulae).toEqual([
      '"TRUE,FALSE"',
    ]);

    // Hoops charts are embedded under their titles.
    const sizes = workbook.getWorksheet('Bảng size')!;
    expect(sizes.getCell('A3').value).toBe('SIZE ĐỒ');
    expect(sizes.getImages().length).toBe(3);
  });

  test('opens Google sign-in in a new tab for Google Sheets', async ({
    page,
  }) => {
    const dialog = await openJerseyForm(page);
    const sheets = dialog.getByRole('button', {
      name: /Open in Google Sheets|Create new/,
    });
    test.skip(
      !(await sheets.isVisible()),
      'GOOGLE_CLIENT_ID is not configured',
    );

    // Stop at Google: no account is signed in here.
    await page
      .context()
      .route('https://accounts.google.com/**', (route) =>
        route.fulfill({ status: 200, body: 'google' }),
      );
    const [tab] = await Promise.all([
      page.context().waitForEvent('page'),
      sheets.click(),
    ]);

    const url = new URL(tab.url());
    expect(url.hostname).toBe('accounts.google.com');
    expect(url.searchParams.get('scope')).toBe(
      'https://www.googleapis.com/auth/drive.file',
    );
    expect(url.searchParams.get('redirect_uri')).toMatch(/\/google-callback$/);
    await tab.close();
  });

  test('the Google callback page explains when opened directly', async ({
    page,
  }) => {
    await page.goto('/google-callback');

    await expect(
      page.getByText(
        'Could not create the Google Sheet. You can close this tab.',
      ),
    ).toBeVisible();
  });
});

test.describe('Profile - Jersey details', () => {
  test('players edit jersey name and sizes on the Team tab', async ({
    page,
  }) => {
    // First player row on the roster: the admin can edit any member.
    await page.goto('/roster?role=player');
    // The admin's "View profile" link navigates without waiting for hydration.
    await page
      .getByRole('row')
      .nth(1)
      .getByRole('link', { name: 'View profile' })
      .click();
    await page.waitForURL(/\/profile\//);

    await page.getByRole('tab', { name: 'Team' }).click();

    // Edit mode shows the inputs; cancel so nothing is saved.
    const card = page.locator('form', { hasText: 'Team Information' });
    await card.getByRole('button', { name: 'Edit' }).click();
    await expect(card.getByText('Jersey Name')).toBeVisible();
    const shirt = card.getByRole('combobox', { name: 'Shirt Size' });
    await expect(shirt).toBeVisible();
    await expect(
      card.getByRole('combobox', { name: 'Short Size' }),
    ).toBeVisible();
    await expect(
      card.getByRole('combobox', { name: 'Short Type' }),
    ).toBeVisible();

    await shirt.click();
    await expect(page.getByRole('option', { name: '2XL' })).toBeVisible();
    await page.keyboard.press('Escape');
    await card.getByRole('button', { name: 'Close' }).click();
  });
});
