import { defineConfig, devices } from '@playwright/test';

// Use environment variable for base URL, fallback to localhost
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isDeployedTest = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // Increase timeout for deployed tests (they're slower)
  timeout: isDeployedTest ? 60000 : 30000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Increase action timeout for deployed tests
    actionTimeout: isDeployedTest ? 15000 : 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only start local dev server if not testing deployed app
  webServer: isDeployedTest ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
