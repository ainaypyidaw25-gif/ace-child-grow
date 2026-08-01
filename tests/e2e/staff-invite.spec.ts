import { expect, test } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };

// The invite-acceptance screen resolves the invitation code through Convex
// before it finishes rendering, so the sign-in toggle never appears without a
// live backend. This spec was previously ungated and therefore failed on every
// machine and CI runner without Convex egress — including on main. It now uses
// the same E2E_LIVE guard as the other backend-dependent specs, so it reports
// as skipped rather than failing, and still runs wherever E2E_LIVE=1 is set.
test('a signed-out invite recipient can create an account or sign in', async ({ page }) => {
  test.skip(!process.env.E2E_LIVE, 'requires live Convex WebSocket connectivity');
  await page.goto('/admin/accept-invite/qa-example');

  await expect(page).toHaveURL(/\/admin\/accept-invite\/qa-example$/);
  await expect(page.getByRole('heading', { name: 'အကောင့်သစ် ဖွင့်ရန်' })).toBeVisible();
  await expect(page.getByText('ဖိတ်ကြားထားသော အီးမေးလ်အတိအကျဖြင့်')).toBeVisible();
  await expect(page.getByRole('button', { name: 'မိဘဝင်ရန်' })).toBeDisabled();

  await page.getByRole('button', { name: 'အကောင့်ရှိပြီးသားလား? ဝင်ရန်' }).click();
  await expect(page.getByRole('heading', { name: 'စီမံခန့်ခွဲသူ သို့မဟုတ် ပညာရှင်အကောင့်ဝင်ရန်' })).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
});
