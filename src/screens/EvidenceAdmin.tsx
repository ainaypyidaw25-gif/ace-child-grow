import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { EVIDENCE_SOURCES } from '../evidence/sources';
import { EVIDENCE_LINKS, relatedContent } from '../evidence/links';
import {
  EVIDENCE_LEVELS,
  EVIDENCE_ORG_KEYS,
  EVIDENCE_REVIEW_STATUSES,
  EVIDENCE_TOPICS,
  effectiveNextReview,
  resolveReviewStatus,
  verificationProblems,
} from '../evidence/types';
import { buildReports } from '../evidence/reports';

// Admin Evidence Library — STAFF ONLY (the server returns `allowed: false` to
// anyone else). This screen shows the reference registry, the eight filters the
// evidence policy requires, the five governance reports, and the clinical
// review action. It never displays a reference as a citation to a parent and it
// never fills in a missing field: a blank cell here means "not printed on the
// publisher page", which is the honest answer.
export function EvidenceAdmin() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);

  const [orgKey, setOrgKey] = useState('');
  const [topic, setTopic] = useState('');
  const [evidenceLevel, setEvidenceLevel] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'registry' | 'reports'>('registry');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  const stats = useQuery(api.evidence.stats, {});
  const listArgs = {
    ...(orgKey ? { orgKey } : {}),
    ...(topic ? { topic } : {}),
    ...(evidenceLevel ? { evidenceLevel } : {}),
    ...(reviewStatus ? { reviewStatus } : {}),
    ...(country ? { country } : {}),
    ...(language ? { language } : {}),
    ...(yearFrom ? { yearFrom: Number(yearFrom) } : {}),
    ...(ageMonths ? { ageMonths: Number(ageMonths) } : {}),
    ...(q ? { q } : {}),
  };
  const list = useQuery(api.evidence.list, listArgs);
  const importSources = useMutation(api.evidence.importSources);
  const importLinks = useMutation(api.evidence.importLinks);
  const setReview = useMutation(api.evidence.setReview);

  const todayIso = new Date().toISOString().slice(0, 10);
  const reports = useMemo(() => buildReports(todayIso), [todayIso]);

  const countries = useMemo(
    () => [...new Set(EVIDENCE_SOURCES.map((s) => s.country).filter((c): c is string => !!c))].sort(),
    [],
  );
  const languages = useMemo(() => [...new Set(EVIDENCE_SOURCES.map((s) => s.language))].sort(), []);

  if (stats === undefined) return <p className="text-ink-soft">…</p>;
  if (!stats.allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <div aria-hidden className="text-4xl">🔒</div>
        <p className="font-semibold text-ink">{L('ဝင်ခွင့် မရှိပါ။', 'You do not have access.')}</p>
        <p className="text-sm text-ink-soft">
          {L('Evidence Library ကို staff သာ သုံးနိုင်သည်။', 'The Evidence Library is staff-only.')}
        </p>
      </div>
    );
  }

  const runImport = async () => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const src = await importSources({
        sources: EVIDENCE_SOURCES.map((s) => ({ ...s, topics: [...s.topics], keywords: [...s.keywords] })),
      });
      const lnk = await importLinks({
        links: EVIDENCE_LINKS.map((l) => ({ kind: l.kind, slug: l.slug, sourceIds: [...l.sourceIds] })),
      });
      setMsg(
        L(
          `ကိုးကား ${src.created} ခု အသစ်၊ ${src.updated} ခု ပြင်ဆင်။ ချိတ်ဆက်မှု ${lnk.created} ခု အသစ်၊ ${lnk.updated} ခု ပြင်ဆင်။`,
          `References: ${src.created} new, ${src.updated} updated. Links: ${lnk.created} new, ${lnk.updated} updated.`,
        ),
      );
    } catch (e) {
      setMsg(L('တင်သွင်းမှု မအောင်မြင်ပါ။ ', 'Import failed. ') + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const review = async (sourceId: string, status: string) => {
    if (pending) return;
    if (!reviewer.trim()) {
      setMsg(L('သုံးသပ်သူ အမည် ထည့်ပါ။', 'Enter the reviewer name first.'));
      return;
    }
    setPending(sourceId);
    setMsg('');
    try {
      await setReview({ sourceId, status, reviewer: reviewer.trim(), reviewDate: todayIso });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setPending(null);
    }
  };

  const sel = 'min-h-touch rounded-pill border border-line bg-white px-3 py-1 text-sm';
  const rows = list?.sources ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{L('အထောက်အထား စာကြည့်တိုက်', 'Evidence Library')}</h1>

      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {L(
          'ကိုးကားချက် တစ်ခုချင်းစီကို ထုတ်ဝေသူစာမျက်နှာမှ တိုက်ရိုက် ဖတ်ပြီး မှတ်တမ်းတင်ထားသည်။ မစစ်ဆေးရသေးသော အချက်အလက်ကို မဖြည့်ပါ — ကွက်လပ်အဖြစ်သာ ထားပြီး evidence_required ဟု အမှတ်အသား ပြုသည်။',
          'Every field here was read off the publisher page named in the URL. Nothing is inferred: an unverifiable field stays blank and the record is marked evidence_required.',
        )}
      </p>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            {L('ကိုးကားချက်', 'References')}: <b>{stats.total}</b>
          </span>
          <span>
            {L('ချိတ်ဆက်မှု', 'Links')}: <b>{stats.links}</b>
          </span>
          <span>
            {L('ချိတ်ဆက်ပြီး အကြောင်းအရာ', 'Linked items')}: <b>{stats.linkedSlugs}</b>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(stats.byStatus).map(([k, n]) => (
            <span key={k} className="rounded-pill bg-canvas px-3 py-0.5">
              {k}: {n as number}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={runImport}
            className="min-h-touch rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? '…' : L('ကိုးကားစာရင်း တင်သွင်းရန်', 'Import reference registry')}
          </button>
          <input
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder={L('သုံးသပ်သူ အမည်', 'Reviewer name')}
            className="min-h-touch rounded-pill border border-line px-3 py-1 text-sm"
          />
        </div>
        {msg && <p className="mt-2 text-sm text-ink-soft">{msg}</p>}
      </section>

      <div className="flex gap-2">
        {(['registry', 'reports'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`min-h-touch rounded-pill px-4 py-1 text-sm font-semibold ${
              tab === k ? 'bg-sky text-white' : 'bg-canvas text-ink-soft'
            }`}
          >
            {k === 'registry' ? L('ကိုးကားစာရင်း', 'Registry') : L('အစီရင်ခံစာများ', 'Reports')}
          </button>
        ))}
      </div>

      {tab === 'registry' && (
        <>
          <section className="flex flex-wrap gap-2">
            <select className={sel} value={orgKey} onChange={(e) => setOrgKey(e.target.value)}>
              <option value="">{L('အဖွဲ့အစည်း — အားလုံး', 'Organization — all')}</option>
              {EVIDENCE_ORG_KEYS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select className={sel} value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">{L('ခေါင်းစဉ် — အားလုံး', 'Topic — all')}</option>
              {EVIDENCE_TOPICS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select className={sel} value={evidenceLevel} onChange={(e) => setEvidenceLevel(e.target.value)}>
              <option value="">{L('အထောက်အထား အဆင့် — အားလုံး', 'Evidence level — all')}</option>
              {EVIDENCE_LEVELS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select className={sel} value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
              <option value="">{L('သုံးသပ်မှု အခြေအနေ — အားလုံး', 'Clinical review — all')}</option>
              {EVIDENCE_REVIEW_STATUSES.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select className={sel} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{L('နိုင်ငံ — အားလုံး', 'Country — all')}</option>
              {countries.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select className={sel} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">{L('ဘာသာစကား — အားလုံး', 'Language — all')}</option>
              {languages.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <input
              className={sel}
              type="number"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder={L('နှစ် (မှစ၍)', 'Year from')}
            />
            <input
              className={sel}
              type="number"
              value={ageMonths}
              onChange={(e) => setAgeMonths(e.target.value)}
              placeholder={L('အသက် (လ)', 'Age (months)')}
            />
            <input
              className={sel}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={L('ရှာဖွေရန်', 'Search')}
            />
          </section>

          {list === undefined ? (
            <p className="text-ink-soft">…</p>
          ) : (
            <>
              <p className="text-sm text-ink-soft">
                {L(`${list.total} ခု တွေ့ရှိသည်။`, `${list.total} references.`)}
              </p>
              <ul className="space-y-2">
                {rows.map((r) => {
                  const local = EVIDENCE_SOURCES.find((s) => s.id === r.sourceId);
                  const problems = local ? verificationProblems(local) : [];
                  const related = local ? relatedContent(local.id) : null;
                  const relatedTotal = related
                    ? Object.values(related).reduce((n, arr) => n + arr.length, 0)
                    : 0;
                  return (
                    <li key={r._id} className="rounded-xl border border-line bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                        <span className="rounded-pill bg-lavender/40 px-2 py-0.5">{r.orgKey}</span>
                        <span className="rounded-pill bg-canvas px-2 py-0.5">{r.evidenceLevel}</span>
                        <span
                          className={`rounded-pill px-2 py-0.5 ${
                            r.reviewStatus === 'approved'
                              ? 'bg-mint-soft text-mint'
                              : r.reviewStatus === 'evidence_required'
                                ? 'bg-pastel-orange text-ink'
                                : 'bg-pastel-yellow text-ink'
                          }`}
                        >
                          {r.reviewStatus}
                        </span>
                        <span>{r.year ?? L('နှစ် မဖော်ပြထား', 'year not printed')}</span>
                        {r.country && <span>{r.country}</span>}
                        <span>{r.language}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-ink">{r.title}</p>
                      <p className="text-xs text-ink-soft">{r.org}{r.edition ? ` · ${r.edition}` : ''}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                        {r.doi && <span>DOI: {r.doi}</span>}
                        {r.isbn && <span>ISBN: {r.isbn}</span>}
                        {r.pmid && <span>PMID: {r.pmid}</span>}
                        <a className="underline" href={r.url} target="_blank" rel="noreferrer noopener">
                          {L('မူရင်းစာမျက်နှာ', 'Source page')}
                        </a>
                        <span>
                          {L('သက်ဆိုင်သည့် အကြောင်းအရာ', 'Related content')}: {relatedTotal}
                        </span>
                        {local && (
                          <span>
                            {L('နောက်တစ်ကြိမ် သုံးသပ်ရန်', 'Next review')}:{' '}
                            {effectiveNextReview(local) ?? '—'}
                          </span>
                        )}
                      </div>
                      {r.verifiedNote && (
                        <p className="mt-1 text-xs italic text-ink-soft">{r.verifiedNote}</p>
                      )}
                      {problems.length > 0 && (
                        <p className="mt-1 rounded bg-pastel-orange/60 px-2 py-1 text-xs text-ink">
                          {L('စစ်ဆေးရန် ကျန်သည်', 'Verification gaps')}: {problems.join('; ')}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(['in_review', 'approved', 'retired'] as const).map((next) => (
                          <button
                            key={next}
                            type="button"
                            disabled={
                              pending === r.sourceId ||
                              r.reviewStatus === next ||
                              (next === 'approved' && (local ? resolveReviewStatus(local) : r.reviewStatus) === 'evidence_required')
                            }
                            onClick={() => review(r.sourceId, next)}
                            className="min-h-touch rounded-pill bg-sky px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            → {next}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          <ReportBlock
            title={L('ကိုးကားချက် မရှိသော အကြောင်းအရာ', 'Content without references')}
            empty={L('မရှိပါ — အကြောင်းအရာ အားလုံး ကိုးကားချက် ရှိသည်။', 'None — every item has at least one reference.')}
            rows={reports.contentWithoutReferences.map((r) => `${r.kind} · ${r.slug} — ${r.reason}`)}
          />
          <ReportBlock
            title={L('သုံးသပ်ရန် စောင့်ဆိုင်းနေသည်', 'Awaiting clinical review')}
            empty={L('မရှိပါ။', 'None.')}
            rows={reports.contentAwaitingReview.map((r) => `${r.scope} · ${r.kind} · ${r.title} (${r.status})`)}
          />
          <ReportBlock
            title={L('သက်တမ်းကုန် ကိုးကားချက်', 'Expired references')}
            empty={L('မရှိပါ။', 'None.')}
            rows={reports.expiredReferences.map(
              (r) => `${r.id} — ${L('ရက်စွဲ', 'due')} ${r.dueOn ?? '—'}${r.daysOverdue !== null ? ` (${r.daysOverdue}d)` : ''} · ${r.dependentContent} ${L('အကြောင်းအရာ', 'items')}`,
            )}
          />
          <ReportBlock
            title={L('ထပ်နေသော ကိုးကားချက်', 'Duplicate references')}
            empty={L('မရှိပါ။', 'None.')}
            rows={reports.duplicateReferences.map((r) => `${r.match} · ${r.ids.join(', ')}`)}
          />
          <ReportBlock
            title={L('ခေတ်မမီတော့သော ကိုးကားချက်', 'Outdated references')}
            empty={L('မရှိပါ။', 'None.')}
            rows={reports.outdatedReferences.map((r) => `${r.id} — ${r.reason}`)}
          />
          <ReportBlock
            title={L('အတည်မပြုနိုင်သေးသော အချက်အလက်', 'Verification gaps')}
            empty={L('မရှိပါ။', 'None.')}
            rows={reports.verificationFailures.map((r) => `${r.id} — ${r.problems.join('; ')}`)}
          />
        </div>
      )}
    </div>
  );
}

function ReportBlock({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
        {title}
        <span
          className={`rounded-pill px-2 py-0.5 text-xs ${
            rows.length === 0 ? 'bg-mint-soft text-mint' : 'bg-pastel-yellow text-ink'
          }`}
        >
          {rows.length}
        </span>
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="space-y-1 text-xs text-ink-soft">
          {rows.slice(0, 60).map((r) => (
            <li key={r} className="break-words">{r}</li>
          ))}
          {rows.length > 60 && <li>… {rows.length - 60} more</li>}
        </ul>
      )}
    </section>
  );
}
