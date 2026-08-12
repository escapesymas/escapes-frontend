import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 3100);
const BASE_URL = process.env.E2E_BASE_URL || (process.env.E2E_PROD === '1' ? 'https://escapesymas.com' : `http://127.0.0.1:${PORT}`);
const USE_PROD = BASE_URL.startsWith('https://');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: USE_PROD
    ? undefined
    : (process.env.E2E_NO_SERVER
      ? undefined
      : {
          command: `pnpm exec next start -p ${PORT}`,
          url: BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe',
        }),

  metadata: {
    product: 'Escapes y Más',
    base_url: BASE_URL,
  },
});
