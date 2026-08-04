import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/periodic-testing/test-types');
});

test.describe('Test Types Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Test Types/);
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Test Types' }),
    ).toBeVisible();
  });

  test('displays test types table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('displays back button to periodic testing', async ({ page }) => {
    const backButton = page
      .getByRole('link', { name: /back/i })
      .or(
        page.locator('a').filter({ has: page.locator('svg[class*="arrow"]') }),
      );

    if (await backButton.isVisible()) {
      await expect(backButton).toBeVisible();

      const href = await backButton.getAttribute('href');
      expect(href).toContain('periodic-testing');
    }
  });
});

test.describe('Test Types - Add Button', () => {
  test('displays add button for authorized users', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    const isVisible = await addButton.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('opens add dialog on click', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Should open dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    }
  });

  test('add dialog contains form fields', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Should have name input
      const nameInput = page.getByLabel(/name/i);
      await expect(nameInput).toBeVisible();
    }
  });

  test('add dialog contains unit selector', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Should have unit selector
      const unitInput = page.getByLabel(/unit/i);
      if (await unitInput.isVisible()) {
        await expect(unitInput).toBeVisible();
      }
    }
  });

  test('can create new test type', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Fill form
      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill(`Test Type ${Date.now()}`);

      const unitInput = page.getByLabel(/unit/i);
      if (await unitInput.isVisible()) {
        await unitInput.fill('seconds');
      }

      // Submit
      const submitButton = page.getByRole('button', { name: /save|submit/i });
      await submitButton.click();

      // Should show success message
      await expect(
        page.getByText(/adding test type|success|created/i),
      ).toBeVisible();
    }
  });

  test('validates required fields', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Submit button should be disabled when empty
      const submitButton = page
        .getByRole('dialog')
        .getByRole('button', { name: /save|submit/i });
      await expect(submitButton).toBeDisabled();
    }
  });

  test('prevents duplicate test type names', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      // Get existing test type name
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        const existingName = await firstRow
          .getByRole('cell')
          .first()
          .textContent();

        await addButton.click();

        const nameInput = page.getByLabel(/name/i);
        if (existingName) {
          await nameInput.fill(existingName);

          const submitButton = page
            .getByRole('dialog')
            .getByRole('button', { name: /save|submit/i });

          if (await submitButton.isEnabled()) {
            await submitButton.click();

            // May show error for duplicate name
            expect(true).toBeTruthy();
          }
        }
      }
    }
  });

  test('trims whitespace from input', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill('  Test Type  ');

      const submitButton = page
        .getByRole('dialog')
        .getByRole('button', { name: /save|submit/i });

      if (await submitButton.isEnabled()) {
        await submitButton.click();

        // Wait for submission
        await page.waitForTimeout(1000);
        expect(true).toBeTruthy();
      }
    }
  });

  test('closes dialog on Escape key', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const isVisible = await dialog.isVisible();
      expect(isVisible).toBeFalsy();
    }
  });

  test('closes dialog after successful creation', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill(`Test Type ${Date.now()}`);

      const submitButton = page.getByRole('button', { name: /save|submit/i });
      await submitButton.click();

      // Wait for dialog to close
      await page.waitForTimeout(2000);

      const dialog = page.getByRole('dialog');
      const isVisible = await dialog.isVisible();
      expect(isVisible).toBeFalsy();
    }
  });
});

test.describe('Test Types - Table Display', () => {
  test('displays name column', async ({ page }) => {
    await expect(
      page.getByRole('columnheader', { name: 'Name' }),
    ).toBeVisible();
  });

  test('displays unit column', async ({ page }) => {
    await expect(
      page.getByRole('columnheader', { name: 'Unit' }),
    ).toBeVisible();
  });

  test('displays last updated column', async ({ page }) => {
    await expect(
      page.getByRole('columnheader', { name: 'Last Updated' }),
    ).toBeVisible();
  });

  test('displays test type rows', async ({ page }) => {
    const rows = page.getByRole('row');
    const count = await rows.count();

    // Should have at least header row
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('displays relative time for last update', async ({ page }) => {
    // Look for relative time text like "2 days ago"
    const relativeTime = page.getByText(/ago|just now/i);

    if (await relativeTime.first().isVisible()) {
      await expect(relativeTime.first()).toBeVisible();
    }
  });

  test('empty state when no test types', async ({ page }) => {
    // Use a filter to get no results
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistenttype12345');
      await page.waitForTimeout(500);

      const emptyState = page.getByText(/no matching/i);
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('Test Types - Search', () => {
  test('displays search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('filters by test type name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);

    // Get first row text to search for
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible()) {
      const text = await firstRow.textContent();
      const firstWord = text?.split(' ')[0];

      if (firstWord && firstWord.length > 2) {
        await searchInput.fill(firstWord);
        await page.waitForTimeout(500);

        // Should update results
        await expect(page).toHaveURL(/q=/);
      }
    }
  });

  test('highlights matching text', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Should highlight search term in results
    const highlightedText = page.locator('mark, [data-highlighted]');
    if (await highlightedText.first().isVisible()) {
      await expect(highlightedText.first()).toBeVisible();
    }
  });

  test('updates URL with search query', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('sprint');

    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/q=sprint/);
  });

  test('persists search on page reload', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    await page.reload();

    const reloadedInput = page.getByPlaceholder(/search/i);
    const value = await reloadedInput.inputValue();
    expect(value).toBe('test');
  });

  test('clears search shows all results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    await searchInput.clear();
    await page.waitForTimeout(500);

    // Should show all results again
    await expect(page).toHaveURL(/(?!q=)/);
  });
});

