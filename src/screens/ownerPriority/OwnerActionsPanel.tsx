import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocale } from '../../app/LocaleContext';
import { REVIEW_DIMENSION_IDS, type PriorityStatus } from '../../../convex/lib/ownerPriority';
import { mayManageGovernance, mayRequestReviews } from '../../../convex/lib/ownerPriorityAccess';

// Owner correction actions for one item: note, review requests, workflow
// status, parent-facing view link and the before/after edit history. All the
// actual content editing lives in the existing plain-field ContentEditor —
// reviewers never see raw JSON anywhere.

const DIMENSION_LABELS: Record<string, { mm: string; en: string }> = {
  native_myanmar: { mm: 'မြန်မာဘာသာ စစ်ဆေးရန်', en: 'Request Myanmar review' },
  english: { mm: 'English စစ်ဆေးရန်', en: 'Request English review' },
  child_development: { mm: 'ကလေးဖွံ့ဖြိုးမှု စစ်ဆေးရန်', en: 'Request child-development review' },
  evidence: { mm: 'အထောက်အထား စစ်ဆေးရန်', en: 'Request evidence review' },
  safety: { mm: 'ဘေးကင်းရေး စစ်ဆေးရန်', en: 'Request safety review' },
  clinical: { mm: 'အထူးကျွမ်းကျင်သူ ဘေးကင်းရေး စစ်ဆေးရန်', en: 'Request specialist safety review' },
};

