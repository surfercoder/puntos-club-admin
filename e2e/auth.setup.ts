import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';

setup('authenticate as owner', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('agustinscassani@gmail.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('Asc171081!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('heading', { level: 1 }).or(page.locator('main'))).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: STORAGE_STATE });
});
