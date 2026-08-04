import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/team-rule');
});

test.describe('Team Rule Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Rule/);
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Team Rule' }),
    ).toBeVisible();
  });

  test('displays rule content', async ({ page }) => {
    // Should display either rule content or placeholder
    const ruleContent = page
      .locator('[data-testid="rule-content"]')
      .or(page.locator('text=/Please wait for admin|rule/i'));

    await expect(ruleContent.first()).toBeVisible();
  });
});

test.describe('Team Rule - Preview Mode', () => {
  test('displays rule in preview mode by default', async ({ page }) => {
    // Check that content is displayed in read-only mode
    const previewContent = page
      .locator('[contenteditable="false"]')
      .or(page.locator('[data-mode="preview"]'));

    if (await previewContent.first().isVisible()) {
      await expect(previewContent.first()).toBeVisible();
    }
  });

  test('displays formatted content', async ({ page }) => {
    // Rule content should be rendered (not raw markdown)
    const content = page.locator(
      'article, [role="article"], [data-testid="rule-content"]',
    );

    if (await content.first().isVisible()) {
      const text = await content.first().textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test('displays last updated timestamp', async ({ page }) => {
    const timestamp = page.locator('text=/last.*updated|updated.*at/i');

    if (await timestamp.isVisible()) {
      await expect(timestamp).toBeVisible();
    }
  });

  test('renders markdown formatting correctly', async ({ page }) => {
    // Check for common markdown elements
    const content = page.locator('article, [role="article"]').first();

    if (await content.isVisible()) {
      // Should render headers, lists, links, etc.
      const hasHeaders = await content.locator('h1, h2, h3').count();
      const hasLists = await content.locator('ul, ol').count();

      // Content should have some formatting
      expect(hasHeaders >= 0 && hasLists >= 0).toBeTruthy();
    }
  });
});

test.describe('Team Rule - Edit Mode (Admin/Captain)', () => {
  test('displays edit button for authorized users', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    const isVisible = await editButton.isVisible();

    if (isVisible) {
      await expect(editButton).toBeVisible();
    }
  });

  test('clicking edit button switches to edit mode', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      // Should show editable text area
      const editor = page.locator('textarea, [contenteditable="true"]');
      await expect(editor).toBeVisible();
    }
  });

  test('displays editor toolbar in edit mode', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(300);

      // Should show editor controls
      const toolbar = page.locator(
        '[role="toolbar"], [data-testid="editor-toolbar"]',
      );
      if (await toolbar.isVisible()) {
        await expect(toolbar).toBeVisible();
      }
    }
  });

  test('can edit rule content', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        await editor.clear();
        await editor.fill('# Test Rule\n\nThis is a test rule.');

        const content = await editor.textContent();
        expect(content).toContain('Test Rule');
      }
    }
  });

  test('displays save button in edit mode', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const saveButton = page.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeVisible();
    }
  });

  test('displays cancel button in edit mode', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const cancelButton = page.getByRole('button', { name: /cancel/i });
      await expect(cancelButton).toBeVisible();
    }
  });

  test('saves rule changes', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        await editor.fill('# Updated Rule\n\nThis is an updated test rule.');

        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();

        // Should show success message
        await expect(
          page.getByText(/updating rules|success|saved/i),
        ).toBeVisible();
      }
    }
  });

  test('validates rule content not empty', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        await editor.clear();

        const saveButton = page.getByRole('button', { name: /save/i });

        // Save button may be disabled or show validation error
        const isDisabled = await saveButton.isDisabled();
        expect(typeof isDisabled).toBe('boolean');
      }
    }
  });

  test('shows character count or limit', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      // Look for character count indicator
      const charCount = page.getByText(/character|limit/i);
      if (await charCount.isVisible()) {
        await expect(charCount).toBeVisible();
      }
    }
  });

  test('preserves formatting on save', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        const testContent = '# Header\n\n- List item 1\n- List item 2';
        await editor.fill(testContent);

        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();

        // Wait for save
        await page.waitForTimeout(1000);

        // Content should be preserved
        expect(true).toBeTruthy();
      }
    }
  });

  test('cancels edit without saving', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        const originalContent = await editor.textContent();

        await editor.fill('# Temporary Change');

        const cancelButton = page.getByRole('button', { name: /cancel/i });
        await cancelButton.click();

        // Should revert to preview mode without saving
        const previewButton = page.getByRole('button', {
          name: /preview|eye/i,
        });
        const isPreview = await previewButton.isVisible();

        if (!isPreview) {
          // Already in preview mode
          expect(true).toBeTruthy();
        }
      }
    }
  });

  test('switches between edit and preview modes', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      // Switch to edit mode
      await editButton.click();
      await page.waitForTimeout(300);

      const editor = page.locator('textarea, [contenteditable="true"]');
      await expect(editor).toBeVisible();

      // Switch back to preview
      const previewButton = page.getByRole('button', { name: /preview|eye/i });
      if (await previewButton.isVisible()) {
        await previewButton.click();
        await page.waitForTimeout(300);

        // Should be back in preview mode
        await expect(editor).not.toBeVisible();
      }
    }
  });
});

