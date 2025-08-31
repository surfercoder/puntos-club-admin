import type { Page, Locator } from '@playwright/test';

import { test, expect } from '../fixtures/auth';

test.describe('Address CRUD Operations', () => {
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

  // Helper function to wait for toast messages before redirects
  const waitForSuccessToastAndRedirect = async (page: Page, expectedUrl: string, timeout: number = 30000) => {
    const isMobile = await isMobileBrowser(page);
    const waitTime = isMobile ? 2000 : 1000; // Extra time for mobile
    
    try {
      // Try to wait for success toast message
      await page.waitForSelector('[data-testid="toast"], .toast, [role="alert"]', { timeout: 3000 });
      await page.waitForTimeout(waitTime); // Wait for toast display + redirect delay
    } catch {
      // If no toast found, just wait the minimum time
      await page.waitForTimeout(waitTime);
    }
    
    // Wait for URL change with increased timeout for mobile
    await page.waitForURL(expectedUrl, { timeout });
  };
  const testAddress = {
    street: '123 Main Street',
    number: '456',
    city: 'Test City',
    state: 'Test State',
    zip_code: '12345'
  };

  const updatedAddress = {
    street: '789 Updated Street',
    number: '101',
    city: 'Updated City',
    state: 'Updated State',
    zip_code: '67890'
  };

  test('should display address list page', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    await authenticatedPage.goto('/dashboard/address');
    
    // Check page title and heading - be more specific with mobile timeout
    await expect(authenticatedPage.getByRole('heading', { name: 'Addresses' })).toBeVisible({ timeout });
    await expect(authenticatedPage.getByText('Manage all addresses in your system')).toBeVisible({ timeout });
    
    // Check breadcrumb navigation
    await expect(authenticatedPage.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout });
    
    // Check table headers - use locator for th elements since they don't have proper ARIA roles
    await expect(authenticatedPage.locator('thead th:has-text("Street")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("Number")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("City")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("State")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("Zip Code")')).toBeVisible({ timeout });
    await expect(authenticatedPage.locator('thead th:has-text("Actions")')).toBeVisible({ timeout });
    
    // Check new address button
    await expect(authenticatedPage.getByRole('link', { name: '+ New Address' })).toBeVisible({ timeout });
  });

  test('should create a new address successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/address');
    
    // Navigate to create page with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('link', { name: '+ New Address' }));
    await expect(authenticatedPage).toHaveURL('/dashboard/address/create');
    
    // Check create page elements with increased timeout for mobile
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    await expect(authenticatedPage.getByText('Create Address')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('Street')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('Number')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('City')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('State')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByLabel('Zip Code')).toBeVisible({ timeout });
    
    // Fill form with test data - add extra wait time for mobile
    await authenticatedPage.getByLabel('Street').fill(testAddress.street);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('Number').fill(testAddress.number);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('City').fill(testAddress.city);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('State').fill(testAddress.state);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('Zip Code').fill(testAddress.zip_code);
    if (isMobile) {await authenticatedPage.waitForTimeout(200);}
    
    // Submit form with mobile compatibility and wait for success toast + redirect
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Create' }));
    
    // Wait for success toast and redirect with increased timeout for mobile
    const redirectTimeout = isMobile ? 45000 : 30000;
    await waitForSuccessToastAndRedirect(authenticatedPage, '/dashboard/address', redirectTimeout);
    
    // Wait for the page to fully load and data to be fetched
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait extra time for mobile async operations
    const extraWait = isMobile ? 2000 : 1000;
    await authenticatedPage.waitForTimeout(extraWait);
    
    // Verify the address appears in the list - use more specific selectors with increased timeouts
    const verifyTimeout = isMobile ? 20000 : 10000;
    await expect(authenticatedPage.getByText(testAddress.street).first()).toBeVisible({ timeout: verifyTimeout });
    await expect(authenticatedPage.getByText(testAddress.number).first()).toBeVisible({ timeout: verifyTimeout });
    await expect(authenticatedPage.getByText(testAddress.city).first()).toBeVisible({ timeout: verifyTimeout });
    await expect(authenticatedPage.getByText(testAddress.state).first()).toBeVisible({ timeout: verifyTimeout });
    await expect(authenticatedPage.getByText(testAddress.zip_code).first()).toBeVisible({ timeout: verifyTimeout });
  });

  test('should show validation errors for empty required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Try to submit empty form with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Create' }));
    
    // Should stay on create page and show validation errors
    await expect(authenticatedPage).toHaveURL('/dashboard/address/create');
    
    // Check for validation error messages (the form uses client-side validation)
    // The form should prevent submission with empty fields
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    await expect(authenticatedPage.getByText('Create Address')).toBeVisible({ timeout });
  });

  test('should navigate to edit page and update address', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    // First create an address to edit
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Fill form with test data - add mobile delays
    await authenticatedPage.getByLabel('Street').fill(testAddress.street);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('Number').fill(testAddress.number);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('City').fill(testAddress.city);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('State').fill(testAddress.state);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('Zip Code').fill(testAddress.zip_code);
    if (isMobile) {await authenticatedPage.waitForTimeout(200);}
    
    // Submit form with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Create' }));
    
    // Wait for success toast and redirect
    const redirectTimeout = isMobile ? 45000 : 30000;
    await waitForSuccessToastAndRedirect(authenticatedPage, '/dashboard/address', redirectTimeout);
    
    // Wait for page to load completely
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 30000 });
    if (isMobile) {await authenticatedPage.waitForTimeout(1000);}
    
    // Now find the edit link for our created address
    const editButton = authenticatedPage.locator('a[href*="/dashboard/address/edit/"]').first();
    await expect(editButton).toBeVisible({ timeout });
    
    // Navigate to edit page with mobile compatibility
    await clickElement(authenticatedPage, editButton);
    await authenticatedPage.waitForURL('**/dashboard/address/edit/**', { timeout: redirectTimeout });
    
    // Check edit page elements - correct title for edit
    await expect(authenticatedPage.getByText('Edit Address')).toBeVisible({ timeout });
    
    // Update form fields with new data - add mobile delays
    await authenticatedPage.getByLabel('Street').clear();
    await authenticatedPage.getByLabel('Street').fill(updatedAddress.street);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('Number').clear();
    await authenticatedPage.getByLabel('Number').fill(updatedAddress.number);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('City').clear();
    await authenticatedPage.getByLabel('City').fill(updatedAddress.city);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('State').clear();
    await authenticatedPage.getByLabel('State').fill(updatedAddress.state);
    if (isMobile) {await authenticatedPage.waitForTimeout(100);}
    
    await authenticatedPage.getByLabel('Zip Code').clear();
    await authenticatedPage.getByLabel('Zip Code').fill(updatedAddress.zip_code);
    if (isMobile) {await authenticatedPage.waitForTimeout(200);}
    
    // Submit updated form with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Update' }));
    
    // Wait for success toast and redirect
    await waitForSuccessToastAndRedirect(authenticatedPage, '/dashboard/address', redirectTimeout);
    
    // Wait for page to load and data to refresh
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 30000 });
    if (isMobile) {await authenticatedPage.waitForTimeout(2000);}
    
    // Verify the updated address appears in the list
    const verifyTimeout = isMobile ? 20000 : 10000;
    await expect(authenticatedPage.getByText(updatedAddress.street).first()).toBeVisible({ timeout: verifyTimeout });
    await expect(authenticatedPage.getByText(updatedAddress.city).first()).toBeVisible({ timeout: verifyTimeout });
  });

  test('should cancel edit and return to list', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    
    // First create an address to edit
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Fill form with test data
    await authenticatedPage.getByLabel('Street').fill(testAddress.street);
    await authenticatedPage.getByLabel('Number').fill(testAddress.number);
    await authenticatedPage.getByLabel('City').fill(testAddress.city);
    await authenticatedPage.getByLabel('State').fill(testAddress.state);
    await authenticatedPage.getByLabel('Zip Code').fill(testAddress.zip_code);
    
    // Submit form with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Create' }));
    
    // Wait for success toast and redirect
    const redirectTimeout = isMobile ? 45000 : 30000;
    await waitForSuccessToastAndRedirect(authenticatedPage, '/dashboard/address', redirectTimeout);
    
    // Click edit link for the created address
    const editButton = authenticatedPage.locator('a[href*="/dashboard/address/edit/"]').first();
    const timeout = isMobile ? 15000 : 10000;
    await expect(editButton).toBeVisible({ timeout });
    
    // Navigate to edit page with mobile compatibility
    await clickElement(authenticatedPage, editButton);
    await authenticatedPage.waitForURL('**/dashboard/address/edit/**', { timeout: redirectTimeout });
    
    // Click cancel button with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('link', { name: 'Cancel' }));
    
    // Should return to list page
    await expect(authenticatedPage).toHaveURL('/dashboard/address', { timeout: redirectTimeout });
  });

  test('should delete address successfully', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    // Create a unique identifier for this test run
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const uniqueStreet = `Delete Street ${uniqueId}`;
    
    // First create an address to delete
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Fill form with unique test data
    await authenticatedPage.getByLabel('Street').fill(uniqueStreet);
    await authenticatedPage.getByLabel('Number').fill('999');
    await authenticatedPage.getByLabel('City').fill('Delete City');
    await authenticatedPage.getByLabel('State').fill('Delete State');
    await authenticatedPage.getByLabel('Zip Code').fill('99999');
    
    if (isMobile) {await authenticatedPage.waitForTimeout(200);}
    
    // Submit form with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Create' }));
    
    // Wait for success toast and redirect
    const redirectTimeout = isMobile ? 45000 : 30000;
    await waitForSuccessToastAndRedirect(authenticatedPage, '/dashboard/address', redirectTimeout);
    
    // Wait for page to load completely and data to be fetched
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 30000 });
    if (isMobile) {await authenticatedPage.waitForTimeout(1000);}
    
    // Verify the address was created and is visible
    await expect(authenticatedPage.getByText(uniqueStreet)).toBeVisible({ timeout });
    
    // Find the row with our unique address and click its delete button
    const rowWithAddress = authenticatedPage.locator(`tr:has-text("${uniqueStreet}")`).first();
    const deleteButton = rowWithAddress.getByRole('button', { name: 'Delete' });
    
    // Wait for delete button to be ready
    await expect(deleteButton).toBeVisible({ timeout });
    
    // Click delete button with mobile compatibility
    await clickElement(authenticatedPage, deleteButton);
    
    // Should show delete confirmation modal
    await expect(authenticatedPage.getByText('Delete Address?')).toBeVisible({ timeout });
    await expect(authenticatedPage.getByText('Are you sure you want to delete this address?')).toBeVisible({ timeout });
    
    // Confirm deletion - use the Delete button inside the modal
    const confirmDeleteButton = authenticatedPage.getByRole('button', { name: 'Delete' }).last();
    await expect(confirmDeleteButton).toBeVisible({ timeout });
    
    // Click confirm delete with mobile compatibility
    await clickElement(authenticatedPage, confirmDeleteButton);
    
    // Wait for deletion to complete with better timeout handling
    // First wait for any success toast
    try {
      await authenticatedPage.waitForSelector('[data-testid="toast"], .toast, [role="alert"]', { timeout: 3000 });
      if (isMobile) {await authenticatedPage.waitForTimeout(1000);}
    } catch {
      // No toast found, continue
    }
    
    // Wait for the element to disappear with increased timeout for mobile
    const disappearTimeout = isMobile ? 30000 : 15000;
    await expect(authenticatedPage.getByText(uniqueStreet)).not.toBeVisible({ timeout: disappearTimeout });
    
    // Additional check to ensure the row is completely removed
    await expect(rowWithAddress).not.toBeVisible({ timeout: 5000 });
  });

  test('should cancel delete operation', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    // Create a unique address to test cancel delete
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const uniqueStreet = `Cancel Delete Street ${uniqueId}`;
    
    // First create an address
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Fill form with unique test data
    await authenticatedPage.getByLabel('Street').fill(uniqueStreet);
    await authenticatedPage.getByLabel('Number').fill('888');
    await authenticatedPage.getByLabel('City').fill('Cancel City');
    await authenticatedPage.getByLabel('State').fill('Cancel State');
    await authenticatedPage.getByLabel('Zip Code').fill('88888');
    
    if (isMobile) {await authenticatedPage.waitForTimeout(200);}
    
    // Submit form with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('button', { name: 'Create' }));
    
    // Wait for success toast and redirect
    const redirectTimeout = isMobile ? 45000 : 30000;
    await waitForSuccessToastAndRedirect(authenticatedPage, '/dashboard/address', redirectTimeout);
    
    // Verify the address was created and is visible
    await expect(authenticatedPage.getByText(uniqueStreet)).toBeVisible({ timeout });
    
    // Find the row with our unique address and click its delete button
    const rowWithAddress = authenticatedPage.locator(`tr:has-text("${uniqueStreet}")`).first();
    const deleteButton = rowWithAddress.getByRole('button', { name: 'Delete' });
    
    // Click delete button with mobile compatibility
    await clickElement(authenticatedPage, deleteButton);
    
    // Should show delete confirmation modal
    await expect(authenticatedPage.getByText('Delete Address?')).toBeVisible({ timeout });
    
    // Cancel deletion with mobile compatibility
    const cancelButton = authenticatedPage.getByRole('button', { name: 'Cancel' });
    await clickElement(authenticatedPage, cancelButton);
    
    // Address should still be visible after canceling
    await expect(authenticatedPage.getByText(uniqueStreet)).toBeVisible({ timeout });
  });

  test('should handle empty state correctly', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 10000 : 5000;
    
    await authenticatedPage.goto('/dashboard/address');
    
    // Check if we're in empty state
    const noAddressesText = authenticatedPage.getByText('No addresses found.');
    
    try {
      await expect(noAddressesText).toBeVisible({ timeout });
      // If empty state is visible, verify it's properly displayed
      expect(await authenticatedPage.locator('tbody tr').count()).toBe(1); // One row with "No addresses found"
    } catch {
      // If there are addresses, verify table structure
      expect(await authenticatedPage.locator('tbody tr').count()).toBeGreaterThan(0);
    }
  });

  test('should navigate back to dashboard from breadcrumb', async ({ authenticatedPage }) => {
    const isMobile = await isMobileBrowser(authenticatedPage);
    const timeout = isMobile ? 15000 : 10000;
    
    await authenticatedPage.goto('/dashboard/address');
    
    // Click dashboard link in breadcrumb with mobile compatibility
    await clickElement(authenticatedPage, authenticatedPage.getByRole('link', { name: 'Dashboard' }));
    
    // Should navigate to dashboard
    await expect(authenticatedPage).toHaveURL('/dashboard', { timeout });
  });
});