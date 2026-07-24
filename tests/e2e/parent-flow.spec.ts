import { test, expect } from '@playwright/test';
import { signUpFresh } from './helpers';

declare const process: { env: Record<string, string | undefined> };

// Full journey against the LIVE Convex backend: sign up → consent → add child →
// Home shows the child → reload proves the child persisted server-side.
test('sign up, consent, add a child, and persist across reload', async ({ page }) => {
  // Needs WebSocket egress to Convex; set E2E_LIVE=1 to run (e.g. locally / CI).
  test.skip(!process.env.E2E_LIVE, 'requires live Convex WebSocket connectivity');
  await signUpFresh(page);

  // Start → consent
  await page.getByRole('button', { name: /Start today|ဒီနေ့အစီအစဉ်/ }).click();
  await expect(page).toHaveURL(/\/consent$/);
  await page.getByRole('button', { name: /Confirm|အတည်ပြုမည်/ }).click();

  // Add child
  await expect(page).toHaveURL(/\/add-child$/);
  await page.getByLabel(/Nickname|အမည်/).fill('ကြယ်လေး');
  await page.locator('input[type="date"]').fill('2023-01-15');
  await page.getByRole('button', { name: /^Save$|သိမ်းဆည်းမည်/ }).click();

  // Home shows the child
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('ကြယ်လေး')).toBeVisible({ timeout: 10000 });

  // Reload → still signed in and the child is still there (persisted in Convex)
  await page.reload();
  await expect(page.getByText('ကြယ်လေး')).toBeVisible({ timeout: 15000 });
});
