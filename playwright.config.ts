import env from '@env';
import { defineConfig, devices } from '@playwright/test';

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Timeout per test
  timeout: 20 * 1000,
  // Test directory
  testDir: 'e2e',
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: 'test-results/',
  // https://playwright.dev/docs/test-reporters#html-reporter
  reporter: [['html', { open: 'always', outputFolder: 'playwright/report' }]],

  // Run local dev server before starting the tests:
  // https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests
  webServer: {
    command: 'pnpm dev',
    url: env.DEV_URL,
    reuseExistingServer: !env.CI,
  },

  use: {
    // Use baseURL so to make navigations relative.
    // More information: https://playwright.dev/docs/api/class-testoptions#test-options-base-url
    baseURL: env.DEV_URL,

    // Retry a test if its failing with enabled tracing. This allows you to analyze the DOM, console logs, network traffic etc.
    // More information: https://playwright.dev/docs/trace-viewer
    trace: 'retry-with-trace',

    // All available context options: https://playwright.dev/docs/api/class-browser#browser-new-context
    // contextOptions: {
    //   ignoreHTTPSErrors: true,
    // },
  },

  projects: [
    {
      name: 'auth',
      use: { ...devices['Desktop Chrome'] },
      testDir: 'e2e/auth',
    },

    // #region Setup project > Authenticated users(s)
    { name: 'setup', testMatch: 'e2e/setup/auth.ts' },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        // Use prepared auth state.
        // Test with full permissions first
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: 'e2e/auth/**',
    },
    // #endregion

    /* Mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
});
