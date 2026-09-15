import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests drive the real app against the real database, so they run
 * serially: every spec creates its own screen and the teardown deletes them.
 */
/** Own port so the suite never collides with another project's dev server. */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      // Uses the Chrome already installed on the machine, so no browser
      // download is needed to run the suite.
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `${BASE_URL}/s`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