export function OwnerActionsPanel({ slug, reviewRevision, role, dataComplete = true, outstandingDimensions = [] }: {
  slug: string;
  reviewRevision: number;
  role: string;
  /** False when review history could not be read in full. */
  dataComplete?: boolean;
  outstandingDimensions?: string[];
}) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const setGovernance = useMutation(api.ownerPriority.setGovernance);
  const requestReviews = useMutation(api.ownerPriority.requestReviews);
  const edits = useQuery(api.contentEdits.activity, { limit: 200 });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const slugEdits = useMemo(
    () => (edits?.allowed ? edits.edits.filter((edit) => edit.contentSlug === slug) : []),
    [edits, slug],
  );

  const run = async (action: () => Promise<{ ok: boolean; message?: string }>, done: string) => {
    setBusy(true);
    setMessage('');
    try {
      const result = await action();
      setMessage(result.ok ? done : (result.message ?? L('မအောင်မြင်ပါ။', 'The action was refused.')));
    } catch (error) {
      console.error(error); setMessage(L('မအောင်မြင်ပါ။', 'The action failed.'));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (priorityStatus: PriorityStatus, done: string) =>
    run(() => setGovernance({ slug, expectedReviewRevision: reviewRevision, priorityStatus }), done);

  const isOwner = mayManageGovernance(role);
  const mayRequest = mayRequestReviews(role);
  // Completion is refused server-side while anything is outstanding or the
  // history is incomplete; the button reflects that instead of inviting a
  // refusal the owner has to read.
  const completionBlocked = !dataComplete || outstandingDimensions.length > 0;

  return (
    <section className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card" data-testid="owner-actions">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-ink">{L('ပိုင်ရှင် လုပ်ဆောင်ချက်များ', 'Owner actions')}</h3>
        <Link to={`/content/${slug}`} className="rounded-pill border border-line px-3 py-1 text-xs font-semibold text-sky-deep">
          {L('မိဘမြင်ရမည့်ပုံစံ ကြည့်ရန်', 'View parent-facing version')}
        </Link>
      </div>

      {mayRequest && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{L('စစ်ဆေးမှု တောင်းဆိုရန်', 'Request reviews')}</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_DIMENSION_IDS.map((dimension) => (
              <button
                key={dimension}
                type="button"
                disabled={busy}
                onClick={() => run(
                  () => requestReviews({ slug, expectedReviewRevision: reviewRevision, dimensions: [dimension] }),
                  L('စစ်ဆေးမှု တောင်းဆိုပြီးပါပြီ။ (တာဝန်ပေးမှု၊ ဖိတ်ခေါ်မှု မလုပ်ပါ။)', 'Review requested. No assignment or invitation was created.'),
                )}
                className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-sky disabled:opacity-50"
              >
                {DIMENSION_LABELS[dimension][locale]}
              </button>
            ))}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{L('အလုပ်အခြေအနေ', 'Workflow status')}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => setStatus('correction_needed', L('ပြင်ဆင်ရန်လို ဟု မှတ်ပြီးပါပြီ။', 'Marked correction needed.'))} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-sky disabled:opacity-50">
              {L('ပြင်ဆင်ရန်လို ဟုမှတ်မည်', 'Mark correction needed')}
            </button>
            <button type="button" disabled={busy} onClick={() => setStatus('ready_for_recheck', L('ပြန်စစ်ရန် အသင့် ဟုမှတ်ပြီးပါပြီ။', 'Marked ready for recheck.'))} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-sky disabled:opacity-50">
              {L('ပြင်ပြီး — ပြန်စစ်ရန် အသင့်', 'Mark correction ready for recheck')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus('triage_complete', L('ဦးစားပေး စိစစ်မှု ပြီးဆုံး ဟုမှတ်ပြီးပါပြီ။', 'Marked priority triage complete.'))}
              className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-sky disabled:opacity-50"
            >
              {L('ဦးစားပေး စိစစ်မှု ပြီးဆုံး', 'Mark priority triage complete')}
            </button>
            <button
              type="button"
              disabled={busy || completionBlocked}
              data-testid="mark-completed"
              onClick={() => setStatus('completed', L('စစ်ဆေးမှု အားလုံး ပြီးဆုံး ဟုမှတ်ပြီးပါပြီ။', 'Marked all reviews completed.'))}
              className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-sky disabled:opacity-50"
            >
              {L('စစ်ဆေးမှု အားလုံး ပြီးဆုံး', 'Mark all reviews completed')}
            </button>
          </div>
        </div>
      )}

      {isOwner && (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(
              () => setGovernance({ slug, expectedReviewRevision: reviewRevision, ownerNote: note }),
              L('မှတ်ချက် သိမ်းပြီးပါပြီ။', 'Owner note saved.'),
            );
          }}
        >
          <label className="block space-y-1 text-sm font-medium text-ink">
            <span>{L('ပိုင်ရှင် မှတ်ချက်', 'Owner note')}</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} disabled={busy} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" />
          </label>
          <button type="submit" disabled={busy || !note.trim()} className="rounded-pill bg-sky px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            {L('မှတ်ချက် သိမ်းမည်', 'Save note')}
          </button>
        </form>
      )}

      {completionBlocked && isOwner && (
        <p className="rounded-xl bg-pastel-yellow px-3 py-2 text-xs leading-5 text-ink">
          {!dataComplete
            ? L('သုံးသပ်မှတ်တမ်း အပြည့်အစုံ မဖတ်နိုင်သဖြင့် “ပြီးဆုံး” ကို ပိတ်ထားသည်။', 'Completion is disabled: the full review history could not be loaded.')
            : L(`“ပြီးဆုံး” မမှတ်နိုင်သေးပါ — စစ်ဆေးရန် ကျန်: ${outstandingDimensions.join(', ')}`, `Cannot complete yet — outstanding: ${outstandingDimensions.join(', ')}`)}
        </p>
      )}
      {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}

      {slugEdits.length > 0 && (
        <details className="rounded-xl border border-line p-3">
          <summary className="cursor-pointer text-sm font-semibold text-sky-deep">
            {L(`ပြင်ဆင်မှတ်တမ်း — အရင်/အပြီး နှိုင်းယှဉ်ချက် ${slugEdits.length} ခု`, `Edit history — ${slugEdits.length} before/after comparisons`)}
          </summary>
          <ul className="mt-3 space-y-2">
            {slugEdits.map((edit) => (
              <li key={edit._id} className="rounded-lg bg-canvas p-3 text-xs text-ink-soft">
                <p className="font-semibold text-ink">
                  {edit.editorDisplayName} · {L('မူကွဲ', 'rev')} {edit.fromVersion} → {edit.toVersion} · {new Date(edit.editedAt).toLocaleString(locale === 'mm' ? 'my-MM' : 'en-GB', { timeZone: 'Asia/Yangon' })}
                </p>
                <ul className="mt-1 space-y-1">
                  {edit.changes.map((change, index) => (
                    <li key={index} className="break-words">
                      <b>{change.path}</b>
                      <span className="mx-1 rounded bg-red-50 px-1 text-red-700 line-through">{change.before || '∅'}</span>
                      →
                      <span className="mx-1 rounded bg-mint-soft px-1 text-ink">{change.after || '∅'}</span>
                      {change.truncated && <i> {L('(အတိုချုံး)', '(truncated)')}</i>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function SecuritySummaryPanel() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const summary = useQuery(api.ownerPriority.securitySummary);
  if (summary === undefined) return <p className="text-ink-soft">…</p>;
  if (!summary.allowed) {
    return <p className="rounded-card border border-line bg-white p-5 text-ink">{L('ဤအပိုင်းကို ပိုင်ရှင်သာ ကြည့်နိုင်သည်။', 'Only the owner can view the security summary.')}</p>;
  }
  return (
    <section className="space-y-4" data-testid="security-summary">
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-sky-deep">{L('လုံခြုံရေး အနှစ်ချုပ်', 'Security summary')}</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-soft">
          {L(
            'ငြင်းပယ်ခံရသော ဝန်ထမ်းဖိတ်ခေါ်မှု တောင်းဆိုမှုများ။ ဖိတ်ခေါ်ကုဒ်များကို hash ဖြင့်သာ သိမ်းထားသဖြင့် ဤနေရာတွင် ကုဒ် ဘယ်တော့မှ မပေါ်ပါ။',
            'Rejected staff-invite claims. Raw invitation codes are never stored, so none can appear here.',
          )}
        </p>
      </header>
      {summary.suspicious && (
        <p className="rounded-card border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {L('သံသယဖြစ်ဖွယ် — မမှန်ကန်သော ကြိုးပမ်းမှု များနေပါသည်။ ဖိတ်ခေါ်မှုများကို ပြန်စစ်ပါ။', 'Suspicious — many invalid attempts. Re-check outstanding invitations.')}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          [L('စုစုပေါင်း ငြင်းပယ်', 'Total rejected'), summary.totalRejected],
          [L('သက်တမ်းကုန်', 'Expired'), summary.byCategory.expired],
          [L('အကောင့်မှား', 'Wrong account'), summary.byCategory.wrongAccount],
          [L('မမှန်/သုံးပြီး', 'Invalid or already used'), summary.byCategory.invalidOrReused],
          [L('သီးခြားအကောင့်', 'Distinct accounts'), summary.distinctActors],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-card border border-line bg-white p-3 shadow-card">
            <span className="block text-xl font-bold text-sky-deep">{value}</span>
            <span className="block break-words text-xs leading-5 text-ink-soft">{label}</span>
          </div>
        ))}
      </div>
      <ul className="space-y-1">
        {summary.recent.map((row, index) => (
          <li key={index} className="rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
            {new Date(row.at).toLocaleString(locale === 'mm' ? 'my-MM' : 'en-GB', { timeZone: 'Asia/Yangon' })} · {row.category} · {row.hasActor ? L('အကောင့်ဖြင့် ဝင်ထား', 'signed-in account') : L('အကောင့် မသိ', 'unknown account')}
          </li>
        ))}
      </ul>
    </section>
  );
}
