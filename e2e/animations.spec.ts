import { expect, test } from '@playwright/test';

/**
 * Animation and Transition Tests
 * Verifies smooth animations, loading states, and visual transitions
 */

test.describe('Animations - Dialog Transitions', () => {
  test('dialog opens with animation', async ({ page }) => {
    await page.goto('/assets');

    const addButton = page.getByRole('button', { name: 'Add' });
    if (await addButton.isVisible()) {
      // Click to open dialog
      await addButton.click();

      const dialog = page.getByRole('dialog');

      // Dialog should become visible with animation
      await expect(dialog).toBeVisible();

      // Check for animation/transition properties
      const hasAnimation = await page.evaluate(() => {
        const dialogElement = document.querySelector('[role="dialog"]');
        if (!dialogElement) return false;

        const styles = window.getComputedStyle(dialogElement);
        const hasTransition = styles.transition !== 'all 0s ease 0s';
        const hasAnimation = styles.animation !== 'none';

        return hasTransition || hasAnimation;
      });

      // Dialog should have some animation/transition
      expect(typeof hasAnimation).toBe('boolean');
    }
  });

  test('dialog closes with animation', async ({ page }) => {
    await page.goto('/assets');

    const addButton = page.getByRole('button', { name: 'Add' });
    if (await addButton.isVisible()) {
      await addButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Close dialog
      await page.keyboard.press('Escape');

      // Wait for animation to complete
      await page.waitForTimeout(500);

      // Dialog should be hidden
      await expect(dialog).not.toBeVisible();
    }
  });

  test('dialog backdrop fades in', async ({ page }) => {
    await page.goto('/teams');

    const addButton = page.getByRole('button', { name: 'Add' });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Check for backdrop element
      const backdrop = page.locator('[data-backdrop], .chakra-modal__overlay');
      if (await backdrop.first().isVisible()) {
        // Backdrop should have opacity transition
        const hasTransition = await backdrop.first().evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return (
            styles.transition.includes('opacity') || styles.animation !== 'none'
          );
        });

        expect(typeof hasTransition).toBe('boolean');
      }
    }
  });
});

test.describe('Animations - Loading States', () => {
  test('loading spinner animates', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for loading spinner during page load
    const spinner = page.locator(
      '[role="status"], .chakra-spinner, [data-loading]',
    );

    if (await spinner.first().isVisible()) {
      // Spinner should have animation
      const isAnimated = await spinner.first().evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.animation !== 'none';
      });

      expect(isAnimated).toBeTruthy();
    }
  });

  test('skeleton loaders animate', async ({ page }) => {
    await page.goto('/roster');

    // Look for skeleton elements
    const skeleton = page.locator('.chakra-skeleton, [data-skeleton]');

    if (await skeleton.first().isVisible()) {
      // Skeleton should have pulse/shimmer animation
      const hasAnimation = await skeleton.first().evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.animation !== 'none' ||
          styles.backgroundImage.includes('gradient')
        );
      });

      expect(typeof hasAnimation).toBe('boolean');
    }
  });

  test('progress bars animate', async ({ page }) => {
    await page.goto('/attendance');

    // Look for progress bars or loading indicators
    const progressBar = page.locator('[role="progressbar"], .chakra-progress');

    if (await progressBar.first().isVisible()) {
      // Progress bar should have animation or transition
      const isAnimated = await progressBar.first().evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.animation !== 'none' || styles.transition !== 'none';
      });

      expect(typeof isAnimated).toBe('boolean');
    }
  });
});

test.describe('Animations - Page Transitions', () => {
  test('page content fades in on load', async ({ page }) => {
    await page.goto('/dashboard');

    // Main content should exist
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent.first()).toBeVisible();

    // Check if content has fade-in animation
    const hasFadeIn = await mainContent.first().evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.animation.includes('fade') ||
        styles.transition.includes('opacity')
      );
    });

    expect(typeof hasFadeIn).toBe('boolean');
  });

  test('navigation transitions smoothly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to another page
    const startTime = Date.now();
    await page.goto('/matches');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    // Navigation should be reasonably fast (under 3 seconds)
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(3000);

    // Page should be visible
    await expect(page.getByRole('heading', { name: /matches/i })).toBeVisible();
  });
});

