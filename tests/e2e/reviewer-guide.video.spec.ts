import { test, expect } from '@playwright/test';

/**
 * Records the silent reviewer-training video.
 *
 * Not an assertion suite — it is the camera. It walks the guide harness one
 * caption at a time, holding each step long enough to read the Myanmar text,
 * and types real edits so a viewer sees the actual interaction rather than a
 * static screenshot. Playwright writes the video to test-results/.
 *
 * Excluded from the normal run (grep-inverted in playwright.config.ts) because
 * it is slow by design: the pauses that make it watchable would be dead time in
 * CI. Produce the video with:  npm run video:reviewer-guide
 */

const GUIDE = 'http://localhost:4174/guide.html';

// Reading pace for Myanmar captions. Myanmar script has no inter-word spaces,
// so a line takes longer to scan than the same English sentence — these holds
// are deliberately generous.
const HOLD = { short: 3200, read: 5200, work: 1200 };

test.use({
  viewport: { width: 1280, height: 900 },
  video: { mode: 'on', size: { width: 1280, height: 900 } },
});

test('reviewer guide — how to review, correct and save (silent)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto(GUIDE);
  await expect(page.getByTestId('caption')).toBeVisible();

  const next = async () => {
    await page.getByTestId('next-step').click();
    await page.waitForTimeout(HOLD.read);
  };

  // Step 1 — where the work is.
  await page.waitForTimeout(HOLD.read);
  await expect(page.getByTestId('demo-queue')).toBeVisible();

  // Step 2 — read the warnings first.
  await next();

  // Step 3 — Myanmar and English side by side.
  await next();

  // Step 4 — correct the wording. Typed slowly so the change is legible.
  await next();
  const safetyMm = page.getByTestId('field-safety-mm');
  await safetyMm.scrollIntoViewIfNeeded();
  await safetyMm.click();
  await safetyMm.fill('');
  await safetyMm.pressSequentially(
    'ကလေးကို ခုတင်၊ စားပွဲ စသည့် မြင့်သောနေရာတွင် တစ်ယောက်တည်း ထိုင်ခိုင်း၍ မထားပါနှင့်။',
    { delay: 45 },
  );
  await page.waitForTimeout(HOLD.short);

  // Step 5 — save, and see the consequence: a new revision.
  await next();
  await page.getByTestId('demo-save').click();
  await expect(page.getByTestId('demo-saved')).toBeVisible();
  await expect(page.getByTestId('demo-revision')).toContainText('2');
  await page.waitForTimeout(HOLD.read);

  // Step 6 — decide only your own area, and write a note when asking for changes.
  await next();
  await page.getByTestId('demo-decision-select').selectOption('changes_requested');
  await page.waitForTimeout(HOLD.work);
  await page.getByTestId('demo-note').click();
  await page.getByTestId('demo-note').pressSequentially(
    'မြန်မာစာသားကို ပိုရှင်းအောင် ပြင်ပြီးပါပြီ။ ဘေးကင်းရေး အပိုင်းကို ဆေးပညာရှင် စစ်ပေးပါ။',
    { delay: 40 },
  );
  await page.waitForTimeout(HOLD.short);

  // Step 7 — requesting a review assigns nobody.
  await next();
  await page.getByTestId('demo-request-clinical').click();
  await expect(page.getByTestId('demo-requested')).toBeVisible();
  await page.waitForTimeout(HOLD.read);

  // Step 8 — the rule that matters most, held longest.
  await next();
  await page.waitForTimeout(HOLD.read + 2500);

  // The demo banner and caption must be on screen in EVERY frame, including
  // after all the scrolling above. A frame without the banner could be lifted
  // from the video and passed off as a real record being edited.
  const banner = (await page.getByTestId('demo-banner').boundingBox())!;
  const caption = (await page.getByTestId('caption').boundingBox())!;
  expect(banner).not.toBeNull();
  expect(caption).not.toBeNull();
  expect(banner.y, 'banner pinned to the very top').toBe(0);
  // The two bars must sit one under the other, not overlap: an overlapped
  // banner is an unreadable banner.
  expect(caption.y, 'caption starts where the banner ends').toBeGreaterThanOrEqual(banner.y + banner.height);
  // And nothing may cover them.
  const bannerOnTop = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, 8);
    return el?.closest('[data-testid="demo-banner"]') !== null;
  });
  expect(bannerOnTop, 'banner must be the topmost element at the top of the screen').toBe(true);
  // Rendered AND actually visible: a banner with a transparent background is
  // white text on white — present to a bounding-box check, invisible on screen.
  const bannerPaint = await page.getByTestId('demo-banner').evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, color: style.color };
  });
  expect(bannerPaint.background, 'banner needs an opaque background').not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  expect(bannerPaint.color).toContain('255, 255, 255');
});
