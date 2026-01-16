import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add retries for flaky tests locally
  workers: process.env.CI ? 1 : 2, // Further reduce workers to prevent resource exhaustion
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    // Set headless to false if HEADED environment variable is set
    headless: !process.env.HEADED,
    // Increase timeout to handle resource contention
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  timeout: 45000, // Overall test timeout

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Increased timeouts for mobile
        actionTimeout: 20000,
        navigationTimeout: 45000,
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Even longer timeouts for Safari which is slower
        actionTimeout: 25000,
        navigationTimeout: 60000,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});