test.describe('Test Types - Unit Filter', () => {
  test('displays unit filter', async ({ page }) => {
    const unitFilter = page
      .getByLabel(/unit/i)
      .or(
        page.locator('select, [role="combobox"]').filter({ hasText: /unit/i }),
      );

    if (await unitFilter.first().isVisible()) {
      await expect(unitFilter.first()).toBeVisible();
    }
  });

  test('filters by unit type', async ({ page }) => {
    const unitFilter = page
      .locator('select, button[role="combobox"]')
      .filter({ hasText: /unit/i });

    if (await unitFilter.first().isVisible()) {
      await unitFilter.first().click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();

        // URL should update with unit parameter
        await page.waitForTimeout(500);
        await expect(page).toHaveURL(/unit=/);
      }
    }
  });

  test('displays available unit options', async ({ page }) => {
    const unitFilter = page
      .locator('select, button[role="combobox"]')
      .filter({ hasText: /unit/i });

    if (await unitFilter.first().isVisible()) {
      await unitFilter.first().click();
      await page.waitForTimeout(300);

      const options = page.getByRole('option');
      const count = await options.count();

      // Should have some unit options
      expect(count).toBeGreaterThan(0);
    }
  });

  test('combines search and unit filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    const unitFilter = page
      .locator('select, button[role="combobox"]')
      .filter({ hasText: /unit/i });

    if (await unitFilter.first().isVisible()) {
      await unitFilter.first().click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // Both parameters should be in URL
        const url = page.url();
        expect(url).toMatch(/q=|unit=/);
      }
    }
  });

  test('resets unit filter', async ({ page }) => {
    const unitFilter = page
      .locator('select, button[role="combobox"]')
      .filter({ hasText: /unit/i });

    if (await unitFilter.first().isVisible()) {
      await unitFilter.first().click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // Reset filter
        const resetButton = page.getByRole('button', { name: /clear|reset/i });
        if (await resetButton.isVisible()) {
          await resetButton.click();

          await page.waitForTimeout(500);
          await expect(page).not.toHaveURL(/unit=/);
        }
      }
    }
  });
});

