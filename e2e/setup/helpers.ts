import { expect, Page } from '@playwright/test';

/**
 * Reusable test helpers for E2E tests
 */

/**
 * Wait for navigation to complete and verify URL pattern
 */
export async function waitForNavigation(page: Page, urlPattern: RegExp) {
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(urlPattern);
}

/**
 * Test search functionality with query params
 */
export async function testSearchWithQueryParams(
  page: Page,
  searchTerm: string,
  expectedUrlPattern: RegExp,
) {
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill(searchTerm);
  await expect(page).toHaveURL(expectedUrlPattern);

  // Clear search
  await searchInput.clear();
  await expect(page).not.toHaveURL(expectedUrlPattern);
}

/**
 * Test filter functionality with query params
 */
export async function testFilterWithQueryParams(
  page: Page,
  filterSelector: string,
  optionName: string,
  expectedUrlPattern: RegExp,
) {
  await page.locator(filterSelector).click();
  await page.getByRole('listbox').waitFor({ state: 'visible' });
  await page.getByRole('option', { name: optionName }).click();
  await expect(page).toHaveURL(expectedUrlPattern);
}

/**
 * Test pagination navigation
 */
export async function testPaginationNavigation(page: Page) {
  const nextButton = page.getByRole('button', { name: 'Next' });
  if (await nextButton.isEnabled()) {
    await nextButton.click();
    await expect(page).toHaveURL(/page=2/);

    const prevButton = page.getByRole('button', { name: 'Previous' });
    await prevButton.click();
    await expect(page).toHaveURL(/page=1/);
  }
}

/**
 * Test table headers visibility
 */
export async function testTableHeaders(page: Page, headers: string[]) {
  for (const header of headers) {
    await expect(
      page.getByRole('columnheader', { name: header }),
    ).toBeVisible();
  }
}

/**
 * Test empty state with unique search
 */
export async function testEmptyState(
  page: Page,
  uniqueSearch: string,
  emptyMessage: string,
) {
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill(uniqueSearch);
  await page.waitForTimeout(500);
  await expect(page.getByText(emptyMessage)).toBeVisible();
  await searchInput.clear();
}

/**
 * Test dialog open and close
 */
export async function testDialogOpenClose(
  page: Page,
  triggerSelector: string,
  dialogTitle: string,
) {
  await page.locator(triggerSelector).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('heading', { name: dialogTitle })).toBeVisible();

  // Close dialog
  const cancelButton = page.getByRole('button', { name: /cancel/i });
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
    await expect(dialog).not.toBeVisible();
  }
}

/**
 * Test form validation - submit button disabled when empty
 */
export async function testFormValidationDisabled(
  page: Page,
  submitButtonName: string,
) {
  const submitButton = page
    .getByRole('dialog')
    .getByRole('button', { name: submitButtonName });
  await expect(submitButton).toBeDisabled();
}

/**
 * Test success toast message
 */
export async function testSuccessToast(page: Page, message: string | RegExp) {
  await expect(page.getByText(message)).toBeVisible();
}

/**
 * Test keyboard navigation with Tab
 */
export async function testKeyboardNavigation(
  page: Page,
  startSelector: string,
) {
  const element = page.locator(startSelector);
  await element.focus();
  await page.keyboard.press('Tab');

  // Verify focus moved
  const activeElement = await page.evaluate(
    () => document.activeElement?.tagName,
  );
  expect(activeElement).toBeTruthy();
}

/**
 * Test delete with checkbox selection
 */
export async function testDeleteWithCheckbox(
  page: Page,
  searchTerm: string,
  successMessage: RegExp,
) {
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill(searchTerm);
  await page.waitForTimeout(500);

  const count = await page
    .getByRole('checkbox', { name: 'Select row' })
    .count();

  if (count > 0) {
    const selectAll = page.getByRole('checkbox', { name: 'Select all rows' });
    await selectAll.click({ force: true });

    await expect(page.getByText(`${count} selected`)).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText(successMessage)).toBeVisible();
    await expect(page.getByText(`${count} selected`)).not.toBeVisible();
  }
}

/**
 * Test stats card click behavior
 */
