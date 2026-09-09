import { expect, test, type Locator, type Page } from '@playwright/test';

const PARENT = 'http://localhost:4174/parent.html';

async function stage(page: Page): Promise<Locator> {
  return page.getByTestId('stage');
}

async function onboardParent(page: Page): Promise<Locator> {
  await page.goto(PARENT);
  // The recording harness has its own faint bottom-right "next" control. It
  // is not part of the app and would otherwise cover Profile at 320px.
  await page.getByTestId('next-step').evaluate((button) => { button.style.display = 'none'; });
  const app = await stage(page);
  await app.getByRole('button', { name: /အီးမေးလ်နှင့် PIN\/စကားဝှက်ဖြင့် ဝင်မည်/ }).click();
  await app.getByRole('button', { name: /အကောင့်မရှိသေးပါက အသစ်ဖွင့်ရန်/ }).click();
  await app.getByLabel(/အီးမေးလ်/).fill('mobile-layout@example.com');
  await app.locator('input[type="password"]').first().fill('481920');
  await app.locator('form button[type="submit"]').first().click();
  await app.getByRole('button', { name: /ဒီနေ့အစီအစဉ်/ }).click();
  await expect(app.getByRole('heading', { name: /မိဘ သဘောတူညီချက်/ })).toBeVisible();
  await expectMobileShellFits(app, false);
  await expectMyanmarTextWraps(app, 'consent');
  if (page.viewportSize()?.width === 360) {
    await app.screenshot({ path: 'test-results/mobile-shell-360-consent.png' });
  }
  await app.getByRole('button', { name: /အတည်ပြုမည်/ }).click();
  await expect(app.getByRole('heading', { name: /ကလေး၏ အချက်အလက် ထည့်ပါ/ })).toBeVisible();
  await expectMobileShellFits(app, false);
  await expectMyanmarTextWraps(app, 'add-child');
  if (page.viewportSize()?.width === 360) {
    await app.screenshot({ path: 'test-results/mobile-shell-360-add-child.png' });
  }
  await app.getByLabel(/အမည်/).fill('ကြယ်လေး');
  await app.locator('input[type="date"]').fill('2024-02-10');
  await app.getByRole('button', { name: /^သိမ်းဆည်းမည်$/ }).click();
  await expect(app.getByText('ကြယ်လေး')).toBeVisible();
  await expectMyanmarTextWraps(app, 'home');
  return app;
}

async function expectMobileShellFits(app: Locator, expectBottomNav = true) {
  const metrics = await app.evaluate((root) => {
    const header = root.querySelector<HTMLElement>('[data-testid="app-header"]');
    const main = root.querySelector<HTMLElement>('[data-testid="app-main"]');
    const nav = root.querySelector<HTMLElement>('[data-testid="bottom-nav"]');
    const navLabels = [...root.querySelectorAll<HTMLElement>('[data-testid="bottom-nav"] li span:last-child')];
    const visibleWidth = root.clientWidth;
    return {
      overflow: root.scrollWidth - visibleWidth,
      headerOverflow: header ? header.scrollWidth - header.clientWidth : 999,
      mainOverflow: main ? main.scrollWidth - main.clientWidth : 999,
      navPresent: nav !== null,
      navLeft: nav?.getBoundingClientRect().left ?? -1,
      navRight: nav?.getBoundingClientRect().right ?? visibleWidth + 1,
      visibleWidth,
      labelsClippedVertically: navLabels.some((label) => label.scrollHeight > label.clientHeight + 1),
    };
  });

  expect(metrics.overflow, 'app shell must not scroll horizontally').toBeLessThanOrEqual(0);
  expect(metrics.headerOverflow, 'header controls must fit the phone width').toBeLessThanOrEqual(0);
  expect(metrics.mainOverflow, 'screen content must fit the phone width').toBeLessThanOrEqual(0);
  expect(metrics.navPresent, `bottom navigation ${expectBottomNav ? 'is present' : 'stays hidden'} on this screen`).toBe(expectBottomNav);
  if (expectBottomNav) {
    expect(metrics.navLeft, 'bottom navigation begins inside the viewport').toBeGreaterThanOrEqual(0);
    expect(metrics.navRight, 'bottom navigation ends inside the viewport').toBeLessThanOrEqual(metrics.visibleWidth);
    expect(metrics.labelsClippedVertically, 'bottom navigation labels remain readable').toBe(false);
  }
}

async function expectMyanmarTextWraps(app: Locator, screenName: string) {
  const result = await app.evaluate((root) => {
    const main = root.querySelector<HTMLElement>('[data-testid="app-main"]');
    const nodes = [...(main?.querySelectorAll<HTMLElement>('h1, h2, h3, p, li, label, button, a') ?? [])];
    return {
      overflowWrap: window.getComputedStyle(document.body).overflowWrap,
      overflowing: nodes
        // Ignore deliberate 1px screen-reader-only text; this is a visual
        // wrapping check, while the accessible name remains covered elsewhere.
        .filter((node) => node.clientWidth > 4 && node.clientHeight > 4 && node.textContent?.trim())
        .filter((node) => !['auto', 'scroll'].includes(window.getComputedStyle(node).overflowX))
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .map((node) => node.textContent?.trim().slice(0, 60)),
    };
  });

  expect(result.overflowWrap, `${screenName} inherits the narrow-screen wrapping fallback`).toBe('anywhere');
  expect(result.overflowing, `${screenName} text stays inside its controls and cards`).toEqual([]);
}

for (const width of [320, 360, 412]) {
  test(`parent shell fits a ${width}px Android viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 915 });
    const app = await onboardParent(page);
    await expectMobileShellFits(app);
    if (width === 360) {
      await page.screenshot({ path: 'test-results/mobile-shell-360-home.png' });
    }

    const bottomNav = app.getByTestId('bottom-nav');
    for (const destination of ['/journey', '/activities', '/learn', '/profile']) {
      await bottomNav.locator(`a[href="${destination}"]`).click();
      await expectMobileShellFits(app);
    }
  });
}
