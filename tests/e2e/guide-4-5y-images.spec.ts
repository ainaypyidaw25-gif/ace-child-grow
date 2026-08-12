import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GUIDES = [
  ['gd_4_5y_daily_routine', '၄ နှစ်ခွဲ — နေ့စဉ်လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', '4.5 years — daily routine guide', '/guides/gd_4_5y_daily_routine.5877b17356.webp'],
  ['gd_4_5y_nutrition', '၄ နှစ်ခွဲ — အာဟာရ လမ်းညွှန်', '4.5 years — nutrition guide', '/guides/gd_4_5y_nutrition.072745f055.webp'],
  ['gd_4_5y_safety', '၄ နှစ်ခွဲ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', '4.5 years — safety guide', '/guides/gd_4_5y_safety.6cac88d3a8.webp'],
  ['gd_4_5y_sleep', '၄ နှစ်ခွဲ — အိပ်စက်ခြင်း လမ်းညွှန်', '4.5 years — sleep guide', '/guides/gd_4_5y_sleep.3032ba1b07.webp'],
] as const;

const screenshotDir = resolve(
  process.cwd(),
  'docs/illustration-review/screenshots/guides-4_5y',
);

function reviewCard(titleMm: string, titleEn: string, asset: string) {
  return `<!doctype html>
    <html lang="my">
      <head>
        <base href="http://localhost:4173/">
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body { max-width: 100%; overflow-x: hidden; }
          body { margin: 0; padding: 28px; background: #f7f5ed; color: #173b35; font-family: "Noto Sans Myanmar", system-ui, sans-serif; }
          main { width: min(900px, 100%); margin: 0 auto; padding: 24px; border: 1px solid #d8e0d9; border-radius: 28px; background: #fff; box-shadow: 0 12px 40px rgba(23,59,53,.09); }
          h1 { margin: 0; font-size: 28px; line-height: 1.65; overflow-wrap: anywhere; }
          p { margin: 3px 0 20px; color: #5e706c; font-size: 18px; overflow-wrap: anywhere; }
          img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 20px; }
        </style>
      </head>
      <body>
        <main data-testid="review-card">
          <h1>${titleMm}</h1>
          <p>${titleEn}</p>
          <img data-testid="guide-illustration" src="${asset}" alt="${titleMm}" width="1200" height="900">
        </main>
      </body>
    </html>`;
}

test('serves all 4 exact 4.5-year guide assets and captures text-image review cards', async ({ page, request }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  mkdirSync(screenshotDir, { recursive: true });

  await page.setViewportSize({ width: 1024, height: 900 });
  for (const [slug, titleMm, titleEn, asset] of GUIDES) {
    const response = await request.get(asset);
    expect(response.ok(), `${asset} must return 200`).toBe(true);
    expect(response.headers()['content-type']).toContain('image/webp');

    await page.setContent(reviewCard(titleMm, titleEn, asset), { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    const image = page.getByTestId('guide-illustration');
    await expect(page.getByRole('heading', { name: titleMm })).toBeVisible();
    await expect(page.getByText(titleEn, { exact: true })).toBeVisible();
    await expect(image).toHaveAttribute('src', asset);
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => ({
      width: element.naturalWidth,
      height: element.naturalHeight,
    }))).toEqual({ width: 1200, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
    await page.screenshot({
      path: resolve(screenshotDir, `${slug}-desktop.jpg`),
      fullPage: true,
      type: 'jpeg',
      quality: 82,
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [, titleMm, titleEn, asset] of GUIDES) {
    await page.setContent(reviewCard(titleMm, titleEn, asset), { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    const cardBox = await page.getByTestId('review-card').boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeGreaterThanOrEqual(0);
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }

  expect(new Set(GUIDES.map(([, , , asset]) => asset)).size).toBe(4);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
