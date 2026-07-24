import { type Page, expect } from '@playwright/test';

/** Sign up a fresh account (unique email) against the live Convex backend. */
export async function signUpFresh(page: Page): Promise<string> {
  const email = `e2e+${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
  await page.goto('/');
  // Switch to the "create account" flow.
  await page.getByRole('button', { name: /No account\?|အကောင့်မရှိ/ }).click();
  await page.getByLabel(/Email|အီးမေးလ်/).fill(email);
  await page.getByLabel(/Password|စကားဝှက်/).fill('Test1234!ace');
  await page.getByRole('button', { name: /^Sign up$|ဖွင့်မည်/ }).click();
  // After sign-up we are authenticated and land on the Welcome screen.
  await expect(page.getByRole('button', { name: /Start today|ဒီနေ့အစီအစဉ်/ })).toBeVisible({ timeout: 15000 });
  return email;
}