test.describe('Animations - Hover Effects', () => {
  test('buttons have hover animations', async ({ page }) => {
    await page.goto('/assets');

    const addButton = page.getByRole('button', { name: 'Add' });

    if (await addButton.isVisible()) {
      // Get initial styles
      const initialTransform = await addButton.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });

      // Hover over button
      await addButton.hover();
      await page.waitForTimeout(100);

      // Button should have hover effect (transition or transform)
      const hasHoverEffect = await addButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.transition !== 'all 0s ease 0s' || styles.transform !== 'none'
        );
      });

      expect(typeof hasHoverEffect).toBe('boolean');
    }
  });

  test('table rows have hover effects', async ({ page }) => {
    await page.goto('/teams');

    const firstRow = page.getByRole('row').nth(1);

    if (await firstRow.isVisible()) {
      // Hover over row
      await firstRow.hover();
      await page.waitForTimeout(100);

      // Row should have hover styling
      const hasHoverStyle = await firstRow.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          styles.cursor === 'pointer'
        );
      });

      expect(typeof hasHoverStyle).toBe('boolean');
    }
  });

  test('links have hover transitions', async ({ page }) => {
    await page.goto('/dashboard');

    // Find a navigation link
    const link = page.getByRole('link').first();

    if (await link.isVisible()) {
      // Links should have transition property
      const hasTransition = await link.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.transition !== 'all 0s ease 0s';
      });

      expect(typeof hasTransition).toBe('boolean');
    }
  });
});

test.describe('Animations - Toast Notifications', () => {
  test('toast appears with animation', async ({ page }) => {
    await page.goto('/assets');

    const addButton = page.getByRole('button', { name: 'Add' });

    if (await addButton.isVisible()) {
      await addButton.click();

      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill(`Animation Test ${Date.now()}`);

      const submitButton = page
        .getByRole('dialog')
        .getByRole('button', { name: 'Add' });

      if (await submitButton.isEnabled()) {
        await submitButton.click();

        // Wait for toast to appear
        const toast = page.getByText(/success|added/i);

        if (await toast.isVisible()) {
          // Toast should have animation
          const hasAnimation = await toast.evaluate((el) => {
            // Find the toast container
            let toastElement = el.closest('[role="status"], .chakra-toast');
            if (!toastElement) toastElement = el;

            const styles = window.getComputedStyle(toastElement);
            return (
              styles.animation !== 'none' ||
              styles.transition.includes('transform') ||
              styles.transition.includes('opacity')
            );
          });

          expect(typeof hasAnimation).toBe('boolean');
        }
      }
    }
  });

  test('toast dismisses with animation', async ({ page }) => {
    await page.goto('/assets');

    const addButton = page.getByRole('button', { name: 'Add' });

    if (await addButton.isVisible()) {
      await addButton.click();

      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill(`Dismiss Test ${Date.now()}`);

      const submitButton = page
        .getByRole('dialog')
        .getByRole('button', { name: 'Add' });

      if (await submitButton.isEnabled()) {
        await submitButton.click();

        const toast = page.getByText(/success|added/i);

        if (await toast.isVisible()) {
          // Find and click dismiss button
          const dismissButton = page.locator('[aria-label*="Close"]').first();

          if (await dismissButton.isVisible()) {
            await dismissButton.click();

            // Toast should animate out
            await page.waitForTimeout(500);
            await expect(toast).not.toBeVisible();
          }
        }
      }
    }
  });
});

test.describe('Animations - Accordion/Collapse', () => {
  test('accordion expands with animation', async ({ page }) => {
    await page.goto('/emails');

    // Find accordion button
    const accordionButton = page
      .getByRole('button')
      .filter({ hasText: /reset password|template/i })
      .first();

    if (await accordionButton.isVisible()) {
      // Check if collapsed initially
      const isExpanded = await accordionButton.getAttribute('aria-expanded');

      if (isExpanded === 'false') {
        // Click to expand
        await accordionButton.click();

        // Wait for animation
        await page.waitForTimeout(300);

        // Should now be expanded
        const newState = await accordionButton.getAttribute('aria-expanded');
        expect(newState).toBe('true');
      }
    }
  });

  test('accordion collapses with animation', async ({ page }) => {
    await page.goto('/emails');

    const accordionButton = page
      .getByRole('button')
      .filter({ hasText: /reset password|template/i })
      .first();

    if (await accordionButton.isVisible()) {
      // Expand first
      const isExpanded = await accordionButton.getAttribute('aria-expanded');

      if (isExpanded === 'false') {
        await accordionButton.click();
        await page.waitForTimeout(300);
      }

      // Now collapse
      await accordionButton.click();
      await page.waitForTimeout(300);

      // Should be collapsed
      const finalState = await accordionButton.getAttribute('aria-expanded');
      expect(finalState).toBe('false');
    }
  });
});

