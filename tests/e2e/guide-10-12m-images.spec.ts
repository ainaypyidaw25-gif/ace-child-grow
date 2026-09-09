import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GUIDES = [
  ['gd_10_12m_cognitive', '၁၀ – ၁၂ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '10–12 months — Cognitive guide', '/guides/gd_10_12m_cognitive.b07b3296a1.webp'],
  ['gd_10_12m_communication', '၁၀–၁၂ လ — ဆက်သွယ်ပြောဆိုမှု', '10–12 months — Communication', '/guides/gd_10_12m_communication.b4bbd30a3d.webp'],
  ['gd_10_12m_daily_routine', '၁၀ – ၁၂ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', '10–12 months — Daily routine guide', '/guides/gd_10_12m_daily_routine.53210581ab.webp'],
  ['gd_10_12m_emotional', '၁၀ – ၁၂ လ — စိတ်ခံစားမှု ဖွံ့ဖြိုးမှု လမ်းညွှန်', '10–12 months — Emotional guide', '/guides/gd_10_12m_emotional.2c08ce4b18.webp'],
  ['gd_10_12m_fine_motor', '၁၀ – ၁၂ လ — လက်ချောင်းငယ် လှုပ်ရှားမှု လမ်းညွှန်', '10–12 months — Fine motor guide', '/guides/gd_10_12m_fine_motor.5053c77e93.webp'],
  ['gd_10_12m_gross_motor', '၁၀ – ၁၂ လ — ကြွက်သားကြီး လှုပ်ရှားမှု လမ်းညွှန်', '10–12 months — Gross motor guide', '/guides/gd_10_12m_gross_motor.c00d6ea6f9.webp'],
  ['gd_10_12m_language', '၁၀ – ၁၂ လ — ဘာသာစကား နားလည်မှု လမ်းညွှန်', '10–12 months — Language understanding guide', '/guides/gd_10_12m_language.5f707ac4bc.webp'],
  ['gd_10_12m_nutrition', '၁၀ – ၁၂ လ — အာဟာရ လမ်းညွှန်', '10–12 months — Nutrition guide', '/guides/gd_10_12m_nutrition.6040ff99d5.webp'],
  ['gd_10_12m_play', '၁၀ – ၁၂ လ — ကစားခြင်းနှင့် အိမ်တွင်း ဘေးကင်းရေး လမ်းညွှန်', '10–12 months — Play and home-safety guide', '/guides/gd_10_12m_play.5b6fab6c04.webp'],
  ['gd_10_12m_safety', '၁၀–၁၂ လ — ဘေးကင်းလုံခြုံရေး', '10–12 months — Safety', '/guides/gd_10_12m_safety.982cb1efe2.webp'],
  ['gd_10_12m_self_help', '၁၀ – ၁၂ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်', '10–12 months — Self-help guide', '/guides/gd_10_12m_self_help.ad95467b37.webp'],
  ['gd_10_12m_sleep', '၁၀ – ၁၂ လ — အိပ်စက်ခြင်း လမ်းညွှန်', '10–12 months — Sleep guide', '/guides/gd_10_12m_sleep.ed83041f69.webp'],
  ['gd_10_12m_social', '၁၀ – ၁၂ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '10–12 months — Social guide', '/guides/gd_10_12m_social.e95293d313.webp'],
  ['gd_10_12m_speech', '၁၀ – ၁၂ လ — စကားသံ ထွက်ဆိုမှု လမ်းညွှန်', '10–12 months — Speech guide', '/guides/gd_10_12m_speech.457c2b581c.webp'],
] as const;

const screenshotDir = resolve(
  process.cwd(),
  'docs/illustration-review/screenshots/guides-10_12m',
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

test('serves all 14 exact 10–12 month guide assets and captures text-image review cards', async ({ page, request }) => {
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
    const card = page.getByTestId('review-card');
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeGreaterThanOrEqual(0);
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }

  expect(new Set(GUIDES.map(([, , , asset]) => asset)).size).toBe(14);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
