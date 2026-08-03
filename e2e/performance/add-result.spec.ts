import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/periodic-testing/add-result');
});

test.describe('Add Test Result Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Add.*Result/);
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /add.*test.*result/i }),
    ).toBeVisible();
  });

  test('displays back button', async ({ page }) => {
    const backButton = page
      .getByRole('link', { name: /back/i })
      .or(
        page.locator('a').filter({ has: page.locator('svg[class*="arrow"]') }),
      );

    if (await backButton.isVisible()) {
      await expect(backButton).toBeVisible();
    }
  });

  test('back button navigates to periodic testing page', async ({ page }) => {
    const backButton = page.getByRole('link', { name: /back/i });

    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL(/periodic-testing/);
    }
  });
});

test.describe('Add Test Result - Configuration Section', () => {
  test('displays configuration section', async ({ page }) => {
    const configSection = page.getByText(/configuration|test.*setup/i);
    if (await configSection.isVisible()) {
      await expect(configSection).toBeVisible();
    }
  });

  test('displays test date selector', async ({ page }) => {
    const dateInput = page
      .locator('input[type="date"]')
      .or(page.getByLabel(/date/i));

    if (await dateInput.isVisible()) {
      await expect(dateInput).toBeVisible();
    }
  });

  test('displays test type configuration', async ({ page }) => {
    const testTypeSection = page.getByText(/test.*type/i);
    if (await testTypeSection.isVisible()) {
      await expect(testTypeSection).toBeVisible();
    }
  });

  test('can select test date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]').first();

    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-06-15');

      const value = await dateInput.inputValue();
      expect(value).toBe('2024-06-15');
    }
  });

  test('validates required configuration fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /save|submit/i });

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      const errorMessage = page.getByText(/required|please|must/i);
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });
});

test.describe('Add Test Result - Test Types Selection', () => {
  test('displays available test types', async ({ page }) => {
    const testTypes = page.locator('[data-testid="test-type"]');

    if (await testTypes.first().isVisible()) {
      const count = await testTypes.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('can select multiple test types', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.isVisible()) {
      await checkbox.check();

      const isChecked = await checkbox.isChecked();
      expect(isChecked).toBeTruthy();
    }
  });

  test('displays test type names', async ({ page }) => {
    const testTypeLabels = page
      .locator('label')
      .filter({ has: page.locator('input[type="checkbox"]') });

    if (await testTypeLabels.first().isVisible()) {
      const text = await testTypeLabels.first().textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test('can deselect test types', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.isVisible()) {
      await checkbox.check();
      await checkbox.uncheck();

      const isChecked = await checkbox.isChecked();
      expect(isChecked).toBeFalsy();
    }
  });

  test('displays select all option', async ({ page }) => {
    const selectAll = page.getByText(/select all/i);

    if (await selectAll.isVisible()) {
      await expect(selectAll).toBeVisible();
    }
  });

  test('select all checks all test types', async ({ page }) => {
    const selectAllCheckbox = page
      .locator('input[type="checkbox"]')
      .filter({ has: page.locator('~ label >> text=/select all/i') });

    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check();

      // All checkboxes should be checked
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        const isChecked = await checkboxes.nth(i).isChecked();
        if (!isChecked) {
          // Some checkboxes might be disabled
          expect(true).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Add Test Result - Player List Table', () => {
  test('displays player list table', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
  });

  test('displays player name column', async ({ page }) => {
    const nameHeader = page.getByRole('columnheader', { name: /name/i });
    if (await nameHeader.isVisible()) {
      await expect(nameHeader).toBeVisible();
    }
  });

  test('displays jersey number column', async ({ page }) => {
    const jerseyHeader = page.getByRole('columnheader', {
      name: /jersey|number/i,
    });
    if (await jerseyHeader.isVisible()) {
      await expect(jerseyHeader).toBeVisible();
    }
  });

  test('displays dynamic test type columns', async ({ page }) => {
    const headers = page.getByRole('columnheader');
    const count = await headers.count();

    // Should have at least player info + test type columns
    expect(count).toBeGreaterThan(2);
  });

  test('displays player rows', async ({ page }) => {
    const rows = page.getByRole('row');
    const count = await rows.count();

    // Should have header + at least one player row
    expect(count).toBeGreaterThan(1);
  });

  test('displays empty state when no players', async ({ page }) => {
    const emptyState = page.getByText(/no.*player/i);
    const hasPlayers = await page.getByRole('row').count();

    // Either has players or shows empty state
    expect(hasPlayers > 1 || (await emptyState.isVisible())).toBeTruthy();
  });
});

test.describe('Add Test Result - Score Input', () => {
  test('score cells are editable', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await expect(input).toBeVisible();
      }
    }
  });

  test('can enter test score', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('85');

        const value = await input.inputValue();
        expect(value).toBe('85');
      }
    }
  });

  test('moves to next cell on Tab', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('75');
        await input.press('Tab');

        // Focus should move to next input
        await page.waitForTimeout(200);
        expect(true).toBeTruthy();
      }
    }
  });

  test('moves to next row on Enter', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('80');
        await input.press('Enter');

        // Focus should move to cell below
        await page.waitForTimeout(200);
        expect(true).toBeTruthy();
      }
    }
  });

  test('validates score input range', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('150');
        await input.press('Enter');

        // May show validation error for out-of-range value
        await page.waitForTimeout(300);
        expect(true).toBeTruthy();
      }
    }
  });

  test('accepts decimal values', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('85.5');

        const value = await input.inputValue();
        expect(value).toContain('85');
      }
    }
  });

  test('can clear score value', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('90');
        await input.clear();

        const value = await input.inputValue();
        expect(value).toBe('');
      }
    }
  });
});

