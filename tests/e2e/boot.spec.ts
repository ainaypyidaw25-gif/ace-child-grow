import { test, expect } from '@playwright/test';

// Boot smoke test — no backend round-trip needed, so it runs anywhere.
// Confirms the production build renders without a runtime crash and shows the
// authentication gate (sign-in) for unauthenticated visitors.
test('app boots and shows the sign-in gate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ACE Child Grow' })).toBeVisible();
  await expect(page.getByText('ကလေးတိုင်း ဖွံ့ဖြိုးတိုးတက်နိုင်ပါတယ်')).toBeVisible();
  await expect(page.getByRole('button', { name: 'မိဘဝင်ရန်' })).toBeVisible();
  await page.getByRole('button', { name: 'အဖွဲ့ဝင်/ပညာရှင်ဝင်ရန်' }).click();
  await expect(page.getByRole('heading', { name: 'စီမံခန့်ခွဲသူ သို့မဟုတ် ပညာရှင်အကောင့်ဝင်ရန်' })).toBeVisible();
  // Password fields present (the Convex Auth gate).
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
