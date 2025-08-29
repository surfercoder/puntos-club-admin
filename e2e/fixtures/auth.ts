import { test as base, expect, Page } from '@playwright/test';

// Test credentials - replace with your actual test credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'test123456',
};

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Perform login before each test that uses this fixture
    await page.goto('/auth/login');
    
    // Wait for page to load
    await expect(page.getByText('Login', { exact: true }).first()).toBeVisible();
    
    // Fill in login form
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for navigation to dashboard (successful login)
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Use the authenticated page
    await use(page);
  },
});

export { expect } from '@playwright/test';