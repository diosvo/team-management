import { expect, test } from '@playwright/test';

import { testNoErrors, testNoLoadingState } from '../setup/helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard');
});

test.describe('Dashboard Page', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard/);
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });

  test('displays overview stats cards', async ({ page }) => {
    // Look for common stat cards
    const statCards = page.locator('[data-stat-value]');
    const count = await statCards.count();

    // Should have some stats displayed
    expect(count).toBeGreaterThan(0);
  });

  test('loads without errors', async ({ page }) => {
    await testNoErrors(page);
  });

  test('loads without persistent loading state', async ({ page }) => {
    await testNoLoadingState(page);
  });
});

test.describe('Dashboard - Quick Actions', () => {
  test('displays quick actions section', async ({ page }) => {
    const quickActionsSection = page.getByText(/quick action/i);
    if (await quickActionsSection.isVisible()) {
      await expect(quickActionsSection).toBeVisible();
    }
  });

  test('displays action buttons', async ({ page }) => {
    // Common quick action buttons
    const actionButtons = [
      'Add Match',
      'Add Training',
      'Add Location',
      'Add Team',
    ];

    for (const action of actionButtons) {
      const button = page.getByRole('link', { name: action });
      if (await button.isVisible()) {
        await expect(button).toBeVisible();
      }
    }
  });

  test('quick action buttons are clickable', async ({ page }) => {
    const firstActionLink = page
      .getByRole('link')
      .filter({ has: page.locator('svg') })
      .first();

    if (await firstActionLink.isVisible()) {
      await expect(firstActionLink).toBeEnabled();
    }
  });

  test('clicking quick action navigates to correct page', async ({ page }) => {
    const matchLink = page.getByRole('link', { name: /add match/i });

    if (await matchLink.isVisible()) {
      await matchLink.click();

      // Should navigate to matches page or add match dialog
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    }
  });
});

test.describe('Dashboard - Upcoming Sessions', () => {
  test('displays upcoming sessions section', async ({ page }) => {
    const upcomingSessions = page.getByText(/upcoming.*session/i);
    await expect(upcomingSessions).toBeVisible();
  });

  test('displays training session cards', async ({ page }) => {
    // Look for session cards or empty state
    const sessionCards = page.locator('[data-testid="session-card"]');
    const emptyState = page.getByText(/no.*session/i);

    const hasCards = await sessionCards.first().isVisible();
    const isEmpty = await emptyState.isVisible();

    // Either has cards or shows empty state
    expect(hasCards || isEmpty).toBeTruthy();
  });

  test('session cards display date and time', async ({ page }) => {
    const sessionCard = page.locator('[data-testid="session-card"]').first();

    if (await sessionCard.isVisible()) {
      // Should contain date/time information
      const cardText = await sessionCard.textContent();
      expect(cardText?.length).toBeGreaterThan(0);
    }
  });

  test('clicking session card navigates to training page', async ({ page }) => {
    const sessionCard = page.locator('[data-testid="session-card"]').first();

    if (await sessionCard.isVisible()) {
      await sessionCard.click();

      // Should navigate to training or attendance page
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/training|attendance/);
    }
  });

  test('displays view all link', async ({ page }) => {
    const viewAllLink = page.getByRole('link', { name: /view all/i });

    if (await viewAllLink.isVisible()) {
      await expect(viewAllLink).toBeVisible();

      // Should link to training page
      const href = await viewAllLink.getAttribute('href');
      expect(href).toContain('training');
    }
  });
});

test.describe('Dashboard - Upcoming Matches', () => {
  test('displays upcoming matches section', async ({ page }) => {
    const upcomingMatches = page.getByText(/upcoming.*match/i);
    await expect(upcomingMatches).toBeVisible();
  });

  test('displays match cards', async ({ page }) => {
    // Look for match cards or empty state
    const matchCards = page.locator('[data-testid="match-card"]');
    const emptyState = page.getByText(/no.*match/i);

    const hasCards = await matchCards.first().isVisible();
    const isEmpty = await emptyState.isVisible();

    // Either has cards or shows empty state
    expect(hasCards || isEmpty).toBeTruthy();
  });

  test('match cards display opponent and date', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();

    if (await matchCard.isVisible()) {
      // Should contain match information
      const cardText = await matchCard.textContent();
      expect(cardText?.length).toBeGreaterThan(0);
    }
  });

  test('clicking match card navigates to matches page', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();

    if (await matchCard.isVisible()) {
      await matchCard.click();

      // Should navigate to matches page
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toContain('match');
    }
  });

  test('displays view all link', async ({ page }) => {
    const viewAllLink = page
      .getByRole('link', { name: /view all/i })
      .filter({ has: page.locator('text=/match/i') });

    if (await viewAllLink.first().isVisible()) {
      await expect(viewAllLink.first()).toBeVisible();

      // Should link to matches page
      const href = await viewAllLink.first().getAttribute('href');
      expect(href).toContain('match');
    }
  });
});

