// Demo runner: generates a sample Myanmar (or English) monthly report PDF to
// prove the pipeline produces a real, Myanmar-shaped, downloadable A4 PDF.
// Run: node scripts/generate-report-pdf.mjs [mm|en] [outfile]
import { renderReportPdf } from './pdf/renderReportPdf.mjs';

const locale = process.argv[2] === 'en' ? 'en' : 'mm';
const outPath = process.argv[3] || `sample-report-${locale}.pdf`;

// Shape mirrors the app's report builder output (src/domain/reports/report.ts).
const report = locale === 'mm'
  ? {
      childNickname: 'ကြယ်လေး',
      period: { start: '2026-06-24', end: '2026-07-24' },
      chronologicalAgeLabel: '၂ နှစ် ၆ လ',
      correctedAgeLabel: undefined,
      strengths: ['ရုပ်ပုံများကို အမည်ပြောနိုင်သည်', 'စာအုပ်အတူဖတ်ရသည်ကို နှစ်သက်သည်'],
      emergingSkills: ['စကားလုံးနှစ်လုံးတွဲ ပြောခြင်း'],
      completedActivities: ['ပုံစာအုပ် အတူဖတ်ခြင်း'],
      questionsForProfessional: ['စကားနှစ်လုံးတွဲ ပြောနိုင်ရန် မည်သို့ ကူညီနိုင်မလဲ။'],
      nextReviewDate: '2026-08-21',
    }
  : {
      childNickname: 'Little Star',
      period: { start: '2026-06-24', end: '2026-07-24' },
      chronologicalAgeLabel: '2 years 6 months',
      correctedAgeLabel: undefined,
      strengths: ['Names familiar pictures', 'Enjoys shared reading'],
      emergingSkills: ['Two-word phrases'],
      completedActivities: ['Shared picture-book reading'],
      questionsForProfessional: ['How can I support two-word phrases?'],
      nextReviewDate: '2026-08-21',
    };

const out = await renderReportPdf(report, { locale, outPath });
console.log('Generated', out);
