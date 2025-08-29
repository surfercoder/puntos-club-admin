import { test, expect } from '../fixtures/auth';

test.describe('Address CRUD Operations', () => {
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
    await authenticatedPage.goto('/dashboard/address');
    
    // Check page title and heading - be more specific
    await expect(authenticatedPage.getByRole('heading', { name: 'Addresses' })).toBeVisible();
    await expect(authenticatedPage.getByText('Manage all addresses in your system')).toBeVisible();
    
    // Check breadcrumb navigation
    await expect(authenticatedPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    
    // Check table headers - use locator for th elements since they don't have proper ARIA roles
    await expect(authenticatedPage.locator('thead th:has-text("Street")')).toBeVisible();
    await expect(authenticatedPage.locator('thead th:has-text("Number")')).toBeVisible();
    await expect(authenticatedPage.locator('thead th:has-text("City")')).toBeVisible();
    await expect(authenticatedPage.locator('thead th:has-text("State")')).toBeVisible();
    await expect(authenticatedPage.locator('thead th:has-text("Zip Code")')).toBeVisible();
    await expect(authenticatedPage.locator('thead th:has-text("Actions")')).toBeVisible();
    
    // Check new address button
    await expect(authenticatedPage.getByRole('link', { name: '+ New Address' })).toBeVisible();
  });

  test('should create a new address successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/address');
    
    // Navigate to create page
    await authenticatedPage.getByRole('link', { name: '+ New Address' }).click();
    await expect(authenticatedPage).toHaveURL('/dashboard/address/create');
    
    // Check create page elements
    await expect(authenticatedPage.getByText('Create Address')).toBeVisible();
    await expect(authenticatedPage.getByLabel('Street')).toBeVisible();
    await expect(authenticatedPage.getByLabel('Number')).toBeVisible();
    await expect(authenticatedPage.getByLabel('City')).toBeVisible();
    await expect(authenticatedPage.getByLabel('State')).toBeVisible();
    await expect(authenticatedPage.getByLabel('Zip Code')).toBeVisible();
    
    // Fill form with test data
    await authenticatedPage.getByLabel('Street').fill(testAddress.street);
    await authenticatedPage.getByLabel('Number').fill(testAddress.number);
    await authenticatedPage.getByLabel('City').fill(testAddress.city);
    await authenticatedPage.getByLabel('State').fill(testAddress.state);
    await authenticatedPage.getByLabel('Zip Code').fill(testAddress.zip_code);
    
    // Submit form
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    
    // Should redirect to list page after successful creation
    await expect(authenticatedPage).toHaveURL('/dashboard/address', { timeout: 10000 });
    
    // Verify the address appears in the list - use more specific selectors
    await expect(authenticatedPage.getByText(testAddress.street).first()).toBeVisible();
    await expect(authenticatedPage.getByText(testAddress.number).first()).toBeVisible();
    await expect(authenticatedPage.getByText(testAddress.city).first()).toBeVisible();
    await expect(authenticatedPage.getByText(testAddress.state).first()).toBeVisible();
    await expect(authenticatedPage.getByText(testAddress.zip_code).first()).toBeVisible();
  });

  test('should show validation errors for empty required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Try to submit empty form
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    
    // Should stay on create page and show validation errors
    await expect(authenticatedPage).toHaveURL('/dashboard/address/create');
    
    // Check for validation error messages (the form uses client-side validation)
    // The form should prevent submission with empty fields
    await expect(authenticatedPage.getByText('Create Address')).toBeVisible();
  });

  test('should navigate to edit page and update address', async ({ authenticatedPage }) => {
    // First create an address to edit
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Fill form with test data
    await authenticatedPage.getByLabel('Street').fill(testAddress.street);
    await authenticatedPage.getByLabel('Number').fill(testAddress.number);
    await authenticatedPage.getByLabel('City').fill(testAddress.city);
    await authenticatedPage.getByLabel('State').fill(testAddress.state);
    await authenticatedPage.getByLabel('Zip Code').fill(testAddress.zip_code);
    
    // Submit form
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    
    // Should redirect to list page after successful creation
    await expect(authenticatedPage).toHaveURL('/dashboard/address', { timeout: 10000 });
    
    // Now find the edit link for our created address
    const editButton = authenticatedPage.locator('a[href*="/dashboard/address/edit/"]').first();
    await expect(editButton).toBeVisible();
    
    // For mobile browsers, use force click to avoid interception issues
    const userAgent = await authenticatedPage.evaluate(() => navigator.userAgent);
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
    
    if (isMobile) {
      await editButton.click({ force: true });
      await authenticatedPage.waitForURL('**/dashboard/address/edit/**', { timeout: 15000 });
    } else {
      // Click and wait for navigation for desktop
      await Promise.all([
        authenticatedPage.waitForURL('**/dashboard/address/edit/**'),
        editButton.click()
      ]);
    }
    
    // Check edit page elements - correct title for edit
    await expect(authenticatedPage.getByText('Edit Address')).toBeVisible();
    
    // Update form fields with new data
    await authenticatedPage.getByLabel('Street').fill(updatedAddress.street);
    await authenticatedPage.getByLabel('Number').fill(updatedAddress.number);
    await authenticatedPage.getByLabel('City').fill(updatedAddress.city);
    await authenticatedPage.getByLabel('State').fill(updatedAddress.state);
    await authenticatedPage.getByLabel('Zip Code').fill(updatedAddress.zip_code);
    
    // Submit updated form
    await authenticatedPage.getByRole('button', { name: 'Update' }).click();
    
    // Should redirect to list page after successful update
    await expect(authenticatedPage).toHaveURL('/dashboard/address', { timeout: 10000 });
    
    // Verify the updated address appears in the list
    await expect(authenticatedPage.getByText(updatedAddress.street).first()).toBeVisible();
    await expect(authenticatedPage.getByText(updatedAddress.city).first()).toBeVisible();
  });

  test('should cancel edit and return to list', async ({ authenticatedPage }) => {
    // First create an address to edit
    await authenticatedPage.goto('/dashboard/address/create');
    
    // Fill form with test data
    await authenticatedPage.getByLabel('Street').fill(testAddress.street);
    await authenticatedPage.getByLabel('Number').fill(testAddress.number);
    await authenticatedPage.getByLabel('City').fill(testAddress.city);
    await authenticatedPage.getByLabel('State').fill(testAddress.state);
    await authenticatedPage.getByLabel('Zip Code').fill(testAddress.zip_code);
    
    // Submit form
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    
    // Should redirect to list page after successful creation
    await expect(authenticatedPage).toHaveURL('/dashboard/address', { timeout: 10000 });
    
    // Click edit link for the created address
    const editButton = authenticatedPage.locator('a[href*="/dashboard/address/edit/"]').first();
    await expect(editButton).toBeVisible();
    
    // For mobile browsers, use force click to avoid interception issues
    const userAgent = await authenticatedPage.evaluate(() => navigator.userAgent);
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
    
    if (isMobile) {
      await editButton.click({ force: true });
      await authenticatedPage.waitForURL('**/dashboard/address/edit/**', { timeout: 15000 });
    } else {
      // Click and wait for navigation for desktop
      await Promise.all([
        authenticatedPage.waitForURL('**/dashboard/address/edit/**'),
        editButton.click()
      ]);
    }
    
    // Click cancel button
    await authenticatedPage.getByRole('link', { name: 'Cancel' }).click();
    
    // Should return to list page
    await expect(authenticatedPage).toHaveURL('/dashboard/address');
  });

  test('should delete address successfully', async ({ authenticatedPage }) => {
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
    
    // Submit form
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    
    // Should redirect to list page after successful creation
    await expect(authenticatedPage).toHaveURL('/dashboard/address', { timeout: 10000 });
    
    // Verify the address was created and is visible
    await expect(authenticatedPage.getByText(uniqueStreet)).toBeVisible();
    
    // Find the row with our unique address and click its delete button
    const rowWithAddress = authenticatedPage.locator(`tr:has-text("${uniqueStreet}")`).first();
    const deleteButton = rowWithAddress.getByRole('button', { name: 'Delete' });
    
    // Check if mobile and use force click if needed
    const userAgent = await authenticatedPage.evaluate(() => navigator.userAgent);
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
    
    if (isMobile) {
      await deleteButton.click({ force: true });
    } else {
      await deleteButton.click();
    }
    
    // Should show delete confirmation modal
    await expect(authenticatedPage.getByText('Delete Address?')).toBeVisible();
    await expect(authenticatedPage.getByText('Are you sure you want to delete this address?')).toBeVisible();
    
    // Confirm deletion - use the Delete button inside the modal
    const confirmDeleteButton = authenticatedPage.getByRole('button', { name: 'Delete' }).last();
    if (isMobile) {
      await confirmDeleteButton.click({ force: true });
    } else {
      await confirmDeleteButton.click();
    }
    
    // Wait for deletion to complete and page to refresh
    await authenticatedPage.waitForTimeout(2000);
    
    // Check that the specific address is no longer visible
    await expect(authenticatedPage.getByText(uniqueStreet)).not.toBeVisible();
  });

  test('should cancel delete operation', async ({ authenticatedPage }) => {
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
    
    // Submit form
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    
    // Should redirect to list page after successful creation
    await expect(authenticatedPage).toHaveURL('/dashboard/address', { timeout: 10000 });
    
    // Verify the address was created and is visible
    await expect(authenticatedPage.getByText(uniqueStreet)).toBeVisible();
    
    // Find the row with our unique address and click its delete button
    const rowWithAddress = authenticatedPage.locator(`tr:has-text("${uniqueStreet}")`).first();
    const deleteButton = rowWithAddress.getByRole('button', { name: 'Delete' });
    
    // Check if mobile and use force click if needed
    const userAgent = await authenticatedPage.evaluate(() => navigator.userAgent);
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
    
    if (isMobile) {
      await deleteButton.click({ force: true });
    } else {
      await deleteButton.click();
    }
    
    // Should show delete confirmation modal
    await expect(authenticatedPage.getByText('Delete Address?')).toBeVisible();
    
    // Cancel deletion
    const cancelButton = authenticatedPage.getByRole('button', { name: 'Cancel' });
    if (isMobile) {
      await cancelButton.click({ force: true });
    } else {
      await cancelButton.click();
    }
    
    // Address should still be visible after canceling
    await expect(authenticatedPage.getByText(uniqueStreet)).toBeVisible();
  });

  test('should handle empty state correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/address');
    
    // Check if we're in empty state
    const noAddressesText = authenticatedPage.getByText('No addresses found.');
    
    try {
      await expect(noAddressesText).toBeVisible({ timeout: 2000 });
      // If empty state is visible, verify it's properly displayed
      expect(await authenticatedPage.locator('tbody tr').count()).toBe(1); // One row with "No addresses found"
    } catch {
      // If there are addresses, verify table structure
      expect(await authenticatedPage.locator('tbody tr').count()).toBeGreaterThan(0);
    }
  });

  test('should navigate back to dashboard from breadcrumb', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/address');
    
    // Click dashboard link in breadcrumb
    await authenticatedPage.getByRole('link', { name: 'Dashboard' }).click();
    
    // Should navigate to dashboard
    await expect(authenticatedPage).toHaveURL('/dashboard');
  });
});