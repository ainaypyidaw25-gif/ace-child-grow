// Myanmar-compatible PDF report generator.
//
// Renders report HTML in Chromium (whose HarfBuzz engine shapes Myanmar script
// correctly — reordering, ligatures, stacking) and prints to an A4 PDF. The
// Noto Sans Myanmar font is embedded as base64 so rendering does not depend on
// system fonts. This is the module the app's server/Edge function would call.
//
// Usage: import { renderReportPdf } from './renderReportPdf.mjs'
//        await renderReportPdf(report, { locale: 'mm', outPath: 'report.pdf' })

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, '../../node_modules/@fontsource/noto-sans-myanmar/files');
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function fontDataUrl(file) {
  const buf = readFileSync(path.join(FONT_DIR, file));
  return `data:font/woff2;base64,${buf.toString('base64')}`;
}

function fontFaces() {
  const faces = [
    { file: 'noto-sans-myanmar-myanmar-400-normal.woff2', weight: 400, range: 'U+1000-109F, U+A9E0-A9FF, U+AA60-AA7F' },
    { file: 'noto-sans-myanmar-myanmar-700-normal.woff2', weight: 700, range: 'U+1000-109F, U+A9E0-A9FF, U+AA60-AA7F' },
    { file: 'noto-sans-myanmar-latin-400-normal.woff2', weight: 400, range: 'U+0000-00FF' },
    { file: 'noto-sans-myanmar-latin-700-normal.woff2', weight: 700, range: 'U+0000-00FF' },
  ];
  return faces
    .map(
      (f) => `@font-face{font-family:'NotoMM';font-style:normal;font-weight:${f.weight};` +
        `src:url('${fontDataUrl(f.file)}') format('woff2');unicode-range:${f.range};}`,
    )
    .join('\n');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function section(title, items) {
  if (!items || !items.length) return '';
  return `<section><h2>${esc(title)}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>`;
}

export function reportHtml(report, locale = 'mm') {
  const L = locale === 'mm'
    ? {
        strengths: 'အားသာချက်များ', emerging: 'ပေါ်ထွက်လာနေသော ကျွမ်းကျင်မှုများ',
        activities: 'ပြီးစီးသော လှုပ်ရှားမှုများ', questions: 'ပညာရှင်ကို မေးရန် မေးခွန်းများ',
        nextReview: 'နောက်ပြန်စစ်ရန်ရက်', period: 'ကာလ', age: 'အသက်',
        disclaimer: 'ဤအစီရင်ခံစာသည် ရောဂါရှာဖွေမှု မဟုတ်ပါ။ ကလေး၏ဖွံ့ဖြိုးမှုကို နားလည်ရန် ကူညီပေးသည့် ပညာပေးအချက်အလက်သာ ဖြစ်ပါသည်။',
      }
    : {
        strengths: 'Strengths', emerging: 'Emerging skills',
        activities: 'Completed activities', questions: 'Questions for a professional',
        nextReview: 'Next review date', period: 'Period', age: 'Age',
        disclaimer: 'This report is not a diagnosis. It is educational information to help you understand your child’s development.',
      };
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
${fontFaces()}
*{box-sizing:border-box;margin:0;padding:0}
html{font-family:'NotoMM',sans-serif;color:#263238;font-size:12pt;line-height:1.8}
body{padding:0}
.page{padding:18mm 16mm}
h1{color:#2F80ED;font-size:20pt;font-weight:700;margin-bottom:4pt}
.meta{color:#60717A;font-size:10.5pt;margin-bottom:14pt}
h2{color:#263238;font-size:13pt;font-weight:700;margin:12pt 0 4pt}
ul{padding-left:18pt}
li{margin:2pt 0}
.badge{display:inline-block;background:#EAFBF5;color:#2E9E6B;border-radius:999px;padding:2pt 10pt;font-size:9.5pt;margin-top:6pt}
.disclaimer{margin-top:16pt;background:#F5FAFD;border-radius:10pt;padding:10pt;font-size:10pt;color:#60717A}
.brand{color:#66D6B0;font-weight:700}
</style></head><body><div class="page">
<h1>🌱 ${esc(report.childNickname)}</h1>
<p class="meta">${esc(L.period)}: ${esc(report.period?.start)} → ${esc(report.period?.end)} · ${esc(L.age)}: ${esc(report.chronologicalAgeLabel)}${report.correctedAgeLabel ? ` (${esc(report.correctedAgeLabel)} corrected)` : ''}</p>
${section(L.strengths, report.strengths)}
${section(L.emerging, report.emergingSkills)}
${section(L.activities, report.completedActivities)}
${section(L.questions, report.questionsForProfessional)}
${report.nextReviewDate ? `<p class="meta">${esc(L.nextReview)}: ${esc(report.nextReviewDate)}</p>` : ''}
<p class="disclaimer">${esc(L.disclaimer)}</p>
<p class="badge">ACE Child Grow · Every Child Can Grow</p>
</div></body></html>`;
}

export async function renderReportPdf(report, { locale = 'mm', outPath = 'report.pdf' } = {}) {
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(reportHtml(report, locale), { waitUntil: 'networkidle' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return outPath;
  } finally {
    await browser.close();
  }
}
