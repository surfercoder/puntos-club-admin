import { test, expect, type Page } from '@playwright/test';

/**
 * E2E CRUD tests for the Owner Dashboard.
 *
 * Dependency order: Category → Product → Stock, AppOrder, Beneficiary, PointsRule
 * Cleanup in reverse order to leave DB pristine.
 */

// ── helpers ──────────────────────────────────────────────────────────────────

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('main').waitFor({ state: 'visible', timeout: 15000 });
  // Wait for client-side hydration and network to settle
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);
}

/**
 * Fill an input field reliably, retrying if React hydration clears the value.
 * This handles the case where SSR hydration replaces DOM elements after fill.
 */
async function fillReliably(page: Page, selector: string, value: string, maxRetries = 5) {
  const locator = page.locator(selector);
  for (let i = 0; i < maxRetries; i++) {
    await locator.click();
    await locator.fill(value);
    await page.waitForTimeout(300);
    const current = await locator.inputValue();
    if (current === value) return;
    // Value was cleared by hydration, wait and retry
    await page.waitForTimeout(1000);
  }
  // Final attempt - use evaluate to set value directly
  await page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel) as HTMLInputElement;
    if (el) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;
      nativeInputValueSetter?.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, { sel: selector, val: value });
}

async function navigateTo(page: Page, url: string) {
  await page.goto(url);
  await waitForPageLoad(page);
}

async function getTableRowCount(page: Page): Promise<number> {
  const tbody = page.locator('table tbody');
  if (await tbody.isVisible({ timeout: 3000 }).catch(() => false)) {
    return tbody.locator('tr').count();
  }
  return 0;
}

async function deleteRowByText(page: Page, text: string): Promise<boolean> {
  const row = page.locator('table tbody tr', { hasText: text });
  if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) return false;

  const deleteBtn = row.locator('td').last().locator('button').last();
  await deleteBtn.click();

  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
  const confirmBtn = dialog.getByRole('button', { name: /eliminar|borrar|delete|confirm/i });
  await confirmBtn.click();
  await dialog.waitFor({ state: 'hidden', timeout: 15000 });
  await page.waitForTimeout(1000);
  return true;
}

// ── state ───────────────────────────────────────────────────────────────────

const state = {
  categoryRows: 0,
  productRows: 0,
  orderRows: 0,
  beneficiaryRows: 0,
  stockRows: 0,
};

// ── CRUD tests (serial) ─────────────────────────────────────────────────────

