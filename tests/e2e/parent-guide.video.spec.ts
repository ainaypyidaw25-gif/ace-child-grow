import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Records the silent parent how-to video.
 *
 * Not an assertion suite — it is the camera. It walks a parent's first session
 * end to end, at a phone size, holding each caption long enough to read the
 * Myanmar and typing at a pace a viewer can follow.
 *
 * What is on screen below the caption bar is the REAL application, served from
 * the harness bundle with an in-memory backend (tests/harness/offlineConvex.tsx).
 * Recording against the live site would mean creating a real account and a real
 * child row in Production to film, which is not a thing to do for a video.
 *
 * Excluded from the normal run (grep-inverted in playwright.config.ts) because
 * the pauses that make it watchable would be dead time in CI. Produce it with:
 *   npm run video:parent-guide
 */

const PARENT = 'http://localhost:4174/parent.html';

// Reading pace. Myanmar has no inter-word spaces, so a line takes longer to
// scan than the same English sentence; these holds are deliberately generous.
const HOLD = { work: 900, short: 2600, read: 5400 };

// A phone, because that is the only device most of these parents have.
test.use({
  viewport: { width: 412, height: 915 },
  video: { mode: 'on', size: { width: 412, height: 915 } },
});

const stage = (page: Page): Locator => page.getByTestId('stage');

// Still frames, one per step, written beside the video.
//
// They are the only way this recording gets reviewed: pulling a frame back out
// of the encoded .webm returns a flat colour in this container — checked
// against a known-good clip, so the extractor is what fails, not the file.
// These come off the same page at the same moments the video is capturing, so
// what they show is what the video shows.
const SHOTS = 'test-results/parent-guide-steps';

