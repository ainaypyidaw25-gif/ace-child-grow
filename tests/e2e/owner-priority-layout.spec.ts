import { test, expect, type Page } from '@playwright/test';

// Layout checks for the owner-priority workspace at the two device sizes the
// owner uses, driven through the test-only harness bundle (fixture data, no
// backend). Screenshots land in test-results/ for the PR.

// The harness is a separate bundle on its own port — deliberately NOT a route
// in the application, so nothing like it can ship to Production.
const HARNESS = 'http://localhost:4174/';

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.scrollingElement!;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(0);
}

async function assertMyanmarTitlesWrap(page: Page) {
  // Every Myanmar title must wrap inside its card instead of overflowing it.
  const overflowing = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>('[data-testid^="queue-row-"] p')];
    return nodes.filter((node) => node.scrollWidth > node.clientWidth + 1).map((node) => node.textContent?.slice(0, 40));
  });
  expect(overflowing, 'no title may overflow its card').toEqual([]);
}

async function assertLastActionReachable(page: Page) {
  // No control may be unreachable behind fixed chrome: scrolling to the final
  // interactive element must leave it fully inside the viewport and clickable.
  const importButton = page.getByTestId('import-disabled');
  await importButton.scrollIntoViewIfNeeded();
  const box = await importButton.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

for (const [label, viewport] of [
  ['mobile-360x800', { width: 360, height: 800 }],
  ['ipad-820x1180', { width: 820, height: 1180 }],
] as const) {
  test(`owner priority layout fits ${label}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(HARNESS);
    await expect(page.getByTestId('owner-priority-view')).toBeVisible();

    // Dashboard counts render and are clickable filters.
    await expect(page.getByTestId('count-p0')).toBeVisible();
    await page.getByTestId('count-visC').click();
    await expect(page.getByTestId('queue-count')).toContainText('2');
    await page.getByTestId('count-p0').click();

    // P0 sorts first with the parent-visible special_need on top.
    const first = page.locator('[data-testid^="queue-row-"]').first();
    await expect(first).toHaveAttribute('data-priority', 'P0');

    await assertNoHorizontalOverflow(page);
    await assertMyanmarTitlesWrap(page);
    await assertLastActionReachable(page);

    // Myanmar is the app's default locale, so it is the one photographed first.
    await page.screenshot({ path: `test-results/owner-priority-${label}-mm.png`, fullPage: true });

    // English locale must hold the same layout guarantees.
    await page.getByTestId('toggle-locale').click();
    await assertNoHorizontalOverflow(page);
    await assertMyanmarTitlesWrap(page);
    await page.screenshot({ path: `test-results/owner-priority-${label}-en.png`, fullPage: true });
  });
}

test('queue rows open the item workspace callback', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(HARNESS);
  await page.getByTestId('queue-row-demo_sn_autism').getByRole('button').click();
  await expect(page.getByTestId('opened-slug')).toContainText('demo_sn_autism');
});

test('import preview shows the disabled import and refusal design', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto(HARNESS);
  const importButton = page.getByTestId('import-disabled');
  await importButton.scrollIntoViewIfNeeded();
  await expect(importButton).toBeDisabled();
  await expect(page.getByTestId('import-plan')).toContainText('383');
});

test('the application bundle exposes no dev/preview route', async ({ page }) => {
  // Belt and braces alongside noDevRoutes.test.ts: ask the PRODUCTION preview
  // server for the old path and confirm the harness does not render.
  await page.setViewportSize({ width: 820, height: 1180 });
  const response = await page.goto('http://localhost:4173/dev/owner-priority-preview');
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByTestId('owner-priority-view')).toHaveCount(0);
  await expect(page.getByText('LAYOUT PREVIEW')).toHaveCount(0);
});