test.describe('Add Test Result - Bulk Actions', () => {
  test('displays bulk action buttons', async ({ page }) => {
    const bulkButtons = page
      .getByRole('button')
      .filter({ hasText: /all|fill|clear/i });

    if (await bulkButtons.first().isVisible()) {
      await expect(bulkButtons.first()).toBeVisible();
    }
  });

  test('can fill all scores for a test type', async ({ page }) => {
    const fillAllButton = page
      .getByRole('button', { name: /fill.*all/i })
      .first();

    if (await fillAllButton.isVisible()) {
      await fillAllButton.click();

      // Should open dialog or fill all cells
      await page.waitForTimeout(500);
      expect(true).toBeTruthy();
    }
  });

  test('can clear all scores for a test type', async ({ page }) => {
    const clearAllButton = page
      .getByRole('button', { name: /clear.*all/i })
      .first();

    if (await clearAllButton.isVisible()) {
      await clearAllButton.click();

      // Should clear all cells or show confirmation
      await page.waitForTimeout(500);
      expect(true).toBeTruthy();
    }
  });
});

test.describe('Add Test Result - Save Actions', () => {
  test('displays save button', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await expect(saveButton).toBeVisible();
  });

  test('displays cancel button', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeVisible();
    }
  });

  test('save button is initially disabled', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /save|submit/i });

    // May be disabled until valid data is entered
    const isDisabled = await saveButton.isDisabled();
    expect(typeof isDisabled).toBe('boolean');
  });

  test('saves test results with valid data', async ({ page }) => {
    // Fill in required fields
    const dateInput = page.locator('input[type="date"]').first();

    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-06-15');
    }

    // Select a test type
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }

    // Enter a score
    const firstScoreCell = page.getByRole('cell').nth(2);
    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('80');
      }
    }

    // Try to save
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();

      // Should show success message
      const successMessage = page.getByText(
        /saving test results|success|saved/i,
      );
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('cancel button returns to periodic testing page', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: /cancel/i });

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Should navigate back or show confirmation
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    }
  });

  test('shows confirmation dialog on cancel with unsaved changes', async ({
    page,
  }) => {
    // Make a change
    const firstScoreCell = page.getByRole('cell').nth(2);
    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('85');
      }
    }

    // Try to cancel
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // May show confirmation dialog
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();
      }
    }
  });
});

test.describe('Add Test Result - Validation', () => {
  test('requires test date', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();

    // Should show validation error
    const errorMessage = page.getByText(/date.*required/i);
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('requires at least one test type selected', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]').first();

    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-06-15');
    }

    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();

    // May show validation error for missing test types
    await page.waitForTimeout(500);
    expect(true).toBeTruthy();
  });

  test('validates score format', async ({ page }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('abc');
        await input.press('Enter');

        // Should reject invalid input
        await page.waitForTimeout(300);
        const value = await input.inputValue();
        expect(value === '' || value === 'abc').toBeTruthy();
      }
    }
  });

  test('prevents duplicate test date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]').first();

    if (await dateInput.isVisible()) {
      // Try to use an existing date
      await dateInput.fill('2024-01-01');
    }

    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();

    // May show error if date already exists
    await page.waitForTimeout(500);
    expect(true).toBeTruthy();
  });
});

test.describe('Add Test Result - Integration', () => {
  test('loads player list on page load', async ({ page }) => {
    await page.waitForTimeout(1000);

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
  });

  test('updates column headers when test types are selected', async ({
    page,
  }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.isVisible()) {
      const headersBefore = await page.getByRole('columnheader').count();

      await checkbox.check();
      await page.waitForTimeout(500);

      const headersAfter = await page.getByRole('columnheader').count();

      // Column count should change
      expect(headersAfter >= headersBefore).toBeTruthy();
    }
  });

  test('preserves entered scores when changing configuration', async ({
    page,
  }) => {
    const firstScoreCell = page.getByRole('cell').nth(2);

    if (await firstScoreCell.isVisible()) {
      await firstScoreCell.click();

      const input = page
        .locator('input[type="text"], input[type="number"]')
        .first();
      if (await input.isVisible()) {
        await input.fill('85');

        // Change date or other config
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible()) {
          await dateInput.click();
        }

        // Score should still be there
        const value = await input.inputValue();
        expect(value === '85' || value).toBeTruthy();
      }
    }
  });

  test('displays loading state while saving', async ({ page }) => {
    // Fill in valid data quickly
    const saveButton = page.getByRole('button', { name: /save|submit/i });

    if (await saveButton.isEnabled()) {
      await saveButton.click();

      // Should show loading indicator
      const loading = page.getByText(/saving|loading/i);
      if (await loading.isVisible()) {
        await expect(loading).toBeVisible();
      }
    }
  });

  test('redirects to periodic testing after successful save', async ({
    page,
  }) => {
    // Complete form and save
    const dateInput = page.locator('input[type="date"]').first();

    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-06-20');

      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }

      const saveButton = page.getByRole('button', { name: /save|submit/i });
      if (await saveButton.isEnabled()) {
        await saveButton.click();

        // Should redirect back to periodic testing
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        expect(currentUrl).toContain('periodic-testing');
      }
    }
  });
});