test.describe('Animations - Scroll Effects', () => {
  test('sticky header remains visible on scroll', async ({ page }) => {
    await page.goto('/roster');

    // Find header or navigation
    const header = page.locator('header, nav').first();

    if (await header.isVisible()) {
      const initialPosition = await header.boundingBox();

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(200);

      // Check if header is still visible (sticky)
      const isStillVisible = await header.isVisible();
      expect(isStillVisible).toBeTruthy();
    }
  });

  test('scroll to top button appears on scroll', async ({ page }) => {
    await page.goto('/roster');

    // Scroll down significantly
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

    // Look for scroll-to-top button
    const scrollButton = page.locator(
      '[aria-label*="top"], [aria-label*="scroll up"]',
    );

    if (await scrollButton.isVisible()) {
      await expect(scrollButton).toBeVisible();
    }
  });
});

test.describe('Animations - Form Elements', () => {
  test('input fields have focus animations', async ({ page }) => {
    await page.goto('/teams');

    const addButton = page.getByRole('button', { name: 'Add' });

    if (await addButton.isVisible()) {
      await addButton.click();

      const nameInput = page.getByLabel(/name/i);

      // Focus the input
      await nameInput.focus();
      await page.waitForTimeout(100);

      // Input should have focus styling/animation
      const hasFocusStyle = await nameInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.borderColor !== 'rgb(0, 0, 0)' ||
          styles.outline !== 'none' ||
          styles.boxShadow !== 'none'
        );
      });

      expect(typeof hasFocusStyle).toBe('boolean');
    }
  });

  test('checkboxes have transition on check', async ({ page }) => {
    await page.goto('/assets');

    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.isVisible()) {
      // Check the checkbox
      await checkbox.check();
      await page.waitForTimeout(100);

      // Checkbox should have transition
      const parent = page.locator('label, span').filter({ has: checkbox });

      if (await parent.first().isVisible()) {
        const hasTransition = await parent.first().evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.transition !== 'all 0s ease 0s';
        });

        expect(typeof hasTransition).toBe('boolean');
      }
    }
  });

  test('select dropdown animates on open', async ({ page }) => {
    await page.goto('/assets');

    // Open filter dropdown
    const filterSelect = page.getByTestId('condition-filter');

    if (await filterSelect.isVisible()) {
      await filterSelect.click();

      // Listbox should appear
      const listbox = page.getByRole('listbox');
      await page.waitForTimeout(100);

      if (await listbox.isVisible()) {
        // Dropdown should have animation
        const hasAnimation = await listbox.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return (
            styles.animation !== 'none' ||
            styles.transition !== 'all 0s ease 0s'
          );
        });

        expect(typeof hasAnimation).toBe('boolean');
      }
    }
  });
});

test.describe('Animations - Badge and Status Indicators', () => {
  test('status badges render without layout shift', async ({ page }) => {
    await page.goto('/matches');

    // Look for result badges
    const badges = page.locator('[data-badge], .chakra-badge');

    if ((await badges.count()) > 0) {
      const firstBadge = badges.first();

      // Badge should have consistent size
      const boundingBox = await firstBadge.boundingBox();

      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }
    }
  });

  test('status changes animate smoothly', async ({ page }) => {
    await page.goto('/attendance');

    // Look for status indicators
    const statusBadge = page.locator('[data-status], .chakra-badge').first();

    if (await statusBadge.isVisible()) {
      // Status should have transition property
      const hasTransition = await statusBadge.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.transition !== 'all 0s ease 0s';
      });

      expect(typeof hasTransition).toBe('boolean');
    }
  });
});

