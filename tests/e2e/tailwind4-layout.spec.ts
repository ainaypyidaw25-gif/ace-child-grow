import { expect, test } from '@playwright/test';

for (const mode of ['modern', 'legacy-color-mix', 'legacy-property-api']) {
  const legacy = mode !== 'modern';
  test(`Tailwind ${mode} keeps parent layout tokens`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    if (mode === 'legacy-color-mix') {
      await page.addInitScript(() => {
        const supports = CSS.supports.bind(CSS);
        CSS.supports = (property: string, value?: string) =>
          property === 'color' && value?.startsWith('color-mix(')
            ? false
            : value === undefined ? supports(property) : supports(property, value);
      });
    }
    if (mode === 'legacy-property-api') {
      await page.addInitScript(() => {
        // Model the partial-support gap: color-mix works, @property does not.
        Object.defineProperty(CSS, 'registerProperty', { value: undefined, configurable: true });
      });
    }

    await page.goto('/');
    const fallback = page.locator('link[data-legacy-tailwind]');
    await expect(fallback).toHaveCount(legacy ? 1 : 0);
    if (legacy) {
      await expect.poll(() => fallback.evaluate((link: HTMLLinkElement) => link.sheet !== null)).toBe(true);
    }

    const tokens = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'isolate min-h-touch rounded-card border border-line bg-white p-4 text-base text-ink shadow-card';
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const values = {
        minHeight: style.minHeight,
        radius: style.borderTopLeftRadius,
        padding: style.paddingTop,
        fontSize: style.fontSize,
        background: style.backgroundColor,
        border: style.borderTopColor,
        color: style.color,
        isolation: style.isolation,
      };
      probe.remove();
      return values;
    });
    expect(tokens).toEqual({
      minHeight: '44px',
      radius: '18px',
      padding: '16px',
      fontSize: '16px',
      background: 'rgb(255, 255, 255)',
      border: 'rgb(221, 231, 226)',
      color: 'rgb(24, 48, 43)',
      isolation: 'isolate',
    });
    await expect(page.locator('body')).toHaveCSS('overflow-wrap', 'anywhere');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'sign-in shell must fit a 360px phone').toBeLessThanOrEqual(0);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `test-results/tailwind-${mode}-360.png` });
  });
}
