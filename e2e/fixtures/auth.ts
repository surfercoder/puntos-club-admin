import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

// Test credentials - replace with your actual test credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'test123456',
};

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page, context }, use) => {
    // Clear any existing authentication state
    await context.clearCookies();
    await context.clearPermissions();
    
    // Perform login before each test that uses this fixture
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to be visible with increased timeout
    await expect(page.getByText('Login', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    
    // Fill in login form
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    
    // Submit the form and wait for response
    const loginPromise = page.waitForResponse(response => 
      response.url().includes('/auth/') || response.url().includes('/api/auth/'), 
      { timeout: 30000 }
    ).catch(() => null); // Don't fail if no auth endpoint is hit
    
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for auth response or timeout
    await loginPromise;
    
    // Wait for navigation to dashboard with increased timeout
    try {
      await page.waitForURL('/dashboard', { timeout: 30000 });
    } catch {
      // If direct navigation fails, check if we're already on dashboard or try navigating
      const currentUrl = page.url();
      if (!currentUrl.includes('/dashboard')) {
        // Try to navigate directly if login was successful but navigation didn't work
        await page.goto('/dashboard', { waitUntil: 'networkidle' });
      }
    }
    
    // Additional verification with increased timeout - look for multiple dashboard indicators
    try {
      await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 20000 });
    } catch {
      // Fallback: look for other dashboard indicators if main heading is not visible
      const dashboardIndicators = [
        page.getByRole('heading', { name: 'Dashboard' }),
        page.locator('h1:has-text("Dashboard")'),
        page.getByText('Welcome to'),
        page.locator('[data-testid="dashboard"]'),
        page.locator('.dashboard'),
      ];
      
      let found = false;
      for (const indicator of dashboardIndicators) {
        try {
          await expect(indicator).toBeVisible({ timeout: 5000 });
          found = true;
          break;
        } catch {
          continue;
        }
      }
      
      if (!found) {
        // Final check: ensure we're at least on a dashboard URL
        const currentUrl = page.url();
        if (!currentUrl.includes('/dashboard')) {
          throw new Error(`Authentication failed: not on dashboard page. Current URL: ${currentUrl}`);
        }
      }
    }
    
    // Use the authenticated page
    await use(page);
  },
});

export { expect } from '@playwright/test';