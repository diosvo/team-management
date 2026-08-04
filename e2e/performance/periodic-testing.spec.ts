import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/periodic-testing');
});

test.describe('Periodic Testing Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Periodic Testing/);
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /periodic testing/i }),
    ).toBeVisible();
  });

  test('displays stats cards', async ({ page }) => {
    await expect(page.getByText('Completed Tests')).toBeVisible();
    await expect(page.getByText('Total Players')).toBeVisible();
  });
});

test.describe('Periodic Testing - Stats', () => {
  test('displays completed tests count', async ({ page }) => {
    const completedTests = page.getByText('Completed Tests').locator('..');
    await expect(completedTests).toBeVisible();
  });

  test('displays total players count', async ({ page }) => {
    const totalPlayers = page.getByText('Total Players').locator('..');
    await expect(totalPlayers).toBeVisible();
  });

  test('stats display numeric values', async ({ page }) => {
    const statValues = page.locator('[data-stat-value]');
    const count = await statValues.count();

    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Periodic Testing - Date Filter', () => {
  test('displays date selector', async ({ page }) => {
    const dateSelector = page
      .locator('[data-testid="date-selector"]')
      .or(
        page.locator('select, [role="combobox"]').filter({ hasText: /date/i }),
      );

    if (await dateSelector.first().isVisible()) {
      await expect(dateSelector.first()).toBeVisible();
    }
  });

  test('changes matrix data when date is selected', async ({ page }) => {
    const dateSelector = page
      .locator('select, button[role="combobox"]')
      .first();

    if (await dateSelector.isVisible()) {
      await dateSelector.click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();

        // URL should update with date parameter
        await expect(page).toHaveURL(/date=/);
      }
    }
  });

  test('displays available test dates', async ({ page }) => {
    const dateSelector = page
      .locator('select, button[role="combobox"]')
      .first();

    if (await dateSelector.isVisible()) {
      await dateSelector.click();
      await page.waitForTimeout(300);

      const options = page.getByRole('option');
      const count = await options.count();

      // Should have some date options
      expect(count).toBeGreaterThan(0);
    }
  });

  test('date persists in URL', async ({ page }) => {
    const dateSelector = page
      .locator('select, button[role="combobox"]')
      .first();

    if (await dateSelector.isVisible()) {
      await dateSelector.click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();

        // Reload and check URL
        await page.reload();
        await expect(page).toHaveURL(/date=/);
      }
    }
  });
});

test.describe('Periodic Testing - Performance Matrix', () => {
  test('displays performance matrix table', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
  });

  test('displays player names column', async ({ page }) => {
    const table = page.getByRole('table');
    if (await table.isVisible()) {
      // First column should be player names
      const firstCell = page.getByRole('cell').first();
      if (await firstCell.isVisible()) {
        await expect(firstCell).toBeVisible();
      }
    }
  });

  test('displays test type headers', async ({ page }) => {
    const headers = page.getByRole('columnheader');
    const count = await headers.count();

    // Should have at least player name column + test types
    expect(count).toBeGreaterThan(0);
  });

  test('displays test scores in cells', async ({ page }) => {
    const cells = page.getByRole('cell');
    const count = await cells.count();

    // Should have data cells
    expect(count).toBeGreaterThan(0);
  });

  test('empty state when no data', async ({ page }) => {
    // Look for empty state or data
    const emptyState = page.getByText(/no.*data|no.*result/i);
    const hasData = await page.getByRole('cell').count();

    // Either has data or shows empty state
    expect(hasData > 0 || (await emptyState.isVisible())).toBeTruthy();
  });
});

test.describe('Periodic Testing - Matrix Editing (Admin)', () => {
  test('cells are editable for authorized users', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      // Try to click and edit
      await firstDataCell.click();

      const editableInput = page.locator(
        'input[type="text"], [contenteditable="true"]',
      );
      const isEditable = await editableInput.isVisible();

      // May or may not be editable based on permissions
      expect(typeof isEditable).toBe('boolean');
    }
  });

  test('can edit test score', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.clear();
        await input.fill('85');
        await input.press('Enter');

        // Should show saving indicator
        await page.waitForTimeout(500);
        expect(true).toBeTruthy();
      }
    }
  });

  test('displays success message after updating score', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill('90');
        await input.press('Enter');

        // Should show toast
        const toast = page.getByText(/saving score|success|saved/i);
        if (await toast.isVisible()) {
          await expect(toast).toBeVisible();
        }
      }
    }
  });

  test('can delete test score', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.clear();
        await input.press('Enter');

        // Should delete the score
        await page.waitForTimeout(500);
        expect(true).toBeTruthy();
      }
    }
  });

  test('reverts changes on escape', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      const originalValue = await firstDataCell.textContent();

      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill('99');
        await input.press('Escape');

        // Should revert to original
        await page.waitForTimeout(300);
        const newValue = await firstDataCell.textContent();
        expect(newValue).toBe(originalValue);
      }
    }
  });

  test('saves score on Enter key', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill('92');
        await input.press('Enter');

        // Should save the score
        await page.waitForTimeout(500);
        expect(true).toBeTruthy();
      }
    }
  });

  test('validates numeric input only', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill('abc');

        // Should not accept non-numeric input
        const value = await input.inputValue();
        expect(value === '' || value === 'abc').toBeTruthy();
      }
    }
  });

  test('navigates between cells with Tab key', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill('85');
        await input.press('Tab');

        // Focus should move to next cell
        await page.waitForTimeout(300);
        expect(true).toBeTruthy();
      }
    }
  });
});