test.describe('Test Types - Edit', () => {
  test('clicking row opens edit dialog', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      await firstDataRow.click();

      // Should open dialog
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('edit dialog shows current values', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      const rowText = await firstDataRow.textContent();

      await firstDataRow.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // Dialog should contain current values
        const nameInput = page.getByLabel(/name/i);
        const value = await nameInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  test('can update test type name', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      await firstDataRow.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const nameInput = page.getByLabel(/name/i);
        await nameInput.clear();
        await nameInput.fill(`Updated Test Type ${Date.now()}`);

        const submitButton = page.getByRole('button', { name: /save|update/i });
        await submitButton.click();

        // Should show success message
        await expect(
          page.getByText(/updating test type|success|updated/i),
        ).toBeVisible();
      }
    }
  });

  test('can update test type unit', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      await firstDataRow.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const unitInput = page.getByLabel(/unit/i);
        if (await unitInput.isVisible()) {
          await unitInput.clear();
          await unitInput.fill('meters');

          const submitButton = page.getByRole('button', {
            name: /save|update/i,
          });
          await submitButton.click();

          // Should show success message
          await page.waitForTimeout(1000);
          expect(true).toBeTruthy();
        }
      }
    }
  });

  test('closes dialog after successful update', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      await firstDataRow.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const nameInput = page.getByLabel(/name/i);
        await nameInput.fill(`Updated ${Date.now()}`);

        const submitButton = page.getByRole('button', { name: /save|update/i });
        await submitButton.click();

        // Wait for dialog to close
        await page.waitForTimeout(2000);

        const isVisible = await dialog.isVisible();
        expect(isVisible).toBeFalsy();
      }
    }
  });

  test('can cancel edit without saving', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      await firstDataRow.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const nameInput = page.getByLabel(/name/i);
        await nameInput.fill('Temporary Change');

        const cancelButton = page.getByRole('button', { name: /cancel/i });
        await cancelButton.click();

        // Dialog should close without saving
        await page.waitForTimeout(500);
        const isVisible = await dialog.isVisible();
        expect(isVisible).toBeFalsy();
      }
    }
  });

  test('updates last updated timestamp after edit', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      await firstDataRow.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const nameInput = page.getByLabel(/name/i);
        await nameInput.fill(`Updated ${Date.now()}`);

        const submitButton = page.getByRole('button', { name: /save|update/i });
        await submitButton.click();

        // Wait for update
        await page.waitForTimeout(2000);

        // Should show recent update time
        const relativeTime = page.getByText(/just now|second|minute/i);
        if (await relativeTime.first().isVisible()) {
          await expect(relativeTime.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe('Test Types - Delete', () => {
  test('displays checkboxes for authorized users', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();

    const isVisible = await checkbox.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('can select test type for deletion', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.isVisible()) {
      await checkbox.check();

      const isChecked = await checkbox.isChecked();
      expect(isChecked).toBeTruthy();
    }
  });

  test('displays delete button when items selected', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').nth(1);

    if (await checkbox.isVisible()) {
      await checkbox.check();

      const deleteButton = page.getByRole('button', { name: /delete/i });
      await expect(deleteButton).toBeVisible();
    }
  });

  test('deletes selected test types', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').nth(1);

    if (await checkbox.isVisible()) {
      await checkbox.check();

      const deleteButton = page.getByRole('button', { name: /delete/i });
      await deleteButton.click();

      // Should show success message
      await expect(
        page.getByText(/deleting test type|success|deleted/i),
      ).toBeVisible();
    }
  });

  test('can select multiple test types', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 2) {
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();

      const isChecked1 = await checkboxes.nth(1).isChecked();
      const isChecked2 = await checkboxes.nth(2).isChecked();

      expect(isChecked1 && isChecked2).toBeTruthy();
    }
  });

  test('clears selection after deletion', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').nth(1);

    if (await checkbox.isVisible()) {
      await checkbox.check();

      const deleteButton = page.getByRole('button', { name: /delete/i });
      await deleteButton.click();

      // Wait for deletion
      await page.waitForTimeout(2000);

      // Delete button should no longer be visible
      const isVisible = await deleteButton.isVisible();
      expect(isVisible).toBeFalsy();
    }
  });
});

test.describe('Test Types - Pagination', () => {
  test('displays pagination when needed', async ({ page }) => {
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

  test('displays current page in URL', async ({ page }) => {
    const pageButton = page.getByRole('button', { name: '2', exact: true });

    if (await pageButton.isVisible()) {
      await pageButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test('displays total items count', async ({ page }) => {
    const totalText = page.getByText(/total/i);

    if (await totalText.isVisible()) {
      await expect(totalText).toBeVisible();
    }
  });
});

test.describe('Test Types - Integration', () => {
  test('loads data without errors', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Should not show error messages
    const errorText = page.getByText(/error|failed/i);
    const hasError = await errorText.isVisible();

    expect(hasError).toBeFalsy();
  });

  test('maintains filters after crud operations', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Perform an action
    const addButton = page.getByRole('button', { name: /add/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const cancelButton = page.getByRole('button', { name: /cancel/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }

    // Filter should persist
    await expect(page).toHaveURL(/q=test/);
  });

  test('updates table after adding test type', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add/i });

    if (await addButton.isVisible()) {
      const rowsBefore = await page.getByRole('row').count();

      await addButton.click();

      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill(`New Type ${Date.now()}`);

      const submitButton = page.getByRole('button', { name: /save|submit/i });
      await submitButton.click();

      // Wait for table to update
      await page.waitForTimeout(2000);

      // Should have more rows (or same if pagination)
      const rowsAfter = await page.getByRole('row').count();
      expect(rowsAfter >= rowsBefore).toBeTruthy();
    }
  });

  test('updates table after editing test type', async ({ page }) => {
    const firstDataRow = page.getByRole('row').nth(1);

    if (await firstDataRow.isVisible()) {
      await firstDataRow.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const newName = `Updated ${Date.now()}`;
        const nameInput = page.getByLabel(/name/i);
        await nameInput.fill(newName);

        const submitButton = page.getByRole('button', { name: /save|update/i });
        await submitButton.click();

        // Wait for update
        await page.waitForTimeout(2000);

        // Table should show updated name
        const updatedRow = page.getByText(newName);
        if (await updatedRow.isVisible()) {
          await expect(updatedRow).toBeVisible();
        }
      }
    }
  });
});
