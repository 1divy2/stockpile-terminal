import { test, expect } from '@playwright/test';

test('dashboard loads and displays market overview', async ({ page }) => {
  await page.goto('/');

  // Expect the title to contain StockPile
  await expect(page).toHaveTitle(/StockPile/);

  // Check if Market Overview header exists
  await expect(page.locator('text=Market Overview')).toBeVisible();

  // Check if navigation elements exist
  await expect(page.locator('text=Dashboard')).toBeVisible();
  await expect(page.locator('text=AI Research')).toBeVisible();
});

test('navigation to AI Research works', async ({ page }) => {
  await page.goto('/');
  
  // Click on AI Research link (assuming it's in a sidebar or navbar)
  const aiResearchLink = page.locator('text=AI Research');
  await aiResearchLink.first().click();

  // Wait for URL to change
  await page.waitForURL('**/ai-research');

  // Verify the AI Research page header
  await expect(page.locator('text=AI Research Pipeline')).toBeVisible();
});
