#!/usr/bin/env node
/**
 * Clinical review pack generator — ages 0–12 months.
 *
 * Builds the artefacts a clinical reviewer actually works from, off the same
 * `buildReviewBatch` the admin screen uses, so the paperwork and the app can
 * never disagree:
 *
 *   docs/review/batch-0-12m-checklist.md    printable, per-item, bilingual
 *   docs/review/batch-0-12m-tracker.csv     one row per item × dimension
 *   docs/review/batch-0-12m-dashboard.html  self-contained progress dashboard
 *   docs/review/batch-0-12m.json            machine-readable batch
 *
 * Generation is READ-ONLY with respect to review state. It writes files to
 * docs/ and touches nothing in the database, publishes nothing and approves
 * nothing — the checkboxes it emits are all empty, because a checklist that
 * arrives pre-ticked is not a review.
 *
 *   node scripts/evidence-review-pack.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';

const TODAY = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? new Date().toISOString().slice(0, 10);
const OUT = 'docs/review';

// --- load the batch from TypeScript --------------------------------------

async function loadBatch() {
  const dir = mkdtempSync(join(tmpdir(), 'review-pack-'));
  const outfile = join(dir, 'batch.mjs');
  try {
    await build({
      stdin: {
        contents: `export { buildReviewBatch, REVIEWER_CHECKLIST } from './src/evidence/reviewBatch';`,
        resolveDir: process.cwd(),
        loader: 'ts',
      },
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile,
      logLevel: 'silent',
    });
    const mod = await import(`file://${outfile}`);
    return { batch: mod.buildReviewBatch(TODAY), checklist: mod.REVIEWER_CHECKLIST };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const { batch, checklist } = await loadBatch();
mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const csvCell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

// --- 1. printable checklist ----------------------------------------------

function checklistMarkdown() {
  const p = batch.progress;
  const out = [];

  out.push('# ACE Child Grow — Clinical Review Checklist');
  out.push('# ACE Child Grow — ဆေးပညာဆိုင်ရာ သုံးသပ်ချက် စာရင်း');
  out.push('');
  out.push(`**Batch:** ${batch.batchId} · **Age range:** 0–12 months · **Generated:** ${batch.generatedOn}`);
  out.push('');
  out.push('> This platform is educational and screening-support only. It does not diagnose.');
  out.push('> A reviewer signs off content, never a child. If an item cannot be signed off, leave it unticked and');
  out.push('> write why — an unfinished review is a usable result; a guessed one is not.');
  out.push('');
  out.push('> ဤပလက်ဖောင်းသည် ပညာပေးနှင့် ကြိုတင်စစ်ဆေးမှု အထောက်အကူသာ ဖြစ်သည်။ ရောဂါ အတည်မပြုပါ။');
  out.push('');

  out.push('## Reviewer / သုံးသပ်သူ');
  out.push('');
  out.push('| | |');
  out.push('|---|---|');
  out.push('| Name / အမည် | |');
  out.push('| Qualification / ပညာအရည်အချင်း | |');
  out.push('| Registration number / မှတ်ပုံတင်အမှတ် | |');
  out.push('| Date started / စတင်သည့်ရက် | |');
  out.push('| Date completed / ပြီးဆုံးသည့်ရက် | |');
  out.push('');
  out.push('A sign-off with no stated qualification is not a sign-off. The system enforces this: an approval');
  out.push('cannot be recorded without both a name and a qualification.');
  out.push('');

  out.push('## The eight dimensions / စစ်ဆေးရမည့် အချက် ရှစ်ချက်');
  out.push('');
  for (const [i, d] of checklist.entries()) {
    out.push(`**${i + 1}. ${d.labelEn} / ${d.labelMm}** — ${d.blocking ? '**blocking**' : 'advisory'}`);
    out.push('');
    out.push(`- EN: ${d.promptEn}`);
    out.push(`- MM: ${d.promptMm}`);
    out.push('');
  }
  out.push('A **blocking** dimension that fails means the item does not go to parents. An **advisory** dimension');
  out.push('that fails is recorded and scheduled, not treated as a defect — an old reference is a prompt to look');
  out.push('for a newer edition, not proof the content is wrong.');
  out.push('');

  out.push('## Scope of this batch / ဤအစု၏ နယ်ပယ်');
  out.push('');
  out.push(`This batch contains **${p.total} items** whose declared age scope falls entirely within 0–12 months.`);
  out.push(`Completing it requires **${p.checklistAnswers} checklist answers** (${p.total} items × ${checklist.length} dimensions).`);
  out.push('');
  out.push('Content carrying no age scope is deliberately **not** in this batch, even though a parent of an infant');
  out.push('can see it. It needs its own batch, and a completed 0–12 month review must not be read as covering it:');
  out.push('');
  for (const g of batch.outOfScopeAgeAgnostic) out.push(`- ${g.type}: ${g.count} items`);
  out.push('');

  if (p.blocked > 0) {
    out.push('## Blocked items / ပိတ်ဆို့ထားသော အကြောင်းအရာ');
    out.push('');
    out.push('These cannot be signed off yet regardless of clinical judgement — the evidence base has to be');
    out.push('repaired first. Do not tick them.');
    out.push('');
    for (const item of batch.items.filter((i) => i.blockers.length > 0)) {
      out.push(`- \`${item.slug}\` — ${item.blockers.join('; ')}`);
    }
    out.push('');
  }

  out.push('---');
  out.push('');
  out.push('## Items / အကြောင်းအရာများ');
  out.push('');

  for (const g of batch.groups.byAgeGroup) {
    const rows = batch.items.filter((i) => i.ageGroupKey === g.key);
    out.push(`### ${g.label} (${rows.length})`);
    out.push('');
    for (const item of rows) {
      out.push(`#### ${item.titleEn}`);
      out.push(`${item.titleMm}`);
      out.push('');
      out.push(
        `\`${item.slug}\` · ${item.type}${item.domainLabelEn ? ` · ${item.domainLabelEn}` : ''} · status: ${item.clinicalStatus}`,
      );
      out.push('');

      if (item.blockers.length > 0) {
        out.push(`> **BLOCKED — do not sign off:** ${item.blockers.join('; ')}`);
        out.push('');
      }
      if (item.advisories.length > 0) {
        for (const a of item.advisories) out.push(`> **Advisory:** ${a}`);
        out.push('');
      }

      out.push('References cited / ကိုးကားထားသော အရင်းအမြစ်များ:');
      out.push('');
      for (const r of item.references) {
        const flags = [
          r.reviewStatus,
          r.expired ? 'EXPIRED — re-check overdue' : null,
          r.outdated ? 'OUTDATED — look for a newer edition' : null,
        ]
          .filter(Boolean)
          .join(', ');
        out.push(`- ${r.orgKey} ${r.year ?? '—'} — ${r.title} *(${flags})*`);
      }
      out.push('');

      out.push('| # | Dimension | Pass | Fail | N/A | Reviewer comment |');
      out.push('|---|---|---|---|---|---|');
      for (const [i, d] of checklist.entries()) {
        out.push(`| ${i + 1} | ${d.labelEn} / ${d.labelMm}${d.blocking ? ' **(blocking)**' : ''} | ☐ | ☐ | ☐ | |`);
      }
      out.push('');
      out.push('**Outcome:** ☐ Approve for publication  ☐ Approve with changes  ☐ Reject  ☐ Needs more evidence');
      out.push('');
      out.push('**Reviewer notes:**');
      out.push('');
      out.push('');
      out.push('---');
      out.push('');
    }
  }

  return out.join('\n');
}

// --- 2. tracker csv -------------------------------------------------------

function trackerCsv() {
  const header = [
    'batch_id', 'slug', 'content_type', 'age_group', 'domain', 'clinical_status',
    'blocked', 'blocker_reasons', 'advisories', 'reference_count', 'organisations',
    'dimension_key', 'dimension_en', 'dimension_mm', 'blocking',
    'result', 'reviewer_name', 'reviewer_qualification', 'review_date', 'comment',
  ];
  const rows = [header.map(csvCell).join(',')];
  for (const item of batch.items) {
    for (const d of checklist) {
      rows.push(
        [
          batch.batchId, item.slug, item.type, item.ageGroupLabelEn, item.domainLabelEn ?? '',
          item.clinicalStatus, item.blockers.length > 0 ? 'yes' : 'no', item.blockers.join('; '),
          item.advisories.join('; '), item.references.length, item.orgKeys.join(' '),
          d.key, d.labelEn, d.labelMm, d.blocking ? 'blocking' : 'advisory',
          // Deliberately empty: the tracker ships with no results filled in.
          '', '', '', '', '',
        ].map(csvCell).join(','),
      );
    }
  }
  return rows.join('\n');
}

// --- 3. self-contained dashboard -----------------------------------------

/**
 * The dashboard is opened by a reviewer on a machine we do not control, offline,
 * with no build step. Myanmar script is poorly covered by default system fonts —
 * on a machine without one the text degrades into broken or missing glyphs, and
 * a clinical reviewer cannot check Myanmar wording they cannot read. So the font
 * travels inside the file. ~40 KB of base64 is a cheap price for the Myanmar
 * half of a bilingual document actually being legible.
 */
