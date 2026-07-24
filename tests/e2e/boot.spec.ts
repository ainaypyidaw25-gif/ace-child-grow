import { test, expect } from '@playwright/test';

// Boot smoke test — no backend round-trip needed, so it runs anywhere.
// Confirms the production build renders without a runtime crash and shows the
// authentication gate (sign-in) for unauthenticated visitors.
test('app boots and shows the sign-in gate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ACE Child Grow' })).toBeVisible();
  await expect(page.getByText('ကလေးတိုင်း ကြီးထွားနိုင်ပါတယ်')).toBeVisible();
  // Password fields present (the Convex Auth gate).
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
