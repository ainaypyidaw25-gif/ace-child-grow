import { test, expect } from '@playwright/test';
import { signUpFresh } from './helpers';

declare const process: { env: Record<string, string | undefined> };

// Safety-critical E2E: the skill-loss answer must surface the fixed urgent
// emergency guidance (RED), interrupting any reassuring result.
test('skill-loss answer triggers urgent safety guidance', async ({ page }) => {
  test.skip(!process.env.E2E_LIVE, 'requires live Convex WebSocket connectivity');
  await signUpFresh(page);
  await page.goto('/journey');

  // Answer the first milestone, then advance to the last step.
  await page.getByRole('button', { name: 'လုပ်နိုင်ပြီ' }).first().click();
  for (let i = 0; i < 10; i++) {
    const next = page.getByRole('button', { name: 'ရှေ့သို့' });
    if (await next.count()) await next.click();
    else break;
  }

  // Answer the skill-loss question "Yes", then Save.
  await page.getByRole('button', { name: 'လုပ်နိုင်ပြီ' }).last().click();
  await page.getByRole('button', { name: 'သိမ်းဆည်းမည်' }).click();

  // The fixed emergency message must appear (alert role), no phone number.
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('အရေးပေါ်');
});
