import { expect, Page } from '@playwright/test';

export class DialogPOM {
  constructor(private readonly page: Page) {}

  get locator() {
    return this.page.getByRole('dialog');
  }

  async open(triggerLabel: string) {
    await this.page.getByRole('button', { name: triggerLabel }).click();
  }

  async expectSubmitDisabled(buttonName: string) {
    await expect(
      this.locator.getByRole('button', { name: buttonName }),
    ).toBeDisabled();
  }

  async submit(buttonName: string) {
    await this.locator.getByRole('button', { name: buttonName }).click();
  }

  async close() {
    await this.locator.getByRole('button', { name: 'Close' }).click();
    await expect(this.locator).not.toBeVisible();
  }
}

export class TablePOM {
  constructor(private readonly page: Page) {}

  firstDataRow() {
    return this.page.getByRole('row').nth(1);
  }

  async clickFirstRow() {
    const row = this.firstDataRow();
    if (await row.isVisible()) {
      await row.click();
    }
  }

  async navigateToNextPage() {
    const nextButton = this.page.getByRole('button', { name: 'Next' });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(this.page).toHaveURL(/page=2/);
    }
  }
}
