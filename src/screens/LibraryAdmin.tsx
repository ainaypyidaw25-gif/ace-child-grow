import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { seedPayload } from '../content/seed';
import { CONTENT_TYPES } from '../content/taxonomy';

// Staff CMS for the content library: import/seed, coverage overview, and
// per-item clinical-review transitions. Server enforces staff-only for every
// mutation; a non-staff visitor sees the access notice.
export function LibraryAdmin() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const stats = useQuery(api.library.stats, {});
  const [type, setType] = useState('lesson');
  const list = useQuery(api.library.listByType, { type });
  const importSeed = useMutation(api.library.importSeed);
  const setReview = useMutation(api.library.setReview);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  if (stats === undefined) return <p className="text-ink-soft">…</p>;
  if (!stats.allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <div aria-hidden className="text-4xl">🔒</div>
        <p className="font-semibold text-ink">{L('ဝင်ခွင့် မရှိပါ။', 'You do not have access.')}</p>
        <p className="text-sm text-ink-soft">{L('CMS ကို staff သာ သုံးနိုင်သည်။', 'The CMS is staff-only.')}</p>
      </div>
    );
  }

  const runImport = async () => {
    setBusy(true); setMsg('');
    try {
      const res = await importSeed({ items: seedPayload() });
      setMsg(L(`တင်သွင်းပြီး — အသစ် ${res.created}၊ ပြင် ${res.updated}`, `Imported — ${res.created} new, ${res.updated} updated`));
    } catch (e) {
      setMsg(L('တင်သွင်းမှု မအောင်မြင်ပါ။', 'Import failed.') + ' ' + (e as Error).message);
    } finally { setBusy(false); }
  };

  const transition = async (slug: string, clinicalStatus: string) => {
    if (pending) return; // guard against double-clicks
    setPending(slug);
    try {
      await setReview({ slug, clinicalStatus });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{L('အကြောင်းအရာ CMS', 'Content CMS')}</h1>

      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {L(
          'လက်ရှိတွင် အရည်အချင်းပြည့်မီသော ကျန်းမာရေးပညာရှင်၏ သုံးသပ်ချက် မရှိသေးပါ။ အကြောင်းအရာများကို ကြည့်ရှုနိုင်သော်လည်း ထုတ်ဝေခြင်းကို ပိတ်ထားပါသည်။',
          'No qualified clinical reviewer is assigned. You may inspect drafts, but publishing is disabled.',
        )}
      </p>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">{L('အနှစ်ချုပ်', 'Overview')}</h2>
        <p className="text-sm text-ink-soft">{L('စုစုပေါင်း', 'Total items')}: <b>{stats.total}</b></p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(stats.byType).map(([k, n]) => (
            <span key={k} className="rounded-pill bg-lavender/40 px-3 py-0.5">{k}: {n as number}</span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(stats.byStatus).map(([k, n]) => (
            <span key={k} className="rounded-pill bg-canvas px-3 py-0.5">{k}: {n as number}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {L('အသက်အုပ်စု', 'Ages covered')}: {stats.ages.length} · {L('နယ်ပယ်', 'Domains')}: {stats.domains.length}
        </p>
        <button type="button" onClick={runImport} disabled={busy}
          className="mt-3 rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? L('တင်သွင်းနေသည်…', 'Importing…') : L('Seed အကြောင်းအရာ တင်သွင်းရန်', 'Import seed content')}
        </button>
        {msg && <p className="mt-2 text-sm text-ink-soft">{msg}</p>}
        <p className="mt-2 text-[11px] text-ink-soft">
          {L('တင်သွင်းမှုသည် idempotent ဖြစ်၍ ပြန်လည်သုံးသပ်ပြီးသား အခြေအနေကို မဖျက်ပါ။',
             'Import is idempotent and never overrides an existing review decision.')}
        </p>
      </section>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">{L('ပြန်လည်သုံးသပ်ခြင်း', 'Clinical review')}</h2>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="mb-3 rounded-pill border border-line bg-white px-3 py-1.5 text-sm">
          {CONTENT_TYPES.map((tk) => <option key={tk} value={tk}>{tk}</option>)}
        </select>
        {list === undefined ? <p className="text-ink-soft">…</p> : (
          <ul className="space-y-2">
            {list.items.map((it) => (
              <li key={it._id} className="rounded-lg border border-line px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{locale === 'mm' ? it.titleMm : it.titleEn}</span>
                  <span className="text-[11px] text-ink-soft">{it.clinicalStatus}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {['draft', 'clinical_review', 'published'].map((s) => (
                    <button key={s} type="button" onClick={() => transition(it.slug, s)}
                      disabled={s === 'published' || it.clinicalStatus === s || pending === it.slug}
                      className={`min-h-touch rounded-pill px-2.5 py-1 text-xs disabled:opacity-50 ${
                        it.clinicalStatus === s ? 'bg-lavender/40 text-ink-soft' : 'border border-line text-ink'
                      }`}>
                      {s === 'published' ? L('ထုတ်ဝေခွင့် ပိတ်ထားသည်', 'Publishing locked') : s === 'clinical_review' ? L('သုံးသပ်ရန်', 'Review') : L('မူကြမ်း', 'Draft')}
                    </button>
                  ))}
                </div>
              </li>
            ))}
            {list.items.length === 0 && <p className="text-sm text-ink-soft">{L('မရှိသေးပါ — အထက်တွင် Seed တင်သွင်းပါ။', 'Empty — import the seed above.')}</p>}
          </ul>
        )}
      </section>
    </div>
  );
}