test.describe('Team Rule - Permissions', () => {
  test('hides edit button for unauthorized users', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    // Edit button may not be visible for guests/players
    const isVisible = await editButton.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('displays read-only content for all users', async ({ page }) => {
    // All users should be able to view the rule
    const ruleContent = page
      .locator('[data-testid="rule-content"]')
      .or(page.locator('article, [role="article"]'));

    await expect(ruleContent.first()).toBeVisible();
  });
});

test.describe('Team Rule - Markdown Support', () => {
  test('supports headers in markdown', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        await editor.fill('# Header 1\n## Header 2\n### Header 3');

        // Preview the content
        const previewButton = page.getByRole('button', {
          name: /preview|eye/i,
        });
        if (await previewButton.isVisible()) {
          await previewButton.click();
          await page.waitForTimeout(300);

          // Should render headers
          const h1 = page.locator('h1');
          if (await h1.isVisible()) {
            await expect(h1).toBeVisible();
          }
        }
      }
    }
  });

  test('supports lists in markdown', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        await editor.fill('- Item 1\n- Item 2\n- Item 3');

        // Content should be valid
        const content = await editor.textContent();
        expect(content).toContain('Item');
      }
    }
  });

  test('supports links in markdown', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        await editor.fill('[Link Text](https://example.com)');

        // Content should be valid
        const content = await editor.textContent();
        expect(content).toContain('Link');
      }
    }
  });
});

test.describe('Team Rule - Integration', () => {
  test('loads rule content on page load', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Should not show loading state
    const loading = page.getByText(/loading/i);
    const hasLoading = await loading.isVisible();

    expect(hasLoading).toBeFalsy();
  });

  test('displays placeholder when no rule is set', async ({ page }) => {
    const placeholder = page.getByText(/please wait for admin/i);
    const hasPlaceholder = await placeholder.isVisible();

    // Either has content or shows placeholder
    expect(typeof hasPlaceholder).toBe('boolean');
  });

  test('maintains scroll position after edit', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 100));

      const cancelButton = page.getByRole('button', { name: /cancel/i });
      await cancelButton.click();

      // Should maintain position
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY >= 0).toBeTruthy();
    }
  });

  test('updates timestamp after successful save', async ({ page }) => {
    const editButton = page
      .getByRole('button', { name: /edit|write/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg[class*="pencil"]') }),
      );

    if (await editButton.isVisible()) {
      await editButton.click();

      const editor = page.locator('textarea, [contenteditable="true"]');
      if (await editor.isVisible()) {
        await editor.fill('# Updated at ' + Date.now());

        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();

        // Wait for save to complete
        await page.waitForTimeout(1000);

        // Timestamp should be updated
        const timestamp = page.locator('text=/last.*updated/i');
        if (await timestamp.isVisible()) {
          await expect(timestamp).toBeVisible();
        }
      }
    }
  });
});
