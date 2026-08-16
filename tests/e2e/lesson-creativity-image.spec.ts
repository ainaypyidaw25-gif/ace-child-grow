import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const LESSON = {
  slug: 'lsn_creativity',
  titleMm: 'တီထွင်ဖန်တီးမှု အားပေးခြင်း',
  titleEn: 'Nurturing creativity',
  observeMm: 'ယနေ့ ကလေးကို ခဲတံ/စက္ကူဖြင့် လွတ်လပ်စွာ ဆွဲစေပါ။',
  observeEn: 'Let your child draw freely today.',
  asset: '/lessons/creativity/lsn_creativity.3e8ca55af0.webp',
} as const;

const screenshotDir = resolve(
  process.cwd(),
  'docs/illustration-review/screenshots/lessons-creativity',
);

function reviewCard() {
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
          .en { margin: 3px 0 18px; color: #5e706c; font-size: 18px; overflow-wrap: anywhere; }
          img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 20px; }
          .action { margin: 18px 0 0; padding: 16px; border-radius: 16px; background: #edf7f1; line-height: 1.7; }
          .action span { display: block; color: #5e706c; font-size: 14px; }
        </style>
      </head>
      <body>
        <main data-testid="review-card">
          <h1>${LESSON.titleMm}</h1>
          <p class="en">${LESSON.titleEn}</p>
          <img data-testid="lesson-illustration" src="${LESSON.asset}" alt="${LESSON.titleMm}" width="1200" height="900">
          <p class="action">${LESSON.observeMm}<span>${LESSON.observeEn}</span></p>
        </main>
      </body>
    </html>`;
}

test('serves the exact creativity lesson asset and captures responsive text-image review cards', async ({ page, request }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  mkdirSync(screenshotDir, { recursive: true });

  const response = await request.get(LESSON.asset);
  expect(response.ok(), `${LESSON.asset} must return 200`).toBe(true);
  expect(response.headers()['content-type']).toContain('image/webp');

  await page.setViewportSize({ width: 1024, height: 1100 });
  await page.setContent(reviewCard(), { waitUntil: 'networkidle' });
  const image = page.getByTestId('lesson-illustration');
  await expect(page.getByRole('heading', { name: LESSON.titleMm })).toBeVisible();
  await expect(page.getByText(LESSON.titleEn, { exact: true })).toBeVisible();
  await expect(page.getByText(LESSON.observeMm, { exact: false })).toBeVisible();
  await expect(image).toHaveAttribute('src', LESSON.asset);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => ({
    width: element.naturalWidth,
    height: element.naturalHeight,
  }))).toEqual({ width: 1200, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
  await page.screenshot({
    path: resolve(screenshotDir, `${LESSON.slug}-desktop.jpg`),
    fullPage: true,
    type: 'jpeg',
    quality: 82,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(reviewCard(), { waitUntil: 'networkidle' });
  const cardBox = await page.getByTestId('review-card').boundingBox();
  expect(cardBox).not.toBeNull();
  expect(cardBox!.x).toBeGreaterThanOrEqual(0);
  expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: resolve(screenshotDir, `${LESSON.slug}-mobile.jpg`),
    fullPage: true,
    type: 'jpeg',
    quality: 82,
  });

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
