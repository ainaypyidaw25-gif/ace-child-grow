import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GUIDES = [
  ['gd_7_9m_cognitive', '၇ – ၉ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '7–9 months — Cognitive guide', '/guides/gd_7_9m_cognitive.573c2f0d30.webp'],
  ['gd_7_9m_communication', '၇ – ၉ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', '7–9 months — Communication guide', '/guides/gd_7_9m_communication.bdb749e2a3.webp'],
  ['gd_7_9m_daily_routine', '၇ – ၉ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', '7–9 months — Daily routine guide', '/guides/gd_7_9m_daily_routine.fa72ddb356.webp'],
  ['gd_7_9m_emotional', '၇ – ၉ လ — စိတ်ခံစားမှု လမ်းညွှန်', '7–9 months — Emotional guide', '/guides/gd_7_9m_emotional.73eabf88fb.webp'],
  ['gd_7_9m_fine_motor', '၇ – ၉ လ — လက်ချောင်းငယ် လှုပ်ရှားမှု လမ်းညွှန်', '7–9 months — Fine motor guide', '/guides/gd_7_9m_fine_motor.90cd7a6e1a.webp'],
  ['gd_7_9m_gross_motor', '၇–၉ လ — ကြွက်သားကြီး လှုပ်ရှားမှု', '7–9 months — Gross Motor', '/guides/gd_7_9m_gross_motor.9ede7495bd.webp'],
  ['gd_7_9m_language', '၇ – ၉ လ — ဘာသာစကား နားလည်မှု လမ်းညွှန်', '7–9 months — Language guide', '/guides/gd_7_9m_language.4d8fa21cb8.webp'],
  ['gd_7_9m_nutrition', '၇ – ၉ လ — အာဟာရ လမ်းညွှန်', '7–9 months — Nutrition guide', '/guides/gd_7_9m_nutrition.4276d1d573.webp'],
  ['gd_7_9m_safety', '၇ – ၉ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', '7–9 months — Safety guide', '/guides/gd_7_9m_safety.d33c9acaf9.webp'],
  ['gd_7_9m_self_help', '၇ – ၉ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်', '7–9 months — Self-help guide', '/guides/gd_7_9m_self_help.cdfac6e4bf.webp'],
  ['gd_7_9m_sleep', '၇ – ၉ လ — အိပ်စက်ခြင်း လမ်းညွှန်', '7–9 months — Sleep guide', '/guides/gd_7_9m_sleep.49c5004bb6.webp'],
  ['gd_7_9m_social', '၇ – ၉ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '7–9 months — Social guide', '/guides/gd_7_9m_social.2a908691eb.webp'],
  ['gd_7_9m_speech', '၇ – ၉ လ — စကားသံ ထွက်ဆိုမှု လမ်းညွှန်', '7–9 months — Speech guide', '/guides/gd_7_9m_speech.b2b52b6578.webp'],
] as const;

const screenshotDir = resolve(
  process.cwd(),
  'docs/illustration-review/screenshots/guides-7_9m',
);

function reviewCard(titleMm: string, titleEn: string, asset: string) {
  return `<!doctype html>
    <html lang="my">
      <head>
        <base href="http://localhost:4173/">
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 28px; background: #f7f5ed; color: #173b35; font-family: "Noto Sans Myanmar", system-ui, sans-serif; }
          main { width: min(900px, 100%); margin: 0 auto; padding: 24px; border: 1px solid #d8e0d9; border-radius: 28px; background: #fff; box-shadow: 0 12px 40px rgba(23,59,53,.09); }
          h1 { margin: 0; font-size: 28px; line-height: 1.65; }
          p { margin: 3px 0 20px; color: #5e706c; font-size: 18px; }
          img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 20px; }
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

test('serves all 13 exact 7–9 month guide assets and captures text-image review cards', async ({ page, request }) => {
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
    const image = page.getByTestId('guide-illustration');
    await expect(page.getByRole('heading', { name: titleMm })).toBeVisible();
    await expect(page.getByText(titleEn, { exact: true })).toBeVisible();
    await expect(image).toHaveAttribute('src', asset);
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => ({
      width: element.naturalWidth,
      height: element.naturalHeight,
    }))).toEqual({ width: 1200, height: 900 });
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
    const card = page.getByTestId('review-card');
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeGreaterThanOrEqual(0);
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }

  expect(new Set(GUIDES.map(([, , , asset]) => asset)).size).toBe(13);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