test('parent guide — how to use the app (silent)', async ({ page }) => {
  test.setTimeout(600_000);
  let shot = 0;
  const mark = async (id: string) => {
    shot += 1;
    await page.screenshot({ path: `${SHOTS}/${String(shot).padStart(2, '0')}-${id}.png` });
  };

  const next = async () => {
    await page.getByTestId('next-step').click();
    await page.waitForTimeout(HOLD.read);
  };
  // Scrolling happens inside the stage, not the page: the stage is its own
  // scroll container so the app's sticky header behaves as it does on a phone.
  const scrollStage = async (y: number) => {
    await stage(page).evaluate((el, top) => el.scrollTo({ top, behavior: 'smooth' }), y);
    await page.waitForTimeout(HOLD.work);
  };

  await page.goto(PARENT);
  await expect(page.getByTestId('caption')).toBeVisible();
  await page.waitForTimeout(HOLD.read);

  // 1 — create an account. A six-digit PIN, because that is what the parent
  // form requires; typed slowly so a viewer sees the shape of what is wanted.
  await stage(page).getByRole('button', { name: /အကောင့်မရှိသေးပါက အသစ်ဖွင့်ရန်/ }).click();
  await page.waitForTimeout(HOLD.work);
  await stage(page).getByLabel(/အီးမေးလ်/).pressSequentially('mimi@example.com', { delay: 55 });
  await page.waitForTimeout(HOLD.work);
  await stage(page).locator('input[type="password"]').first().pressSequentially('481920', { delay: 180 });
  await page.waitForTimeout(HOLD.short);

  await mark('signup');

  // 2 — signed in, on the welcome screen.
  await next();
  await stage(page).locator('form button[type="submit"]').first().click();
  await expect(stage(page).getByRole('button', { name: /ဒီနေ့အစီအစဉ်/ })).toBeVisible();
  await page.waitForTimeout(HOLD.short);
  await stage(page).getByRole('button', { name: /ဒီနေ့အစီအစဉ်/ }).click();

  await mark('welcome');

  // 3 — consent. Held long: it is the screen that says the app does not diagnose.
  await next();
  await scrollStage(400);
  await scrollStage(0);
  await stage(page).getByRole('button', { name: /အတည်ပြုမည်/ }).click();

  await mark('consent');

  // 4 — add the child.
  await next();
  await stage(page).getByLabel(/အမည်/).pressSequentially('ကြယ်လေး', { delay: 220 });
  await page.waitForTimeout(HOLD.work);
  await stage(page).locator('input[type="date"]').fill('2024-02-10');
  await page.waitForTimeout(HOLD.short);
  await stage(page).getByRole('button', { name: /^သိမ်းဆည်းမည်$/ }).click();

  await mark('addchild');

  // 5 — home. The child's name and age are now on screen.
  await next();
  await expect(stage(page).getByText('ကြယ်လေး')).toBeVisible();
  await scrollStage(500);
  await scrollStage(0);

  await mark('home');

  // 6 — development, from the bottom bar, the way a parent would reach it.
  await next();
  await stage(page).getByRole('link', { name: /ဖွံ့ဖြိုးမှု$/ }).first().click();
  await page.waitForTimeout(HOLD.short);

  await mark('journey');

  // 7 — answer. Deliberately not all "yes": a walkthrough where every answer is
  // the happy one teaches nobody what to do when it is not.
  await next();
  await stage(page).getByRole('button', { name: /^လုပ်နိုင်ပြီ$/ }).click();
  await page.waitForTimeout(HOLD.short);
  const notYet = stage(page).getByRole('button', { name: /^မလုပ်နိုင်သေး$/ });
  if (await notYet.isVisible()) {
    await notYet.click();
    await page.waitForTimeout(HOLD.short);
  }

  await mark('answer');

  // 8 — the result. Work through the rest of the checklist so it really
  // computes; a "result" screen reached by any other route would be a mock-up.
  //
  // Advancing needs an answer AND the forward button, and the last question
  // adds the skill-loss question before saving becomes possible. The already
  // answered first question is left alone — that is the "not yet" the video
  // deliberately shows.
  await next();
  const yesAnswer = () => stage(page).getByRole('button', { name: /^လုပ်နိုင်ပြီ$/ }).first();
  for (let i = 0; i < 40; i += 1) {
    const forward = stage(page).getByRole('button', { name: /^ရှေ့သို့$/ });
    if (!(await forward.isVisible().catch(() => false))) break;
    const answered = await stage(page).locator('button[aria-pressed="true"]').count();
    if (answered === 0) await yesAnswer().click();
    await page.waitForTimeout(220);
    await forward.click();
    await page.waitForTimeout(220);
  }
  // Last question, then the skill-loss question, then save.
  if ((await stage(page).locator('button[aria-pressed="true"]').count()) === 0) {
    await yesAnswer().click();
    await page.waitForTimeout(HOLD.work);
  }
  await stage(page).getByRole('button', { name: /^မရှိပါ$/ }).click();
  await page.waitForTimeout(HOLD.work);
  await stage(page).getByRole('button', { name: /^သိမ်းဆည်းမည်$/ }).click();
  await scrollStage(0);
  await page.waitForTimeout(HOLD.short);

  await mark('result');

  // 9 — knowledge.
  await next();
  await stage(page).getByRole('link', { name: /ဗဟုသုတ$/ }).first().click();
  await page.waitForTimeout(HOLD.short);
  await scrollStage(350);

  await mark('learn');

  // 10 — a guide, and the section that matters most on it.
  await next();
  await stage(page).getByRole('link', { name: /မိဘလမ်းညွှန်/ }).first().click();
  await page.waitForTimeout(HOLD.short);
  const redFlags = stage(page).getByText('ကျွမ်းကျင်သူနှင့် တိုင်ပင်သင့်သည့် လက္ခဏာ');
  await redFlags.scrollIntoViewIfNeeded();
  await expect(redFlags).toBeVisible();
  await page.waitForTimeout(HOLD.read);

  await mark('guide');

  // 11 — activities.
  //
  // This step used to show the offline-downloads screen. It was cut because
  // saving content for offline reading is a Premium feature, so a free parent
  // following that instruction lands on a price list — a how-to step that
  // turns into a payment prompt is a how-to step that lies. Activities keeps
  // its basics free, and the caption says only that.
  await next();
  await stage(page).getByRole('link', { name: /လှုပ်ရှားမှုများ$/ }).first().click();
  await page.waitForTimeout(HOLD.short);
  await scrollStage(260);

  await mark('activities');

  // 12 — growth.
  await next();
  await stage(page).getByRole('link', { name: /ပင်မ$/ }).first().click();
  await page.waitForTimeout(HOLD.work);
  await stage(page).getByRole('link', { name: /ကြီးထွားမှုမှတ်တမ်း/ }).first().click();
  await page.waitForTimeout(HOLD.short);
  // The date starts empty and is required; without it the save fails and the
  // video would teach the form by showing it rejected.
  await stage(page).locator('input[type="date"]').fill(new Date().toISOString().slice(0, 10));
  await page.waitForTimeout(HOLD.work);
  // The weight/height fields carry no `type` attribute at all, only
  // inputMode="decimal" — `input[type="text"]` matches neither of them.
  const numbers = stage(page).locator('input[inputmode="decimal"]');
  await numbers.nth(0).pressSequentially('12.4', { delay: 200 });
  await numbers.nth(1).pressSequentially('87', { delay: 200 });
  await page.waitForTimeout(HOLD.work);
  await stage(page).getByRole('button', { name: /တိုင်းတာချက် သိမ်းမည်/ }).click();
  // The saved row is the point of the step — show it, not just the form.
  await expect(stage(page).getByText('12.4')).toBeVisible();
  await scrollStage(320);
  await page.waitForTimeout(HOLD.short);

  await mark('growth');

  // 13 — language.
  await next();
  await stage(page).getByRole('button', { name: 'Switch language' }).click();
  await expect(stage(page).getByText(/Growth|Weight/i).first()).toBeVisible();
  await mark('language-en');
  await page.waitForTimeout(HOLD.read);
  // Back to Myanmar: the video should not end in a language most of its
  // audience does not read.
  await stage(page).getByRole('button', { name: 'Switch language' }).click();
  await page.waitForTimeout(HOLD.short);

  await mark('language');

  // 14 — the rule that matters most, held longest, and back on the home screen
  // so the last thing on screen is where a parent starts, not a half-filled form.
  await next();
  await stage(page).getByRole('link', { name: /ပင်မ$/ }).first().click();
  await page.waitForTimeout(HOLD.read + 3000);

  await mark('closing');

  /* ------------------------------------------------------------------ checks
   * The demo banner and the caption must be on screen in EVERY frame, after
   * all of the scrolling and navigating above. A frame without the banner
   * could be lifted out of this video and passed off as a real family's
   * account, so this is checked at the end rather than assumed at the start.
   */
  const banner = (await page.getByTestId('demo-banner').boundingBox())!;
  const caption = (await page.getByTestId('caption').boundingBox())!;
  expect(banner, 'banner still rendered at the end').not.toBeNull();
  expect(caption, 'caption still rendered at the end').not.toBeNull();
  expect(banner.y, 'banner pinned to the very top').toBe(0);
  expect(
    caption.y,
    'caption starts where the banner ends — overlapped is unreadable',
  ).toBeGreaterThanOrEqual(banner.y + banner.height);

  const bannerOnTop = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, 8);
    return el?.closest('[data-testid="demo-banner"]') !== null;
  });
  expect(bannerOnTop, 'banner must be the topmost element at the top of the screen').toBe(true);

  // Rendered AND actually visible. Harness chrome is styled inline precisely
  // because Tailwind does not scan tests/; a class here would produce no CSS
  // and a transparent banner would still satisfy a bounding-box check.
  const paint = await page.getByTestId('demo-banner').evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, color: style.color };
  });
  expect(paint.background, 'banner needs an opaque background').not.toMatch(
    /rgba\(0, 0, 0, 0\)|transparent/,
  );
  expect(paint.color).toContain('255, 255, 255');

  // The app below must be the app, not a placeholder: the child added in step 4
  // is still the active child at the end of the walkthrough.
  await stage(page).getByRole('link', { name: /ပင်မ$/ }).first().click();
  await expect(stage(page).getByText('ကြယ်လေး')).toBeVisible();
});