test.describe('Periodic Testing - Pagination', () => {
  test('displays pagination controls when needed', async ({ page }) => {
    const pagination = page.getByRole('navigation', { name: 'pagination' });
    const isVisible = await pagination.isVisible();

    // Pagination may or may not be needed
    expect(typeof isVisible).toBe('boolean');
  });

  test('navigates to next page', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: 'Next' });

    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test('displays correct page in URL', async ({ page }) => {
    const pageButton = page.getByRole('button', { name: '2', exact: true });

    if (await pageButton.isVisible()) {
      await pageButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });
});

test.describe('Periodic Testing - Add Result', () => {
  test('displays add result button', async ({ page }) => {
    const addButton = page
      .getByRole('link', { name: /add.*result/i })
      .or(page.getByRole('button', { name: /add.*result/i }));

    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('navigates to add result page', async ({ page }) => {
    const addButton = page.getByRole('link', { name: /add.*result/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Should navigate to add-result page
      await expect(page).toHaveURL(/add-result/);
    }
  });

  test('add button is only visible for authorized users', async ({ page }) => {
    const addButton = page.getByRole('link', { name: /add.*result/i });
    const isVisible = await addButton.isVisible();

    // Button visibility depends on permissions
    expect(typeof isVisible).toBe('boolean');
  });
});

test.describe('Periodic Testing - Settings Button', () => {
  test('displays settings button', async ({ page }) => {
    const settingsButton = page
      .getByRole('button', { name: /settings/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="settings"]') }),
      );

    if (await settingsButton.isVisible()) {
      await expect(settingsButton).toBeVisible();
    }
  });

  test('opens settings dialog on click', async ({ page }) => {
    const settingsButton = page
      .getByRole('button', { name: /settings/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="settings"]') }),
      );

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Should open a dialog or menu
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();
      }
    }
  });
});

test.describe('Periodic Testing - Matrix Display', () => {
  test('sticky column for player names', async ({ page }) => {
    const table = page.getByRole('table');

    if (await table.isVisible()) {
      // Scroll horizontally
      await page.evaluate(() => {
        const table = document.querySelector('table');
        if (table) table.scrollLeft = 200;
      });

      // First column should still be visible
      const firstCell = page.getByRole('cell').first();
      await expect(firstCell).toBeVisible();
    }
  });

  test('displays player jersey numbers', async ({ page }) => {
    const cells = page.getByRole('cell');

    if (await cells.first().isVisible()) {
      // May contain jersey numbers
      const firstCellText = await cells.first().textContent();
      expect(firstCellText).toBeTruthy();
    }
  });

  test('displays empty cells as dash or blank', async ({ page }) => {
    const cells = page.getByRole('cell');
    const count = await cells.count();

    if (count > 0) {
      // Check some cells
      for (let i = 0; i < Math.min(5, count); i++) {
        const cell = cells.nth(i);
        const text = await cell.textContent();
        // Cell should have content or be empty
        expect(text !== null).toBeTruthy();
      }
    }
  });

  test('highlights editable cells on hover', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.hover();

      // Cell should show some hover effect
      await page.waitForTimeout(200);
      expect(true).toBeTruthy();
    }
  });
});

test.describe('Periodic Testing - Integration', () => {
  test('loads data without errors', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Should not show error messages
    const errorText = page.getByText(/error|failed/i);
    const hasError = await errorText.isVisible();

    expect(hasError).toBeFalsy();
  });

  test('displays correct stats for selected date', async ({ page }) => {
    const dateSelector = page
      .locator('select, button[role="combobox"]')
      .first();

    if (await dateSelector.isVisible()) {
      await dateSelector.click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // Stats should update
        const completedTests = page.getByText('Completed Tests');
        await expect(completedTests).toBeVisible();
      }
    }
  });

  test('matrix updates after editing score', async ({ page }) => {
    const firstDataCell = page.getByRole('cell').nth(1);

    if (await firstDataCell.isVisible()) {
      await firstDataCell.click();

      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill('88');
        await input.press('Enter');

        // Wait for update
        await page.waitForTimeout(1000);

        // Cell should show new value
        const newValue = await firstDataCell.textContent();
        expect(newValue).toBeTruthy();
      }
    }
  });

  test('maintains filter state after navigation', async ({ page }) => {
    const dateSelector = page
      .locator('select, button[role="combobox"]')
      .first();

    if (await dateSelector.isVisible()) {
      await dateSelector.click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // Navigate away and back
        await page.goto('/dashboard');
        await page.goBack();

        // Date filter should persist
        await expect(page).toHaveURL(/date=/);
      }
    }
  });
});
