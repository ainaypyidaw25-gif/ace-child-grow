import { test, expect } from '@playwright/test';

// Core parent journey: welcome → consent → add child → home shows the child.
test('parent can consent, add a child, and see them on Home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ACE Child Grow' })).toBeVisible();

  // Start → consent
  await page.getByRole('button', { name: 'ဒီနေ့အစီအစဉ် စတင်မယ်' }).click();
  await expect(page).toHaveURL(/\/consent$/);

  // Accept consent → add child
  await page.getByRole('button', { name: 'အတည်ပြုမည်' }).click();
  await expect(page).toHaveURL(/\/add-child$/);

  // Fill the add-child form
  await page.locator('input[type="text"], input:not([type])').first().fill('ကြယ်လေး');
  await page.locator('input[type="date"]').fill('2023-01-15');
  await page.getByRole('button', { name: 'သိမ်းဆည်းမည်' }).click();

  // Home shows the child's nickname
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('ကြယ်လေး')).toBeVisible();
});

// Bottom navigation is present and localized.
test('bottom navigation shows Myanmar labels', async ({ page }) => {
  await page.goto('/home');
  await expect(page.getByRole('link', { name: 'ပင်မ' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'သင်ယူရန်' })).toBeVisible();
});

// Language switch flips UI language.
test('language toggle switches to English', async ({ page }) => {
  await page.goto('/home');
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
});
