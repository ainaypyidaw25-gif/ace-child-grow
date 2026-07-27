import { expect, test } from '@playwright/test';

test('a signed-out invite recipient can create an account or sign in', async ({ page }) => {
  await page.goto('/admin/accept-invite/qa-example');

  await expect(page).toHaveURL(/\/admin\/accept-invite\/qa-example$/);
  await expect(page.getByRole('heading', { name: 'အကောင့်သစ် ဖွင့်ရန်' })).toBeVisible();
  await expect(page.getByText('ဖိတ်ကြားထားသော အီးမေးလ်အတိအကျဖြင့်')).toBeVisible();
  await expect(page.getByRole('button', { name: 'မိဘဝင်ရန်' })).toBeDisabled();

  await page.getByRole('button', { name: 'အကောင့်ရှိပြီးသားလား? ဝင်ရန်' }).click();
  await expect(page.getByRole('heading', { name: 'စီမံခန့်ခွဲသူ သို့မဟုတ် ပညာရှင်အကောင့်ဝင်ရန်' })).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
});
