import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests serially to maintain DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Serial execution for CRUD dependency ordering
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    headless: !process.env.HEADED,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
  },
  timeout: 60000,

  projects: [
    // Setup project: authenticates and saves state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main test project: uses authenticated state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