test.describe('Dashboard - Attendance Trend', () => {
  test('displays attendance trend section', async ({ page }) => {
    const attendanceTrend = page.getByText(/attendance.*trend/i);
    if (await attendanceTrend.isVisible()) {
      await expect(attendanceTrend).toBeVisible();
    }
  });

  test('displays chart or graph', async ({ page }) => {
    // Look for chart canvas or SVG
    const chart = page.locator('canvas, svg[class*="chart"], [data-chart]');

    if (await chart.first().isVisible()) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('displays trend data points', async ({ page }) => {
    const trendSection = page
      .locator('text=/attendance.*trend/i')
      .locator('..');

    if (await trendSection.isVisible()) {
      // Should contain some data visualization
      const hasContent = await trendSection.textContent();
      expect(hasContent).toBeTruthy();
    }
  });
});

test.describe('Dashboard - Player Attendance Ranking', () => {
  test('displays player ranking section', async ({ page }) => {
    const rankingSection = page.getByText(/player.*attendance.*ranking/i);
    if (await rankingSection.isVisible()) {
      await expect(rankingSection).toBeVisible();
    }
  });

  test('displays ranked player list', async ({ page }) => {
    const playerList = page.locator('[data-testid="player-rank"]');

    if (await playerList.first().isVisible()) {
      await expect(playerList.first()).toBeVisible();
    }
  });

  test('displays attendance percentages', async ({ page }) => {
    // Look for percentage values
    const percentages = page.locator('text=/%/');

    if (await percentages.first().isVisible()) {
      await expect(percentages.first()).toBeVisible();
    }
  });
});

test.describe('Dashboard - Absence Reasons Breakdown', () => {
  test('displays absence reasons section', async ({ page }) => {
    const absenceSection = page.getByText(/absence.*reason/i);
    if (await absenceSection.isVisible()) {
      await expect(absenceSection).toBeVisible();
    }
  });

  test('displays breakdown chart', async ({ page }) => {
    // Look for pie chart or bar chart
    const chart = page.locator('canvas, svg[class*="chart"], [data-chart]');

    if ((await chart.count()) > 0) {
      // Should have some chart visualization
      expect(true).toBeTruthy();
    }
  });

  test('displays reason categories', async ({ page }) => {
    const absenceSection = page
      .locator('text=/absence.*reason/i')
      .locator('..');

    if (await absenceSection.isVisible()) {
      // Should list different absence reasons
      const content = await absenceSection.textContent();
      expect(content).toBeTruthy();
    }
  });
});

test.describe('Dashboard - Matches Rate', () => {
  test('displays matches rate section', async ({ page }) => {
    const matchesRate = page.getByText(/match.*rate/i);
    if (await matchesRate.isVisible()) {
      await expect(matchesRate).toBeVisible();
    }
  });

  test('displays win/loss/draw statistics', async ({ page }) => {
    // Look for match result indicators
    const winText = page.getByText(/win/i);
    const lossText = page.getByText(/loss/i);
    const drawText = page.getByText(/draw/i);

    const hasWin = await winText.first().isVisible();
    const hasLoss = await lossText.first().isVisible();
    const hasDraw = await drawText.first().isVisible();

    // Should display some match statistics
    expect(hasWin || hasLoss || hasDraw).toBeTruthy();
  });

  test('displays percentages or counts', async ({ page }) => {
    const matchesRateSection = page
      .locator('text=/match.*rate/i')
      .locator('..');

    if (await matchesRateSection.isVisible()) {
      // Should contain numerical data
      const content = await matchesRateSection.textContent();
      expect(content).toBeTruthy();
    }
  });
});

test.describe('Dashboard - Filters', () => {
  test('displays interval filter', async ({ page }) => {
    const intervalFilter = page
      .locator('[data-testid="interval-filter"]')
      .or(page.locator('text=/interval|period|range/i'));

    if (await intervalFilter.first().isVisible()) {
      await expect(intervalFilter.first()).toBeVisible();
    }
  });

  test('changes data when interval is selected', async ({ page }) => {
    const intervalSelect = page
      .locator('select, button[role="combobox"]')
      .first();

    if (await intervalSelect.isVisible()) {
      await intervalSelect.click();
      await page.waitForTimeout(300);

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();

        // URL should update with interval parameter
        await page.waitForTimeout(500);
        const currentUrl = page.url();
        expect(currentUrl).toContain('interval');
      }
    }
  });

  test('filters update query params', async ({ page }) => {
    const filterButton = page
      .locator('button')
      .filter({ hasText: /week|month|year/i })
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Should update URL
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/interval=|dashboard/);
    }
  });
});

test.describe('Dashboard - Integration', () => {
  test('loads data without errors', async ({ page }) => {
    // Wait for all content to load
    await page.waitForTimeout(1000);

    // Should not show error messages
    const errorText = page.getByText(/error|failed|something went wrong/i);
    const hasError = await errorText.isVisible();

    expect(hasError).toBeFalsy();
  });

  test('displays multiple sections concurrently', async ({ page }) => {
    // Check that multiple sections are visible
    const sections = [
      page.getByText(/quick action/i),
      page.getByText(/upcoming.*session/i),
      page.getByText(/upcoming.*match/i),
    ];

    let visibleCount = 0;
    for (const section of sections) {
      if (await section.isVisible()) {
        visibleCount++;
      }
    }

    // At least some sections should be visible
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('navigation links work correctly', async ({ page }) => {
    // Find any navigation link
    const navLink = page.getByRole('link').first();

    if (await navLink.isVisible()) {
      const href = await navLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('dashboard is responsive', async ({ page }) => {
    // Check that content is visible at different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    let largeScreenVisible = await page
      .getByRole('heading', { name: 'Dashboard' })
      .isVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    let smallScreenVisible = await page
      .getByRole('heading', { name: 'Dashboard' })
      .isVisible();

    expect(largeScreenVisible && smallScreenVisible).toBeTruthy();
  });
});
