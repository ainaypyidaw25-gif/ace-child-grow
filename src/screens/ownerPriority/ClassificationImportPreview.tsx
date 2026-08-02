import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocale } from '../../app/LocaleContext';
import {
  buildImportPlan,
  type ClassificationFileInput,
  type ImportPlan,
  type ServerRowSnapshot,
} from '../../../convex/lib/classificationImport';

// Classification Import PREVIEW. The plan is computed locally from the
// owner-supplied JSON artefact plus a read-only snapshot of this deployment's
// rows. There is NO apply mutation in this build: the button below is a
// disabled design for a future, separately confirmed task.

const RUN_ID = 'migration-dryrun-2026-07-30-libclass-v2';

export function ImportPlanView({ plan, locale }: { plan: ImportPlan; locale: 'mm' | 'en' }) {
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const stat = (label: string, value: number | string, alarm = false) => (
    <div className={`rounded-card border p-3 shadow-card ${alarm ? 'border-red-300 bg-red-50' : 'border-line bg-white'}`}>
      <span className={`block text-xl font-bold ${alarm ? 'text-red-700' : 'text-sky-deep'}`}>{value}</span>
      <span className="block break-words text-xs leading-5 text-ink-soft">{label}</span>
    </div>
  );
  return (
    <div className="space-y-4" data-testid="import-plan">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {stat(L('မျှော်မှန်း record', 'Expected records'), plan.expectedRecords)}
        {stat(L('ကိုက်ညီသည်', 'Matched'), plan.matched, plan.matched !== plan.expectedRecords)}
        {stat(L('ပျောက်နေသော slug', 'Missing slugs'), plan.missingSlugs.length, plan.missingSlugs.length > 0)}
        {stat(L('ထပ်နေသော slug', 'Duplicate slugs'), plan.duplicateSlugs.length, plan.duplicateSlugs.length > 0)}
        {stat(L('မူကွဲ ကွဲလွဲမှု', 'Revision conflicts'), plan.revisionConflicts.length, plan.revisionConflicts.length > 0)}
        {stat(L('ပြောင်းလဲမည့် row', 'Rows that would change'), plan.changes.length)}
        {stat(L('မပြောင်းမည့် row', 'Rows with no change'), plan.unchanged.length)}
        {stat(L('JSON မပါသော deployment row', 'Deployment rows not in file'), plan.unknownSlugs.length, plan.unknownSlugs.length > 0)}
        {stat(L('ယခု မိဘမြင်နိုင်', 'Parent-visible now'), plan.parentVisibleNow)}
        {stat(L('Import ပြီးနောက် မိဘမြင်နိုင်', 'Parent-visible after import'), plan.parentVisibleAfterImport)}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-white p-3 shadow-card">
          <h4 className="text-sm font-bold text-ink">{L('အဆင့်အလိုက်', 'By class')}</h4>
          <p className="mt-1 text-sm text-ink-soft">
            {(['A', 'B', 'C', 'D', 'E'] as const).map((riskClass) => `${riskClass}: ${plan.classCounts[riskClass]}`).join(' · ')}
          </p>
        </div>
        <div className="rounded-card border border-line bg-white p-3 shadow-card">
          <h4 className="text-sm font-bold text-ink">{L('ဦးစားပေးအလိုက်', 'By priority')}</h4>
          <p className="mt-1 text-sm text-ink-soft">
            {(['P0', 'P1', 'P2', 'P3'] as const).map((priority) => `${priority}: ${plan.priorityCounts[priority]}`).join(' · ')}
          </p>
        </div>
      </div>

      <p className="rounded-xl bg-mint-soft px-3 py-2 text-sm leading-6 text-ink">
        {L(
          'Import က governance အညွှန်းများသာ ရေးမည် — ထုတ်ဝေမှုအခြေအနေ၊ reviewScope၊ စစ်ဆေးသူအမည်၊ အတည်ပြုချက်၊ တာဝန်ပေးမှု ဘာမှ မပြောင်းနိုင်ပါ။ မိဘမြင်နိုင်မှု လုံးဝ မပြောင်းပါ။',
          'The import would write governance labels only — it cannot change publication state, reviewScope, reviewer identities, approvals or assignments. Parent visibility cannot change.',
        )}
      </p>

      {plan.revisionConflicts.length > 0 && (
        <details className="rounded-card border border-red-200 bg-red-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-red-700">{L('မူကွဲ ကွဲလွဲမှုများ (ငြင်းပယ်မည်)', 'Revision conflicts (would be refused)')}</summary>
          <ul className="mt-2 space-y-1 text-xs text-ink">
            {plan.revisionConflicts.map((conflict) => (
              <li key={conflict.slug} className="break-words">{conflict.slug}: {L('ဖိုင်က', 'file says')} {conflict.fileRevision} · {L('deployment က', 'deployment says')} {conflict.serverRevision}</li>
            ))}
          </ul>
        </details>
      )}
      {plan.changes.length > 0 && (
        <details className="rounded-card border border-line bg-white p-3 shadow-card">
          <summary className="cursor-pointer text-sm font-semibold text-sky-deep">{L(`အဆိုပြု ပြောင်းလဲမှု ${plan.changes.length} ခု`, `${plan.changes.length} proposed field changes`)}</summary>
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto text-xs text-ink-soft">
            {plan.changes.slice(0, 400).map((change) => (
              <li key={change.slug} className="break-words rounded bg-canvas px-2 py-1">
                <b className="text-ink">{change.slug}</b> → {change.fields.riskClassification}/{change.fields.ownerPriority} · {L('မူကွဲ', 'rev')} {change.expectedReviewRevision} · {change.fields.requiredReviewDimensions.join('+')}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="rounded-card border border-line bg-white p-4 shadow-card">
        <h4 className="text-sm font-bold text-ink">{L('အတည်ပြုချက် ဒီဇိုင်း (နောင်လုပ်ငန်းအတွက်)', 'Owner confirmation design (future task)')}</h4>
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          {L(
            'နောင် import လုပ်မည့်အခါ — ပိုင်ရှင်သည် run ID နှင့် ပြောင်းလဲမည့် row အရေအတွက်ကို စာဖြင့် ရိုက်ထည့်အတည်ပြုရမည်။ Apply သည် row တစ်ခုချင်း မူကွဲ ပြန်စစ်ပြီး ကွဲလွဲလျှင် ငြင်းမည်။ ဒုတိယအကြိမ် တူညီစွာ run လျှင် ပြောင်းလဲမှု သုည ဖြစ်ရမည်။',
            'When importing later: the owner must type the run ID and the exact number of rows to change. Apply re-verifies each row’s revision and refuses stale rows. A second identical run must produce zero changes.',
          )}
        </p>
        <button type="button" disabled data-testid="import-disabled" className="mt-3 cursor-not-allowed rounded-pill bg-line px-5 py-2 text-sm font-semibold text-ink-soft">
          {L('Import — ဤဗားရှင်းတွင် ပိတ်ထားသည်', 'Import — disabled in this build')}
        </button>
      </div>
    </div>
  );
}

export function ClassificationImportPreview() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const preview = useQuery(api.ownerPriority.importPreviewRows);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [error, setError] = useState('');

  const onFile = async (file: File | undefined) => {
    setError('');
    setPlan(null);
    if (!file || !preview?.allowed) return;
    try {
      const parsed = JSON.parse(await file.text()) as ClassificationFileInput;
      if (!Array.isArray(parsed.records)) throw new Error(L('records array မတွေ့ပါ။', 'The file has no records array.'));
      setPlan(buildImportPlan(parsed, preview.rows as ServerRowSnapshot[], { runId: RUN_ID }));
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : L('ဖိုင်ကို ဖတ်၍ မရပါ။', 'Unable to read this file.'));
    }
  };

  if (preview === undefined) return <p className="text-ink-soft">…</p>;
  if (!preview.allowed) {
    return <p className="rounded-card border border-line bg-white p-5 text-ink">{L('ဤအပိုင်းကို ပိုင်ရှင်သာ ကြည့်နိုင်သည်။', 'Only the owner can open the import preview.')}</p>;
  }
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-sky-deep">{L('Classification Import Preview', 'Classification Import Preview')}</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-soft">
          {L(
            'Classification JSON (audit artefact) ကို ရွေးပါ။ ဤစခရင်သည် preview သာဖြစ်ပြီး ဘာမှ မရေးပါ။',
            'Choose the classification JSON artefact. This screen is a preview only and writes nothing.',
          )}
        </p>
      </header>
      <label className="block rounded-card border border-dashed border-line bg-white p-5 text-sm text-ink shadow-card">
        <span className="font-semibold">{L('Classification JSON ဖိုင် ရွေးပါ', 'Choose classification JSON file')}</span>
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => void onFile(event.target.files?.[0])}
          className="mt-2 block w-full text-xs text-ink-soft"
        />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {plan && <ImportPlanView plan={plan} locale={locale} />}
    </div>
  );
}