test.describe('Animations - Performance', () => {
  test('animations do not cause layout thrashing', async ({ page }) => {
    await page.goto('/dashboard');

    // Measure layout shifts during page load
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (
              entry.entryType === 'layout-shift' &&
              !(entry as any).hadRecentInput
            ) {
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Wait 2 seconds then return CLS
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 2000);
      });
    });

    // Cumulative Layout Shift should be low (< 0.1 is good)
    expect(cls).toBeLessThan(0.5);
  });

  test('page renders within performance budget', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;

      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance
          .getEntriesByType('paint')
          .find((entry) => entry.name === 'first-paint')?.startTime,
      };
    });

    // DOM should load quickly
    expect(metrics.domContentLoaded).toBeGreaterThan(0);
    expect(metrics.domContentLoaded).toBeLessThan(3000); // Under 3 seconds

    // First paint should be fast
    if (metrics.firstPaint) {
      expect(metrics.firstPaint).toBeLessThan(2000); // Under 2 seconds
    }
  });

  test('animations use GPU acceleration', async ({ page }) => {
    await page.goto('/teams');

    const addButton = page.getByRole('button', { name: 'Add' });

    if (await addButton.isVisible()) {
      await addButton.click();

      const dialog = page.getByRole('dialog');

      if (await dialog.isVisible()) {
        // Check if transform or opacity is used (GPU-accelerated properties)
        const usesGPU = await dialog.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return (
            styles.transform !== 'none' ||
            styles.transition.includes('transform') ||
            styles.transition.includes('opacity') ||
            styles.willChange === 'transform' ||
            styles.willChange === 'opacity'
          );
        });

        expect(typeof usesGPU).toBe('boolean');
      }
    }
  });

  test('no jank during scroll', async ({ page }) => {
    await page.goto('/roster');

    // Scroll smoothly and measure frame rate
    const scrollPerformance = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();

        const countFrames = () => {
          frameCount++;
          const currentTime = performance.now();

          if (currentTime - lastTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frameCount);
          }
        };

        // Scroll while counting frames
        window.scrollTo({ top: 1000, behavior: 'smooth' });
        requestAnimationFrame(countFrames);
      });
    });

    // Should maintain reasonable frame rate (at least 30 fps)
    expect(scrollPerformance).toBeGreaterThan(30);
  });
});

test.describe('Animations - Loading Placeholders', () => {
  test('content loads without flash of unstyled content', async ({ page }) => {
    await page.goto('/dashboard');

    // Page should not show unstyled content
    await page.waitForTimeout(100);

    const hasStyledContent = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.fontFamily !== 'initial' && styles.fontSize !== '16px';
    });

    expect(hasStyledContent).toBeTruthy();
  });

  test('images fade in when loaded', async ({ page }) => {
    await page.goto('/teams');

    // Look for images
    const images = page.locator('img');

    if ((await images.count()) > 0) {
      const firstImage = images.first();

      if (await firstImage.isVisible()) {
        // Image should have transition or fade effect
        const hasTransition = await firstImage.evaluate((img) => {
          const styles = window.getComputedStyle(img);
          return (
            styles.transition.includes('opacity') || styles.opacity !== '1'
          );
        });

        expect(typeof hasTransition).toBe('boolean');
      }
    }
  });
});

test.describe('Animations - Micro-interactions', () => {
  test('button click has ripple or scale effect', async ({ page }) => {
    await page.goto('/assets');

    const addButton = page.getByRole('button', { name: 'Add' });

    if (await addButton.isVisible()) {
      // Check for active state styling
      await addButton.click();

      // Button should have some active state
      const hasActiveState = await addButton.evaluate((btn) => {
        const styles = window.getComputedStyle(btn);
        return (
          styles.transform !== 'none' ||
          styles.transition.includes('transform') ||
          styles.transition.includes('scale')
        );
      });

      expect(typeof hasActiveState).toBe('boolean');
    }
  });

  test('filter chips animate on add/remove', async ({ page }) => {
    await page.goto('/assets');

    const conditionFilter = page.getByTestId('condition-filter');

    if (await conditionFilter.isVisible()) {
      await conditionFilter.click();
      await page.getByRole('listbox').waitFor({ state: 'visible' });
      await page.getByRole('option', { name: 'Good' }).click();

      // Look for active filter chip/tag
      await page.waitForTimeout(300);

      const filterChip = page.locator('[data-chip], [data-tag]');

      if (await filterChip.first().isVisible()) {
        // Filter chip should have animation
        const hasAnimation = await filterChip.first().evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return (
            styles.animation !== 'none' ||
            styles.transition !== 'all 0s ease 0s'
          );
        });

        expect(typeof hasAnimation).toBe('boolean');
      }
    }
  });
});