test.describe.serial('Owner Dashboard CRUD Tests', () => {

  // ━━━ 1. CATEGORY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Category: list', async ({ page }) => {
    await navigateTo(page, '/dashboard/category');
    await expect(page.getByRole('heading', { name: 'Categorías', level: 1 })).toBeVisible();
    state.categoryRows = await getTableRowCount(page);
  });

  test('Category: create', async ({ page }) => {
    await navigateTo(page, '/dashboard/category/create');
    await expect(page.getByText('Crear Categoría')).toBeVisible();

    await fillReliably(page, '#name', 'E2E Test Category');
    await expect(page.locator('#name')).toHaveValue('E2E Test Category');

    await fillReliably(page, '#description', 'Created by e2e test');

    await page.getByRole('button', { name: /^crear$/i }).click();

    // The category form does a server-side redirect to /dashboard/category?success=...
    // Wait specifically for the list page URL with query params
    await page.waitForURL(/\/dashboard\/category\?/, { timeout: 30000 });
    await waitForPageLoad(page);
    await expect(page.getByText('E2E Test Category')).toBeVisible({ timeout: 10000 });
  });

  test('Category: edit', async ({ page }) => {
    await navigateTo(page, '/dashboard/category');

    const row = page.locator('table tbody tr', { hasText: 'E2E Test Category' });
    await row.locator('td').last().locator('a').first().click();
    await waitForPageLoad(page);

    await fillReliably(page, '#name', 'E2E Category Updated');
    await expect(page.locator('#name')).toHaveValue('E2E Category Updated');

    await page.getByRole('button', { name: /actualizar|update/i }).click();

    await page.waitForURL(/\/dashboard\/category\?/, { timeout: 30000 });
    await waitForPageLoad(page);
    await expect(page.getByText('E2E Category Updated')).toBeVisible({ timeout: 10000 });
  });

  // ━━━ 2. PRODUCT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Product: list', async ({ page }) => {
    await navigateTo(page, '/dashboard/product');
    await expect(page.getByRole('heading', { name: 'Productos', level: 1 })).toBeVisible();
    state.productRows = await getTableRowCount(page);
  });

  test('Product: create', async ({ page }) => {
    await navigateTo(page, '/dashboard/product/create');

    // Check plan limit
    if (await page.getByText(/límite de plan alcanzado/i).isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Product plan limit reached');
      return;
    }

    await expect(page.getByText('Crear Producto')).toBeVisible();

    // Wait for categories to load (submit button becomes enabled)
    const submitBtn = page.getByRole('button', { name: /^crear$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });

    // The product form uses a native <select> for category
    const categorySelect = page.locator('select[name="category_id"]');
    await categorySelect.selectOption({ label: 'E2E Category Updated' });

    await page.locator('#name, input[name="name"]').first().fill('E2E Test Product');
    await page.locator('#description, textarea[name="description"]').first().fill('Created by e2e test');
    await page.locator('input[name="required_points"]').fill('50');

    await submitBtn.click();

    // Product form does client-side redirect
    await page.waitForURL(/\/dashboard\/product$/, { timeout: 20000 });
    await waitForPageLoad(page);
    await expect(page.getByText('E2E Test Product')).toBeVisible({ timeout: 10000 });
  });

  test('Product: edit', async ({ page }) => {
    await navigateTo(page, '/dashboard/product');

    const row = page.locator('table tbody tr', { hasText: 'E2E Test Product' });
    if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Product was not created');
      return;
    }

    await row.locator('td').last().locator('a').first().click();
    await waitForPageLoad(page);

    // Wait for categories to load (submit button becomes enabled)
    const updateBtn = page.getByRole('button', { name: /actualizar|update/i });
    await expect(updateBtn).toBeEnabled({ timeout: 15000 });

    await page.locator('#name, input[name="name"]').first().clear();
    await page.locator('#name, input[name="name"]').first().fill('E2E Product Updated');
    await page.locator('input[name="required_points"]').clear();
    await page.locator('input[name="required_points"]').fill('75');

    await updateBtn.click();

    await page.waitForURL(/\/dashboard\/product$/, { timeout: 20000 });
    await waitForPageLoad(page);
    await expect(page.getByText('E2E Product Updated')).toBeVisible({ timeout: 10000 });
  });

  // ━━━ 3. APP ORDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('App Order: list', async ({ page }) => {
    await navigateTo(page, '/dashboard/app_order');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    state.orderRows = await getTableRowCount(page);
  });

  test('App Order: create', async ({ page }) => {
    await navigateTo(page, '/dashboard/app_order/create');

    await page.locator('input[name="order_number"]').fill('E2E-ORD-001');

    const dateInput = page.locator('input[name="creation_date"], input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-03-15');
    }

    await page.locator('input[name="total_points"]').fill('100');

    const obs = page.locator('textarea[name="observations"], input[name="observations"]').first();
    if (await obs.isVisible().catch(() => false)) {
      await obs.fill('E2E test order');
    }

    await page.getByRole('button', { name: /^crear$/i }).click();

    await page.waitForURL(/\/dashboard\/app_order(?:\?|$)/, { timeout: 20000 });
    await waitForPageLoad(page);
    await expect(page.getByText('E2E-ORD-001')).toBeVisible({ timeout: 10000 });
  });

  test('App Order: edit', async ({ page }) => {
    await navigateTo(page, '/dashboard/app_order');

    const row = page.locator('table tbody tr', { hasText: 'E2E-ORD-001' });
    await row.locator('td').last().locator('a').first().click();
    await waitForPageLoad(page);

    const obs = page.locator('textarea[name="observations"], input[name="observations"]').first();
    if (await obs.isVisible().catch(() => false)) {
      await obs.clear();
      await obs.fill('E2E order updated');
    }

    await page.getByRole('button', { name: /actualizar|update/i }).click();

    await page.waitForURL(/\/dashboard\/app_order(?:\?|$)/, { timeout: 20000 });
    await waitForPageLoad(page);
  });

  // ━━━ 4. BENEFICIARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Beneficiary: list', async ({ page }) => {
    await navigateTo(page, '/dashboard/beneficiary');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    state.beneficiaryRows = await getTableRowCount(page);
  });

  test('Beneficiary: create', async ({ page }) => {
    await navigateTo(page, '/dashboard/beneficiary/create');

    if (await page.getByText(/límite de plan alcanzado/i).isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Beneficiary plan limit reached');
      return;
    }

    await page.locator('input[name="first_name"]').fill('E2ETest');
    await page.locator('input[name="last_name"]').fill('Beneficiary');
    await page.locator('input[name="email"]').fill('e2e-beneficiary@test.com');
    await page.locator('input[name="phone"]').fill('+5491122334455');
    await page.locator('input[name="document_id"]').fill('99887766');

    await page.getByRole('button', { name: /^crear$/i }).click();

    await page.waitForURL(/\/dashboard\/beneficiary(?:\?|$)/, { timeout: 20000 });
    await waitForPageLoad(page);
    await expect(page.getByText('E2ETest')).toBeVisible({ timeout: 10000 });
  });

  test('Beneficiary: edit', async ({ page }) => {
    await navigateTo(page, '/dashboard/beneficiary');

    const row = page.locator('table tbody tr', { hasText: 'E2ETest' });
    if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Beneficiary not created');
      return;
    }

    await row.locator('td').last().locator('a').first().click();
    await waitForPageLoad(page);

    await page.locator('input[name="phone"]').clear();
    await page.locator('input[name="phone"]').fill('+5491155667788');

    await page.getByRole('button', { name: /actualizar|update/i }).click();

    await page.waitForURL(/\/dashboard\/beneficiary(?:\?|$)/, { timeout: 20000 });
    await waitForPageLoad(page);
  });

  // ━━━ 5. POINTS RULE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Points Rule: create', async ({ page }) => {
    await navigateTo(page, '/dashboard/points-rules/new');

    await page.locator('#name').fill('E2E Test Rule');
    await page.locator('#description').fill('E2E test');

    const ppd = page.locator('#points_per_dollar');
    if (await ppd.isVisible()) {
      await ppd.clear();
      await ppd.fill('5');
    }

    await page.locator('button[type="submit"]').click();

    // Points rule uses router.push - wait for navigation away from /new
    await expect(page).not.toHaveURL(/\/new$/, { timeout: 30000 });
    await waitForPageLoad(page);
    // Navigate to the list to verify
    await navigateTo(page, '/dashboard/points-rules');
    await expect(page.getByText('E2E Test Rule').first()).toBeVisible({ timeout: 10000 });
  });

  test('Points Rule: edit', async ({ page }) => {
    await navigateTo(page, '/dashboard/points-rules');

    // Points rules page uses a table with edit links
    const row = page.locator('table tbody tr', { hasText: 'E2E Test Rule' }).first();
    const editLink = row.locator('a[href*="edit"]').first();
    if (!(await editLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Cannot find edit link for points rule');
      return;
    }
    await editLink.click();
    await waitForPageLoad(page);

    await page.locator('#name').clear();
    await page.locator('#name').fill('E2E Rule Updated');

    await page.locator('button[type="submit"]').click();

    await expect(page).not.toHaveURL(/\/edit\//, { timeout: 30000 });
    await waitForPageLoad(page);
    await navigateTo(page, '/dashboard/points-rules');
    await expect(page.getByText('E2E Rule Updated').first()).toBeVisible({ timeout: 10000 });
  });

  // ━━━ 6. STOCK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Stock: list', async ({ page }) => {
    await navigateTo(page, '/dashboard/stock');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    state.stockRows = await getTableRowCount(page);
  });

  test('Stock: create', async ({ page }) => {
    await navigateTo(page, '/dashboard/stock/create');

    // Select branch (first available)
    const branchSelect = page.locator('select[name="branch_id"]').first();
    if (await branchSelect.isVisible().catch(() => false)) {
      await branchSelect.selectOption({ index: 1 });
    }

    // Select product (first available)
    const productSelect = page.locator('select[name="product_id"]').first();
    if (await productSelect.isVisible().catch(() => false)) {
      await productSelect.selectOption({ index: 1 });
    }

    await page.locator('input[name="quantity"]').fill('100');

    const minQty = page.locator('input[name="minimum_quantity"]');
    if (await minQty.isVisible().catch(() => false)) {
      await minQty.fill('10');
    }

    await page.getByRole('button', { name: /^crear$/i }).click();

    await page.waitForURL(/\/dashboard\/stock(?:\?|$)/, { timeout: 20000 });
    await waitForPageLoad(page);
  });

  test('Stock: edit', async ({ page }) => {
    await navigateTo(page, '/dashboard/stock');
    const count = await getTableRowCount(page);
    if (count <= state.stockRows) {
      test.skip(true, 'Stock not created');
      return;
    }

    const lastRow = page.locator('table tbody tr').last();
    await lastRow.locator('td').last().locator('a').first().click();
    await waitForPageLoad(page);

    await page.locator('input[name="quantity"]').clear();
    await page.locator('input[name="quantity"]').fill('200');

    await page.getByRole('button', { name: /actualizar|update/i }).click();

    await page.waitForURL(/\/dashboard\/stock(?:\?|$)/, { timeout: 20000 });
    await waitForPageLoad(page);
  });

  // ━━━ 7. BRANCH (edit only — plan limited) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Branch: shows plan limit', async ({ page }) => {
    await navigateTo(page, '/dashboard/branch');
    await expect(page.getByRole('heading', { name: /sucursales/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/límite alcanzado/i)).toBeVisible();
  });

  test('Branch: edit existing', async ({ page }) => {
    await navigateTo(page, '/dashboard/branch');
    const row = page.locator('table tbody tr', { hasText: 'Guaymallen' });
    await row.locator('td').last().locator('a').first().click();
    await waitForPageLoad(page);

    await page.getByRole('button', { name: /actualizar|update/i }).click();
    await page.waitForURL(/\/dashboard\/branch(?:\?|$)/, { timeout: 20000 });
    await waitForPageLoad(page);
  });

  // ━━━ 8. READ-ONLY PAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('QR Code page loads', async ({ page }) => {
    await navigateTo(page, '/dashboard/qr');
    await expect(page.locator('main')).toBeVisible();
  });

  test('Profile page loads', async ({ page }) => {
    await navigateTo(page, '/dashboard/profile');
    await expect(page.locator('main')).toBeVisible();
  });

  test('Users page loads', async ({ page }) => {
    await navigateTo(page, '/dashboard/users');
    await expect(page.locator('main')).toBeVisible();
  });

  test('Notifications page loads', async ({ page }) => {
    await navigateTo(page, '/dashboard/notifications');
    await expect(page.locator('main')).toBeVisible();
  });

  // ━━━ CLEANUP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Cleanup: stock', async ({ page }) => {
    await navigateTo(page, '/dashboard/stock');
    const count = await getTableRowCount(page);
    if (count > state.stockRows) {
      const lastRow = page.locator('table tbody tr').last();
      const deleteBtn = lastRow.locator('td').last().locator('button').last();
      await deleteBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await dialog.waitFor({ state: 'visible', timeout: 5000 });
      await dialog.getByRole('button', { name: /eliminar|borrar|delete|confirm/i }).click();
      await dialog.waitFor({ state: 'hidden', timeout: 15000 });
    }
  });

  test('Cleanup: points rule', async ({ page }) => {
    await navigateTo(page, '/dashboard/points-rules');
    await waitForPageLoad(page);

    const ruleEl = page.getByText(/E2E.*Rule/i).first();
    if (await ruleEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      const container = page.locator('table tbody tr, [class*="card"]', { hasText: /E2E.*Rule/i }).first();
      const btns = container.locator('button');
      const deleteBtn = btns.last();
      await deleteBtn.click();
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dialog.getByRole('button', { name: /eliminar|borrar|delete|confirm/i }).click();
        await dialog.waitFor({ state: 'hidden', timeout: 15000 });
      }
    }
  });

  test('Cleanup: beneficiary', async ({ page }) => {
    await navigateTo(page, '/dashboard/beneficiary');
    await deleteRowByText(page, 'E2ETest');
  });

  test('Cleanup: app order', async ({ page }) => {
    await navigateTo(page, '/dashboard/app_order');
    await deleteRowByText(page, 'E2E-ORD-001');
  });

  test('Cleanup: product', async ({ page }) => {
    await navigateTo(page, '/dashboard/product');
    const d = await deleteRowByText(page, 'E2E Product Updated');
    if (!d) await deleteRowByText(page, 'E2E Test Product');
  });

  test('Cleanup: category', async ({ page }) => {
    await navigateTo(page, '/dashboard/category');
    const d = await deleteRowByText(page, 'E2E Category Updated');
    if (!d) await deleteRowByText(page, 'E2E Test Category');
  });

  // ━━━ VERIFICATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('Verify: counts restored', async ({ page }) => {
    await navigateTo(page, '/dashboard/category');
    expect(await getTableRowCount(page)).toBe(state.categoryRows);

    await navigateTo(page, '/dashboard/product');
    expect(await getTableRowCount(page)).toBe(state.productRows);

    await navigateTo(page, '/dashboard/app_order');
    expect(await getTableRowCount(page)).toBe(state.orderRows);

    await navigateTo(page, '/dashboard/beneficiary');
    expect(await getTableRowCount(page)).toBe(state.beneficiaryRows);

    await navigateTo(page, '/dashboard/stock');
    expect(await getTableRowCount(page)).toBe(state.stockRows);
  });
});
