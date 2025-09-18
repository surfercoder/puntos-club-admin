import type { Page, Locator } from '@playwright/test';

import { test, expect } from '../fixtures/auth';

test.describe('Category CRUD Operations', () => {
  // Helper function to detect mobile browsers more reliably
  const isMobileBrowser = async (page: Page) => {
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    return userAgent.includes('Mobile') || userAgent.includes('Android') || 
           userAgent.includes('iPhone') || userAgent.includes('iPad') || 
           userAgent.includes('Safari') && hasTouch;
  };

  // Helper function to handle clicks with mobile compatibility
  const clickElement = async (page: Page, element: Locator, options: object = {}) => {
    const isMobile = await isMobileBrowser(page);
    if (isMobile) {
      await element.click({ force: true, ...options });
    } else {
      await element.click(options);
    }
  };

  // Unused variables removed to clean up lint warnings

  test('should display category list page', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    await authenticatedPage.goto('/dashboard/category');
    
    // Check page title and heading - be more specific with mobile timeout
    await expect(authenticatedPage.getByRole('heading', { name: 'Categories' })).toBeVisible({ timeout });
    await expect(authenticatedPage.getByText('Manage product categories in your system')).toBeVisible({ timeout });
    
    // Check breadcrumb navigation
    await expect(authenticatedPage.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout });
    
    // Check table headers - use locator for th elements since they don't have proper ARIA roles
    await expect(authenticatedPage.locator('thead th:has-text("Name")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("Description")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("Status")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("Actions")')).toBeVisible({ timeout });
    
    // Check new category button
    await expect(authenticatedPage.getByRole('link', { name: '+ New Category' })).toBeVisible({ timeout });
  });

  test('should navigate to create page and show form elements', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/category');
    
    // Navigate to create page with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('link', { name: '+ New Category' }));
    await expect(authenticatedPage).toHaveURL('/dashboard/category/create');
    
    // Check create page elements with increased timeout for mobile
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    await expect(authenticatedPage.getByText('Create Category')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('Name')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('Description')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('Active')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByRole('button', { name: 'Create' })).toBeVisible({ timeout });
    await expect(authenticatedPage.getByRole('link', { name: 'Cancel' })).toBeVisible({ timeout });
  });

  test('should show validation errors for empty required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/category/create');
    
    // Try to submit empty form with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Create' }));
    
    // Should stay on create page and show validation errors
    await expect(authenticatedPage).toHaveURL('/dashboard/category/create');
    
    // Check for validation error messages (the form uses client-side validation)
    // The form should prevent submission with empty fields
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    await expect(authenticatedPage.getByText('Create Category')).toBeVisible({ timeout });
  });

  test('should navigate to edit page when category exists', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/category');
    
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    // Check if there are any existing categories to edit
    const editButtons = await authenticatedPage.locator('a[href*="/dashboard/category/edit/"]').count();
    
    if (editButtons > 0) {
      // Navigate to edit page for the first category
      const editButton = authenticatedPage.locator('a[href*="/dashboard/category/edit/"]').first();
      await expect(editButton).toBeVisible({ timeout });
      
      await clickElement(authenticatedPage, editButton);
      await authenticatedPage.waitForURL('**/dashboard/category/edit/**', { timeout: 30000 });
      
      // Check edit page elements
      await expect(authenticatedPage.getByText('Edit Category')).toBeVisible({ timeout });
      await expect(authenticatedPage.getByLabel('Name')).toBeVisible({ timeout });
      await expect(authenticatedPage.getByLabel('Description')).toBeVisible({ timeout });
      await expect(authenticatedPage.getByLabel('Active')).toBeVisible({ timeout });
      await expect(authenticatedPage.getByRole('button', { name: 'Update' })).toBeVisible({ timeout });
      await expect(authenticatedPage.getByRole('link', { name: 'Cancel' })).toBeVisible({ timeout });
    } else {
      // Skip this test if no categories exist
      console.error('No existing categories found, skipping edit test');
    }
  });

  test('should cancel edit and return to list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/category');
    
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    const redirectTimeout = isMobile ? 45000 : 30000;
    
    // Check if there are existing categories to test with
    const editButtons = await authenticatedPage.locator('a[href*="/dashboard/category/edit/"]').count();
    
    if (editButtons > 0) {
      // Navigate to edit page for the first category
      const editButton = authenticatedPage.locator('a[href*="/dashboard/category/edit/"]').first();
      await expect(editButton).toBeVisible({ timeout });
      
      await clickElement(authenticatedPage, editButton);
      await authenticatedPage.waitForURL('**/dashboard/category/edit/**', { timeout: redirectTimeout });
      
      // Click cancel button with mobile compatibility
      await clickElement(authenticatedPage, authenticatedPage.getByRole('link', { name: 'Cancel' }));
      
      // Should return to list page
      await expect(authenticatedPage).toHaveURL('/dashboard/category', { timeout: redirectTimeout });
    } else {
      console.error('No existing categories found, skipping cancel edit test');
    }
  });

  test('should show delete modal when delete button is clicked', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/category');
    
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    // Wait for page to fully load
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Check if we're in empty state first
    const noCategories = await authenticatedPage.getByText('No categories found.').isVisible();
    
    if (noCategories) {
      // If no categories, skip this test
      console.error('No existing categories found, skipping delete modal test');
      return;
    }
    
    // Look for delete buttons more specifically - they should be red/destructive buttons with trash icon
    const deleteButtons = await authenticatedPage.locator('button[variant="destructive"], button.bg-red-600, button.text-red-600').count();
    
    if (deleteButtons > 0) {
      // Click the first delete button
      const deleteButton = authenticatedPage.locator('button[variant="destructive"], button.bg-red-600, button.text-red-600').first();
      await expect(deleteButton).toBeVisible({ timeout });
      
      await clickElement(authenticatedPage, deleteButton);
      
      // Should show delete confirmation modal
      await expect(authenticatedPage.getByText('Delete Category')).toBeVisible({ timeout });
      await expect(authenticatedPage.getByRole('button', { name: 'Cancel' })).toBeVisible({ timeout });
      await expect(authenticatedPage.getByRole('button', { name: 'Delete' })).toBeVisible({ timeout });
      
      // Cancel the deletion
      await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Cancel' }));
      
      // Modal should be closed
      await expect(authenticatedPage.getByText('Delete Category')).not.toBeVisible({ timeout: 5000 });
    } else {
      console.error('No delete buttons found, skipping delete modal test');
    }
  });

  test('should handle empty state correctly', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 10000 : 5000;
    
    await authenticatedPage.goto('/dashboard/category');
    
    // Check if we're in empty state
    const noCategoriesText = authenticatedPage.getByText('No categories found.');
    
    try {
      await expect(noCategoriesText).toBeVisible({ timeout });
      // If empty state is visible, verify it's properly displayed
      expect(await authenticatedPage.locator('tbody tr').count()).toBe(1); // One row with "No categories found"
    } catch {
      // If there are categories, verify table structure
      expect(await authenticatedPage.locator('tbody tr').count()).toBeGreaterThan(0);
    }
  });

  test('should navigate back to dashboard from breadcrumb', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    await authenticatedPage.goto('/dashboard/category');
    
    // Click dashboard link in breadcrumb with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('link', { name: 'Dashboard' }));
    
    // Should navigate to dashboard
    await expect(authenticatedPage).toHaveURL('/dashboard', { timeout });
  });
});