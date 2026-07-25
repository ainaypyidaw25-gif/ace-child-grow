import { test, expect } from '@playwright/test';
import { signUpFresh, signInExisting } from './helpers';

declare const process: { env: Record<string, string | undefined> };

// P1 regression (login/child bootstrap): an existing user who already added a
// child must land on Home after signing in again — and must NOT be asked to add
// another child. Needs live Convex WebSocket egress; gated behind E2E_LIVE.
test('existing user signs out and back in → lands on Home, not Add Child', async ({ page }) => {
  test.skip(!process.env.E2E_LIVE, 'requires live Convex WebSocket connectivity');

  // Sign up, onboard, and add one child.
  const email = await signUpFresh(page);
  await page.getByRole('button', { name: /Start today|ဒီနေ့အစီအစဉ်/ }).click();
  await page.getByRole('button', { name: /Confirm|အတည်ပြုမည်/ }).click();
  await expect(page).toHaveURL(/\/add-child$/);
  await page.getByLabel(/Nickname|အမည်/).fill('ကြယ်လေး');
  await page.locator('input[type="date"]').fill('2023-01-15');
  await page.getByRole('button', { name: /^Save$|သိမ်းဆည်းမည်/ }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('ကြယ်လေး')).toBeVisible({ timeout: 10000 });

  // Sign out.
  await page.goto('/profile');
  await page.getByRole('button', { name: /Sign out|ထွက်မည်/ }).click();
  await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });

  // Sign in again with the SAME account.
  await signInExisting(page, email);

  // THE FIX: lands on Home with the same child; never routed to Add Child.
  await expect(page).toHaveURL(/\/home$/, { timeout: 15000 });
  await expect(page.getByText('ကြယ်လေး')).toBeVisible({ timeout: 10000 });
  await expect(page).not.toHaveURL(/\/add-child$/);

  // Hard refresh keeps them on Home too.
  await page.reload();
  await expect(page.getByText('ကြယ်လေး')).toBeVisible({ timeout: 15000 });
});
