import { defineConfig, devices } from '@playwright/test';

import env from '@env';

import { STORAGE_STATE } from './e2e/setup/accounts';

/**
 * The suite runs against its own database (`TEST_DATABASE_URL`), rebuilt and
 * reseeded by `e2e/setup/global-setup.ts` before every run, and its own
 * production server on `E2E_PORT`. That keeps it off the developer's database
 * and lets it run beside `pnpm dev`: Next 16 allows only one `next dev` per
 * project, so the suite builds and starts the app instead.
 */
const E2E_PORT = 3100;
const E2E_URL = `http://localhost:${E2E_PORT}`;
const E2E_RESEND_KEY = 're_e2e_disabled';

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Timeout per test
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },
  // Test directory
  testDir: 'e2e',
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: 'test-results/',
  // Specs share one seeded database: files run in parallel, tests within a
  // file in order, so a create → edit → delete flow sees its own rows.
  fullyParallel: false,
  workers: env.CI ? 2 : 4,
  retries: env.CI ? 1 : 0,
  globalSetup: './e2e/setup/global-setup.ts',
  // https://playwright.dev/docs/test-reporters#html-reporter
  reporter: [
    ['list'],
    [
      'html',
      {
        open: env.CI ? 'never' : 'on-failure',
        outputFolder: 'playwright/report',
      },
    ],
  ],

  // https://playwright.dev/docs/test-webserver
  webServer: {
    command: `pnpm build && pnpm exec next start --port ${E2E_PORT}`,
    url: E2E_URL,
    // Reuse a server left running by a previous local run; CI always builds.
    reuseExistingServer: !env.CI,
    timeout: 5 * 60 * 1000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
      DEV_URL: E2E_URL,
      BETTER_AUTH_URL: E2E_URL,
      // No real side effects from a test run: reports, emails, uploads and
      // feedback fail fast instead of mailing people, filling the blob store
      // or opening GitHub issues. Specs assert the handled error. Resend
      // rejects an empty key at import, so it gets an invalid one instead.
      RESEND_API_KEY: E2E_RESEND_KEY,
      BLOB_READ_WRITE_TOKEN: '',
      GITHUB_TOKEN: '',
    },
  },

  use: {
    baseURL: E2E_URL,
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh',
    // Retry a test if its failing with enabled tracing. This allows you to analyze the DOM, console logs, network traffic etc.
    // More information: https://playwright.dev/docs/trace-viewer
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'auth',
      use: { ...devices['Desktop Chrome'] },
      testDir: 'e2e/auth',
    },

    // #region Setup project > Authenticated user(s)
    { name: 'setup', testMatch: 'e2e/setup/auth.ts' },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        // Full permissions: every create/edit/delete action is reachable.
        storageState: STORAGE_STATE.admin,
      },
      dependencies: ['setup'],
      // visual/** belongs to playwright.visual.config.ts
      testIgnore: ['e2e/auth/**', 'e2e/visual/**', 'e2e/player/**'],
    },
    {
      name: 'player',
      use: {
        ...devices['Desktop Chrome'],
        // A regular player: what a player can (and cannot) do.
        storageState: STORAGE_STATE.player,
      },
      dependencies: ['setup'],
      testDir: 'e2e/player',
    },
    // #endregion
  ],
});