function embeddedFontCss() {
  const faces = [
    ['400', 'noto-sans-myanmar-myanmar-400-normal.woff2'],
    ['700', 'noto-sans-myanmar-myanmar-700-normal.woff2'],
  ];
  const out = [];
  for (const [weight, file] of faces) {
    const path = `node_modules/@fontsource/noto-sans-myanmar/files/${file}`;
    if (!existsSync(path)) continue;
    const b64 = readFileSync(path).toString('base64');
    out.push(
      `@font-face{font-family:"Noto Sans Myanmar";font-style:normal;font-weight:${weight};font-display:swap;` +
        `src:url(data:font/woff2;base64,${b64}) format("woff2");` +
        `unicode-range:U+1000-109F,U+A9E0-A9FF,U+AA60-AA7F;}`,
    );
  }
  if (out.length === 0) {
    console.warn('WARNING: Myanmar webfont not found — the dashboard will rely on system fonts.');
  }
  return out.join('\n');
}

function dashboardHtml() {
  const p = batch.progress;
  const data = JSON.stringify({ batch, checklist });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ACE Child Grow — Review Progress 0–12m</title>
<style>
${embeddedFontCss()}
  :root{--ink:#243244;--soft:#6b7a8d;--line:#e2e8f0;--canvas:#f6f8fb;--sky:#3b82c4;--mint:#4bb89a;--mint-soft:#e3f5ef;--warn:#fbcfa4;--note:#fbeaa4;--lav:#e8e4f7}
  *{box-sizing:border-box}
  body{margin:0;background:var(--canvas);color:var(--ink);font:15px/1.55 "Noto Sans Myanmar",system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  .wrap{max-width:1080px;margin:0 auto;padding:24px 16px 64px}
  header{display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;justify-content:space-between}
  h1{font-size:22px;margin:0;color:#22557f}
  h2{font-size:16px;margin:0 0 10px}
  .meta{font-size:12px;color:var(--soft)}
  .card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;margin-top:16px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
  .notice{background:#fdf6dd;border-radius:12px;padding:10px 14px;font-size:14px;margin-top:16px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
  .stat{background:var(--canvas);border-radius:12px;padding:10px 12px}
  .stat.good{background:var(--mint-soft)} .stat.warn{background:var(--warn)} .stat.note{background:var(--note)}
  .stat b{display:block;font-size:22px;line-height:1.2}
  .stat span{font-size:12px;color:var(--soft)}
  .bar{height:10px;background:var(--canvas);border-radius:99px;overflow:hidden;margin-top:6px}
  .bar>i{display:block;height:100%;background:var(--mint)}
  .pills{display:flex;flex-wrap:wrap;gap:8px}
  button{font:inherit;cursor:pointer;border:0;border-radius:99px;padding:6px 14px;background:var(--canvas);color:var(--soft);font-size:13px;font-weight:600}
  button[aria-pressed=true]{background:var(--sky);color:#fff}
  .grp{margin-top:16px}
  .grp>h3{font-size:14px;margin:0 0 6px;display:flex;gap:8px;align-items:center}
  .cnt{background:var(--lav);color:var(--soft);border-radius:99px;padding:1px 9px;font-size:12px;font-weight:400}
  .item{border:1px solid var(--line);border-radius:12px;padding:8px 12px;margin-bottom:6px}
  .item>summary{cursor:pointer;list-style:none}
  .item>summary::-webkit-details-marker{display:none}
  .tags{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;color:var(--soft)}
  .tag{background:var(--canvas);border-radius:99px;padding:1px 8px}
  .tag.blocked{background:var(--warn);color:var(--ink);font-weight:700}
  .tag.adv{background:var(--note);color:var(--ink);font-weight:700}
  .title{font-size:14px;font-weight:500;margin-top:4px}
  .detail{margin-top:8px;background:var(--canvas);border-radius:10px;padding:8px 12px;font-size:12px;color:var(--soft)}
  .detail p.h{font-weight:700;color:var(--ink);margin:8px 0 2px}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  ul{margin:2px 0;padding-left:18px}
  .dim{border:1px solid var(--line);border-radius:12px;padding:8px 12px;margin-bottom:6px}
  .dim .b{background:var(--warn);border-radius:99px;padding:1px 8px;font-size:11px;font-weight:700;margin-left:6px}
  .dim .a{background:var(--canvas);border-radius:99px;padding:1px 8px;font-size:11px;color:var(--soft);margin-left:6px}
  .mm{display:none}
  body.lang-mm .mm{display:inline} body.lang-mm .en{display:none}
  footer{margin-top:24px;font-size:12px;color:var(--soft)}
</style>
</head>
<body class="lang-en">
<div class="wrap">
  <header>
    <h1><span class="en">Clinical review progress — 0–12 months</span><span class="mm">သုံးသပ်မှု တိုးတက်မှု — ၀–၁၂ လ</span></h1>
    <div class="pills">
      <button id="lang-en" aria-pressed="true">English</button>
      <button id="lang-mm" aria-pressed="false">မြန်မာ</button>
    </div>
  </header>
  <p class="meta">${esc(batch.batchId)} · generated ${esc(batch.generatedOn)} · ACE Child Grow</p>

  <p class="notice">
    <span class="en"><b>Read-only.</b> This dashboard reports what needs review. It publishes nothing, approves nothing, and is not a diagnosis of any child.</span>
    <span class="mm"><b>ဖတ်ရှုရန်သာ။</b> ဤ dashboard သည် သုံးသပ်ရန် လိုအပ်သည်များကို ပြသည်။ မည်သည့် အကြောင်းအရာကိုမျှ ထုတ်ဝေခြင်း၊ အတည်ပြုခြင်း မပြုပါ။ ကလေး၏ ရောဂါ အတည်ပြုချက် မဟုတ်ပါ။</span>
  </p>

  <section class="card">
    <h2><span class="en">Batch at a glance</span><span class="mm">အစု အကျဉ်းချုပ်</span></h2>
    <div class="stats">
      <div class="stat"><b>${p.total}</b><span class="en">Items in batch</span><span class="mm">စုစုပေါင်း</span></div>
      <div class="stat good"><b>${p.reviewableNow}</b><span class="en">Reviewable now</span><span class="mm">ယခု သုံးသပ်နိုင်</span></div>
      <div class="stat ${p.blocked > 0 ? 'warn' : 'good'}"><b>${p.blocked}</b><span class="en">Blocked</span><span class="mm">ပိတ်ဆို့ထား</span></div>
      <div class="stat note"><b>${p.withAdvisories}</b><span class="en">With advisories</span><span class="mm">သတိပြုရန် ရှိ</span></div>
      <div class="stat"><b>${p.published}</b><span class="en">Published</span><span class="mm">ထုတ်ဝေပြီး</span></div>
      <div class="stat"><b>${p.inClinicalReview}</b><span class="en">In clinical review</span><span class="mm">သုံးသပ်ဆဲ</span></div>
      <div class="stat"><b>${p.distinctReferences}</b><span class="en">Distinct references</span><span class="mm">ကိုးကားချက် အရေအတွက်</span></div>
      <div class="stat"><b>${p.checklistAnswers}</b><span class="en">Checklist answers required</span><span class="mm">ဖြေဆိုရမည့် စစ်ဆေးချက်</span></div>
    </div>

    <p class="meta" style="margin-top:14px">
      <span class="en">Review progress — 0 of ${p.checklistAnswers} checklist answers recorded. No human review has been signed off yet.</span>
      <span class="mm">သုံးသပ်မှု တိုးတက်မှု — ${p.checklistAnswers} ခုအနက် ၀ ခု။ လူ သုံးသပ်ချက် မစတင်ရသေးပါ။</span>
    </p>
    <div class="bar"><i style="width:0%"></i></div>

    <p class="meta" style="margin-top:12px">
      references — approved ${p.referencesApproved} · awaiting ${p.referencesAwaiting} ·
      evidence required ${p.referencesEvidenceRequired} · expired ${p.expiredReferences} · outdated ${p.outdatedReferences}
    </p>
  </section>

  <section class="card">
    <h2><span class="en">Group the batch by</span><span class="mm">အစုကို ခွဲခြားကြည့်ရန်</span></h2>
    <div class="pills" id="grouping">
      <button data-g="age" aria-pressed="true"><span class="en">Age group</span><span class="mm">အသက်အုပ်စု</span></button>
      <button data-g="domain" aria-pressed="false"><span class="en">Development domain</span><span class="mm">ဖွံ့ဖြိုးမှု နယ်ပယ်</span></button>
      <button data-g="type" aria-pressed="false"><span class="en">Content type</span><span class="mm">အမျိုးအစား</span></button>
      <button data-g="org" aria-pressed="false"><span class="en">Source organisation</span><span class="mm">အရင်းအမြစ် အဖွဲ့အစည်း</span></button>
      <button data-g="status" aria-pressed="false"><span class="en">Review status</span><span class="mm">သုံးသပ်မှု အခြေအနေ</span></button>
    </div>
    <div id="groups"></div>
  </section>

  <section class="card">
    <h2><span class="en">Reviewer checklist — every item, all eight dimensions</span><span class="mm">သုံးသပ်သူ စစ်ဆေးရန် စာရင်း</span></h2>
    ${checklist
      .map(
        (d, i) => `<div class="dim">
      <div><b>${i + 1}. <span class="en">${esc(d.labelEn)}</span><span class="mm">${esc(d.labelMm)}</span></b>
      <span class="${d.blocking ? 'b' : 'a'}">${d.blocking ? 'blocking' : 'advisory'}</span></div>
      <div class="meta"><span class="en">${esc(d.promptEn)}</span><span class="mm">${esc(d.promptMm)}</span></div>
    </div>`,
      )
      .join('\n    ')}
  </section>

  <section class="card">
    <h2><span class="en">Deliberately outside this batch</span><span class="mm">ဤအစုတွင် မပါဝင်သော အကြောင်းအရာ</span></h2>
    <p class="meta">
      <span class="en">These items carry no age scope, so they are not in the 0–12 month batch. A parent of an infant can still see them, so a completed batch must not be read as covering them.</span>
      <span class="mm">အသက်အုပ်စု သတ်မှတ်ချက် မရှိသဖြင့် ဤအစုတွင် မပါဝင်ပါ။ ၀–၁၂ လ ကလေးမိဘများ မြင်နိုင်သဖြင့် သီးခြား အစုဖြင့် သုံးသပ်ရမည်။</span>
    </p>
    <div class="pills" style="margin-top:8px">
      ${batch.outOfScopeAgeAgnostic.map((g) => `<span class="tag">${esc(g.type)} · ${g.count}</span>`).join('\n      ')}
    </div>
  </section>

  <footer>
    <span class="en">ACE Child Grow is educational and screening-support only. It never diagnoses a child. Approval of content requires a named reviewer and a stated professional qualification.</span>
    <span class="mm">ACE Child Grow သည် ပညာပေးနှင့် ကြိုတင်စစ်ဆေးမှု အထောက်အကူသာ ဖြစ်သည်။ ကလေး၏ ရောဂါကို မည်သည့်အခါမျှ အတည်မပြုပါ။</span>
  </footer>
</div>

<script>
const DATA = ${data};
const body = document.body;
document.getElementById('lang-en').onclick = () => setLang('en');
document.getElementById('lang-mm').onclick = () => setLang('mm');
function setLang(l){
  body.className = 'lang-' + l;
  document.getElementById('lang-en').setAttribute('aria-pressed', String(l === 'en'));
  document.getElementById('lang-mm').setAttribute('aria-pressed', String(l === 'mm'));
  render();
}
const GROUPS = {
  age: b => b.groups.byAgeGroup, domain: b => b.groups.byDomain, type: b => b.groups.byType,
  org: b => b.groups.byOrganization, status: b => b.groups.byReviewStatus,
};
const KEYOF = {
  age: i => [i.ageGroupKey], domain: i => [i.domainKey || 'not_domain_scoped'], type: i => [i.type],
  org: i => i.orgKeys, status: i => [i.clinicalStatus],
};
let grouping = 'age';
for (const btn of document.querySelectorAll('#grouping button')) {
  btn.onclick = () => {
    grouping = btn.dataset.g;
    for (const b of document.querySelectorAll('#grouping button')) b.setAttribute('aria-pressed', String(b === btn));
    render();
  };
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render(){
  const mm = body.classList.contains('lang-mm');
  const out = [];
  for (const g of GROUPS[grouping](DATA.batch)) {
    const rows = DATA.batch.items.filter(i => KEYOF[grouping](i).includes(g.key));
    out.push('<div class="grp"><h3>' + esc(mm ? g.labelMm : g.label) + '<span class="cnt">' + g.count + '</span></h3>');
    for (const it of rows) {
      const tags = ['<span class="tag">' + esc(it.type) + '</span>',
        '<span class="tag">' + esc(mm ? it.ageGroupLabelMm : it.ageGroupLabelEn) + '</span>'];
      if (it.domainLabelEn) tags.push('<span class="tag">' + esc((mm && it.domainLabelMm) || it.domainLabelEn) + '</span>');
      if (it.blockers.length) tags.push('<span class="tag blocked">' + (mm ? 'ပိတ်ဆို့' : 'BLOCKED') + '</span>');
      if (it.advisories.length) tags.push('<span class="tag adv">' + (mm ? 'သတိပြုရန်' : 'ADVISORY') + '</span>');
      const refs = it.references.map(r =>
        '<li>' + esc(r.orgKey) + ' ' + (r.year || '—') + ' — ' + esc(r.title) +
        ' <span class="tag">' + esc(r.reviewStatus) + '</span>' +
        (r.expired ? ' <span class="tag blocked">EXPIRED</span>' : '') +
        (r.outdated ? ' <span class="tag adv">OUTDATED</span>' : '') + '</li>').join('');
      out.push('<details class="item"><summary><div class="tags">' + tags.join('') + '</div>' +
        '<div class="title">' + esc(mm ? it.titleMm : it.titleEn) + '</div></summary>' +
        '<div class="detail"><p class="mono">' + esc(it.slug) + '</p>' +
        (it.blockers.length ? '<p class="h">' + (mm ? 'ပိတ်ဆို့နေသည့် အကြောင်းရင်း' : 'Blockers') + '</p><ul>' + it.blockers.map(b => '<li>' + esc(b) + '</li>').join('') + '</ul>' : '') +
        (it.advisories.length ? '<p class="h">' + (mm ? 'သတိပြုရန်' : 'Advisories') + '</p><ul>' + it.advisories.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') +
        '<p class="h">' + (mm ? 'ကိုးကားချက်' : 'References') + ' (' + it.references.length + ')</p><ul>' + refs + '</ul>' +
        '</div></details>');
    }
    out.push('</div>');
  }
  document.getElementById('groups').innerHTML = out.join('');
}
render();
</script>
</body>
</html>
`;
}

// --- write ----------------------------------------------------------------

const files = [
  [`${OUT}/batch-0-12m-checklist.md`, checklistMarkdown()],
  [`${OUT}/batch-0-12m-tracker.csv`, trackerCsv()],
  [`${OUT}/batch-0-12m-dashboard.html`, dashboardHtml()],
  [`${OUT}/batch-0-12m.json`, JSON.stringify({ batch, checklist }, null, 2)],
];

for (const [path, content] of files) {
  writeFileSync(path, content);
  console.log(`wrote ${path} (${(content.length / 1024).toFixed(1)} KB)`);
}

console.log(
  `\nbatch ${batch.batchId}: ${batch.progress.total} items, ${batch.progress.checklistAnswers} checklist answers required, ` +
    `${batch.progress.blocked} blocked, ${batch.progress.withAdvisories} with advisories.`,
);
console.log('Nothing was published and nothing was approved.');