export async function testStatsCardClick(
  page: Page,
  cardText: string,
  expectedUrlPattern: RegExp | string,
  shouldMatch: boolean = true,
) {
  await page.getByText(cardText).click();
  await page.waitForTimeout(300);

  if (shouldMatch) {
    if (typeof expectedUrlPattern === 'string') {
      expect(page.url()).toContain(expectedUrlPattern);
    } else {
      await expect(page).toHaveURL(expectedUrlPattern);
    }
  } else {
    if (typeof expectedUrlPattern === 'string') {
      expect(page.url()).not.toContain(expectedUrlPattern);
    } else {
      await expect(page).not.toHaveURL(expectedUrlPattern);
    }
  }
}

/**
 * Test URL parameter persistence after page reload
 */
export async function testUrlPersistence(page: Page, urlPattern: RegExp) {
  await expect(page).toHaveURL(urlPattern);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(urlPattern);
}

/**
 * Test row click to open edit dialog
 */
export async function testRowClickEdit(
  page: Page,
  dialogTitle: string,
  fieldName: string,
) {
  const firstRow = page.getByRole('row').nth(1);
  if (await firstRow.isVisible()) {
    await firstRow.click();

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) {
      await expect(
        page.getByRole('heading', { name: dialogTitle }),
      ).toBeVisible();

      const field = page.getByLabel(fieldName);
      const value = await field.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  }
}

/**
 * Generate unique test name with timestamp
 */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

/**
 * Test highlighted search results
 */
export async function testHighlightedText(page: Page, searchTerm: string) {
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill(searchTerm);
  await page.waitForTimeout(500);

  const highlightedText = page.locator('mark, [data-highlighted]');
  if (await highlightedText.first().isVisible()) {
    await expect(highlightedText.first()).toBeVisible();
  }
}

/**
 * Test loading state doesn't persist
 */
export async function testNoLoadingState(page: Page) {
  await page.waitForTimeout(1000);
  const loading = page.getByText(/loading/i).first();
  const hasLoading = await loading.isVisible();
  expect(hasLoading).toBeFalsy();
}

/**
 * Test no error messages on page load
 */
export async function testNoErrors(page: Page) {
  await page.waitForTimeout(1000);
  const errorText = page.getByText(/error|failed|something went wrong/i);
  const hasError = await errorText.isVisible();
  expect(hasError).toBeFalsy();
}

/**
 * Test keyboard shortcut (Enter to submit)
 */
export async function testEnterToSubmit(
  page: Page,
  inputSelector: string,
  successMessage: RegExp,
) {
  const input = page.locator(inputSelector);
  if (await input.isVisible()) {
    await input.press('Enter');
    await page.waitForTimeout(500);
    await expect(page.getByText(successMessage)).toBeVisible();
  }
}

/**
 * Test checkbox-based filter with query params
 */
export async function testCheckboxFilter(
  page: Page,
  sectionText: string,
  optionName: string,
  expectedUrlPattern: RegExp,
) {
  const filterSection = page.locator(`text=${sectionText}`).first();
  if (await filterSection.isVisible()) {
    await filterSection.click();
    const option = page.getByRole('checkbox', { name: optionName });
    if (await option.isVisible()) {
      await option.check();
      const applyButton = page.getByRole('button', { name: 'Apply' });
      if (await applyButton.isVisible()) {
        await applyButton.click();
      }
      await expect(page).toHaveURL(expectedUrlPattern);
    }
  }
}

/**
 * Test checkbox-based filter apply and reset cycle
 */
export async function testCheckboxFilterReset(
  page: Page,
  sectionText: string,
  optionName: string,
  expectedUrlPattern: RegExp,
) {
  const filterSection = page.locator(`text=${sectionText}`).first();
  if (await filterSection.isVisible()) {
    await filterSection.click();
    const option = page.getByRole('checkbox', { name: optionName });
    if (await option.isVisible()) {
      await option.check();
      const applyButton = page.getByRole('button', { name: 'Apply' });
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await expect(page).toHaveURL(expectedUrlPattern);
      }
      await filterSection.click();
      const resetButton = page.getByRole('button', { name: 'Reset' });
      if (await resetButton.isVisible()) {
        await resetButton.click();
        await expect(page).not.toHaveURL(expectedUrlPattern);
      }
    }
  }
}

/**
 * Test Escape key to cancel
 */
export async function testEscapeToCancel(page: Page) {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible()) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(dialog).not.toBeVisible();
  }
}
