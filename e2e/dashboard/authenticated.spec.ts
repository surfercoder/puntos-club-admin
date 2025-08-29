import { test, expect } from '../fixtures/auth';

test.describe('Dashboard - Authenticated User', () => {
  test('should access dashboard when logged in', async ({ authenticatedPage }) => {
    // This test will automatically be logged in due to the fixture
    await expect(authenticatedPage).toHaveURL('/dashboard');
    
    // Add your dashboard-specific tests here
    await expect(authenticatedPage.getByText('Dashboard')).toBeVisible();
  });

  test('should be able to navigate to different sections', async ({ authenticatedPage }) => {
    // This test will also automatically be logged in
    await expect(authenticatedPage).toHaveURL('/dashboard');
    
    // Test navigation to specific category management page (not subcategory)
    const categoryLink = authenticatedPage.getByRole('link', { name: 'Manage Category' });
    await expect(categoryLink).toBeVisible();
    await categoryLink.click();
    await expect(authenticatedPage).toHaveURL('/dashboard/category');
  });
});