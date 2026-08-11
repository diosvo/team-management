import env from '@env';
import { defineConfig, devices } from '@playwright/test';

// Visual regression guard for the Chakra UI screens.
//
// Baselines are captured BEFORE the docs (Fumadocs/Tailwind) migration and
// compared after, so any global CSS bleed into the main app shows up as a
// pixel diff. Kept separate from playwright.config.ts so the functional e2e
// suite is unaffected.
//
// Run:    pnpm exec playwright test -c playwright.visual.config.ts
// Update: pnpm exec playwright test -c playwright.visual.config.ts --update-snapshots
export default defineConfig({
  timeout: 60 * 1000,
  testDir: 'e2e',
  outputDir: 'test-results/visual',
  reporter: [['list']],

  // Platform-independent snapshot names (baselines are compared on the same
  // machine that captured them).
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{arg}{ext}',

  webServer: {
    command: 'pnpm dev',
    url: env.DEV_URL,
    reuseExistingServer: !env.CI,
  },

  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      // Tolerate anti-aliasing noise, fail on real styling changes.
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    baseURL: env.DEV_URL,
    ...devices['Desktop Chrome'],
  },

  projects: [
    // Public pages need no login — always runnable.
    {
      name: 'visual-public',
      testMatch: 'visual/public.spec.ts',
    },

    // Authenticated pages reuse the functional suite's login flow. Requires
    // PW_USERNAME to exist in the database the dev server points at.
    { name: 'setup', testMatch: 'setup/auth.ts' },
    {
      name: 'visual-app',
      testMatch: 'visual/app.spec.ts',
      use: {
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
});
