import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useLocale } from '../../app/LocaleContext';
import {
  type ClinicalBatchDecision,
  type ClinicalBatchLoadState,
  type FrozenClinicalBatch,
  type FrozenClinicalDecision,
  type RecordClinicalBatchDecision,
  type ClinicalHandoffReceipt,
} from '../../domain/content/clinicalFrozenBatch';
import { approvalNeedsQualification } from '../../../convex/lib/reviewPolicy';

export interface ClinicalReviewerIdentity {
  displayName: string | null;
  qualification: string | null;
}

interface ClinicalFrozenBatchPanelProps {
  state: ClinicalBatchLoadState;
  reviewer: ClinicalReviewerIdentity;
  recordDecision: RecordClinicalBatchDecision;
}

const DECISIONS: ClinicalBatchDecision[] = ['approved', 'changes_requested', 'not_applicable'];

const DECISION_LABELS: Record<ClinicalBatchDecision, { mm: string; en: string }> = {
  approved: { mm: 'ဤမူကွဲကို အတည်ပြုသည်', en: 'Approve this exact revision' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် တောင်းဆိုသည်', en: 'Request changes' },
  not_applicable: { mm: 'မသက်ဆိုင်ပါ', en: 'Not applicable' },
};

const DIMENSION_LABELS = {
  english: { mm: 'အင်္ဂလိပ်စာ', en: 'English' },
  native_myanmar: { mm: 'သဘာဝကျသော မြန်မာစာ', en: 'Native Myanmar' },
  clinical: { mm: 'အထူးကျွမ်းကျင်သူ ဘေးကင်းရေး', en: 'Specialist safety' },
  child_development: { mm: 'ကလေးဖွံ့ဖြိုးမှု', en: 'Child development' },
  evidence: { mm: 'ကိုးကားအထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
} as const;

function shortDigest(value: string): string {
  return value.length > 20 ? `${value.slice(0, 12)}…${value.slice(-6)}` : value;
}

function BlockedCard({ title, body, testId }: { title: string; body: string; testId: string }) {
  return (
    <section data-testid={testId} className="rounded-card border border-amber-300 bg-pastel-yellow/60 p-4 shadow-card sm:p-5">
      <h2 className="font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-ink-soft">{body}</p>
    </section>
  );
}

function ClinicalBatchSession({
  batch,
  reviewer,
  recordDecision,
}: {
  batch: FrozenClinicalBatch;
  reviewer: ClinicalReviewerIdentity;
  recordDecision: RecordClinicalBatchDecision;
}) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const initialDecisions = useMemo(
    () => new Map(batch.items.flatMap((item) => item.decision ? [[item.assignmentId, item.decision] as const] : [])),
    [batch],
  );
  const initialPending = batch.items.find((item) => !initialDecisions.has(item.assignmentId));
  const [activeAssignmentId, setActiveAssignmentId] = useState(initialPending?.assignmentId ?? batch.items[0].assignmentId);
  const [recorded, setRecorded] = useState(initialDecisions);
  const [decision, setDecision] = useState<ClinicalBatchDecision | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const [message, setMessage] = useState('');
  const [refreezeReason, setRefreezeReason] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<ClinicalHandoffReceipt | null>(batch.handoff);

  const activeItem = batch.items.find((item) => item.assignmentId === activeAssignmentId) ?? batch.items[0];
  const completedCount = recorded.size;
  const complete = completedCount === batch.items.length;
  const batchClearanceComplete = complete
    && batch.items.every((item) => recorded.get(item.assignmentId)?.decision === 'approved');
  const activeReceipt = recorded.get(activeItem.assignmentId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || busy || refreezeReason || complete || !decision) return;
    if (decision === 'changes_requested' && !note.trim()) {
      setMessage(L('ပြင်ဆင်ရမည့်အချက်ကို မှတ်ချက်တွင် ရေးပါ။', 'Write a note explaining what must change.'));
      return;
    }
    if (decision === 'approved' && approvalNeedsQualification(activeItem.dimension)
      && !reviewer.qualification?.trim()) {
      setMessage(L('အတည်ပြုရန် သင့်အကောင့်တွင် သက်ဆိုင်ရာ အရည်အချင်း မှတ်တမ်းရှိရပါမည်။', 'A recorded professional qualification is required to approve.'));
      return;
    }

    submittingRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await recordDecision({
        batchId: batch.batchId,
        assignmentId: activeItem.assignmentId,
        contentSlug: activeItem.slug,
        dimension: activeItem.dimension,
        decision,
        note: note.trim() || undefined,
        expectedReviewRevision: activeItem.reviewRevision,
        expectedSnapshotDigest: activeItem.snapshot.digest,
        expectedFreezeDigest: batch.freezeDigest,
      });
      if (!result.ok) {
        setMessage(result.message);
        if (result.code === 'stale_revision' || result.code === 'assignment_expired' || result.code === 'assignment_not_found') {
          setRefreezeReason(result.message);
        }
        return;
      }
      if (result.receipt.decision !== decision) {
        setRefreezeReason(L('ပြန်လာသော receipt သည် ရွေးထားသောဆုံးဖြတ်ချက်နှင့် မကိုက်ညီပါ။ Batch အသစ်ပြန် freeze လုပ်ပါ။', 'The returned receipt does not match the selected decision. Refreeze the batch.'));
        return;
      }

      const nextRecorded = new Map(recorded);
      nextRecorded.set(activeItem.assignmentId, result.receipt);
      setRecorded(nextRecorded);
      setDecision(null);
      setNote('');
      if (result.handoff) {
        const allExactRowsApproved = batch.items.every(
          (item) => nextRecorded.get(item.assignmentId)?.decision === 'approved',
        );
        if (
          !allExactRowsApproved ||
          result.handoff.batchId !== batch.batchId ||
          result.handoff.decisionCount !== batch.items.length ||
          !result.handoff.digest.trim() || !result.handoff.receiptDigest.trim()
        ) {
          setRefreezeReason(L('Server-issued handoff receipt သည် ဤ batch အပြည့်အစုံနှင့် မကိုက်ညီပါ။', 'The server-issued handoff receipt does not cover this complete batch.'));
          return;
        }
        setHandoff(result.handoff);
      }

      const next = batch.items.find((item) => !nextRecorded.has(item.assignmentId));
      if (next) {
        setActiveAssignmentId(next.assignmentId);
        setMessage(L('ဆုံးဖြတ်ချက် မှတ်တမ်းတင်ပြီး နောက်အကြောင်းအရာသို့ ရွှေ့ပြီးပါပြီ။', 'Decision recorded. Moved to the next assigned item.'));
      } else {
        setMessage(result.handoff
          ? L('Batch ပြီးဆုံးပြီး server-issued handoff receipt ရရှိပါပြီ။', 'Batch complete. Server-issued handoff receipt received.')
          : L('ဆုံးဖြတ်ချက်အားလုံး မှတ်တမ်းတင်ပြီးပါပြီ။ Server-issued handoff receipt ကို စောင့်နေသည်။', 'All decisions are recorded. Waiting for the server-issued handoff receipt.'));
      }
    } catch (error) {
      console.error(error);
      setMessage(L('ဆုံးဖြတ်ချက်ကို မှတ်တမ်းမတင်နိုင်ပါ။', 'Unable to record the decision.'));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  const decisionFor = (assignmentId: string): FrozenClinicalDecision | undefined => recorded.get(assignmentId);

  return (
    <div className="space-y-4" data-testid="clinical-frozen-batch">
      <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint-deep">{DIMENSION_LABELS[batch.lane][locale]}</p>
            <h2 className="mt-1 text-lg font-bold text-sky-deep">{L('Exact frozen batch', 'Exact frozen batch')}</h2>
            <p className="mt-1 text-sm text-ink-soft">{batch.batchId}</p>
          </div>
          <span className="rounded-pill bg-mint-soft px-3 py-1 text-xs font-semibold text-mint-deep">
            {completedCount} / {batch.items.length}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-xs text-ink-soft">{L('လက်ရှိအကောင့်', 'Authenticated reviewer')}</dt>
            <dd className="mt-1 font-semibold text-ink">{reviewer.displayName || L('အမည်မသတ်မှတ်ရသေး', 'Display name missing')}</dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-xs text-ink-soft">{L('အခန်းကဏ္ဍ', 'Role')}</dt>
            <dd className="mt-1 font-semibold text-ink">{batch.assignedRole}</dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-xs text-ink-soft">{L('Freeze digest', 'Freeze digest')}</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">{shortDigest(batch.freezeDigest)}</dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-xs text-ink-soft">{L('Freeze receipt digest', 'Freeze receipt digest')}</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">{shortDigest(batch.freezeReceiptDigest)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-6 text-ink-soft">
          {L(
            'အကောင့်ပြောင်းခြင်းကို ဤနေရာတွင် အယောင်ဆောင်မလုပ်ပါ။ အခြား reviewer သို့ ပြောင်းရန် ပုံမှန် sign out / sign in ကို သုံးပါ။',
            'This screen never impersonates another reviewer. Use normal sign out / sign in to change accounts.',
          )}
        </p>
      </section>

      {refreezeReason && (
        <BlockedCard
          testId="clinical-batch-refreeze-required"
          title={L('Batch ရပ်ထားသည် — refreeze လိုအပ်သည်', 'Batch stopped — refreeze required')}
          body={refreezeReason}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.6fr)]">
        <aside className="rounded-card border border-line bg-white p-3 shadow-card" aria-label={L('Assigned exact rows', 'Assigned exact rows')}>
          <p className="px-1 text-sm font-bold text-ink">{L('သတ်မှတ်ပေးထားသော စာရင်း', 'Assigned exact rows')}</p>
          <ul className="mt-3 space-y-2">
            {batch.items.map((item, index) => {
              const itemDecision = decisionFor(item.assignmentId);
              return (
                <li key={item.assignmentId}>
                  <button
                    type="button"
                    onClick={() => { setActiveAssignmentId(item.assignmentId); setDecision(null); setNote(''); setMessage(''); }}
                    aria-current={item.assignmentId === activeItem.assignmentId ? 'true' : undefined}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      item.assignmentId === activeItem.assignmentId ? 'border-sky bg-mint-soft' : 'border-line bg-white hover:border-sky'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2 text-xs text-ink-soft">
                      <span>{index + 1}. {DIMENSION_LABELS[item.dimension][locale]}</span>
                      <span>r{item.reviewRevision}</span>
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-6 text-ink">{locale === 'mm' ? item.snapshot.titleMm : item.snapshot.titleEn}</span>
                    <span className="mt-1 block text-xs text-ink-soft">{itemDecision ? DECISION_LABELS[itemDecision.decision][locale] : L('မဆုံးဖြတ်ရသေး', 'Pending')}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-mint-deep">{activeItem.type} · {activeItem.slug}</p>
              <h3 className="mt-1 text-lg font-bold leading-8 text-ink">{activeItem.snapshot.titleMm}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{activeItem.snapshot.titleEn}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-pill bg-canvas px-3 py-1 text-ink">{DIMENSION_LABELS[activeItem.dimension][locale]}</span>
              <span className="rounded-pill bg-pastel-yellow px-3 py-1 text-ink">r{activeItem.reviewRevision}</span>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-canvas p-4" data-testid="clinical-frozen-snapshot">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{L('Frozen snapshot', 'Frozen snapshot')}</p>
              <code className="text-xs text-ink-soft">{shortDigest(activeItem.snapshot.digest)}</code>
            </div>
            {activeItem.snapshot.summaryMm && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">{activeItem.snapshot.summaryMm}</p>}
            {activeItem.snapshot.summaryEn && <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{activeItem.snapshot.summaryEn}</p>}
            {activeItem.snapshot.reviewerAdvisory && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-pastel-yellow/70 p-3" data-testid="clinical-reviewer-advisory">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                  {L('ဤမူကွဲအတွက် အထူးစစ်ဆေးရန်', 'Advisory for this exact revision')}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink">{activeItem.snapshot.reviewerAdvisory.mm}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{activeItem.snapshot.reviewerAdvisory.en}</p>
              </div>
            )}
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{L('ကိုးကားရင်းမြစ်များ', 'Evidence sources')}</p>
              {activeItem.snapshot.sources.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                  {activeItem.snapshot.sources.map((source) => (
                    <li key={source.sourceId}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-sky-deep underline decoration-line underline-offset-4 hover:decoration-sky"
                      >
                        {source.org} — {source.title}{source.year === null ? '' : ` (${source.year})`}
                      </a>
                      <span className="ml-2 font-mono text-[11px] text-ink-soft">{source.sourceId}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm font-medium text-amber-700">{L('ဤ frozen snapshot တွင် ဖွင့်ကြည့်နိုင်သော ရင်းမြစ်မရှိပါ။', 'No openable evidence source is present in this frozen snapshot.')}</p>
              )}
            </div>
          </div>

          <div className="space-y-3" aria-label={L('Frozen content fields', 'Frozen content fields')}>
            {activeItem.snapshot.fields.map((field) => (
              <div key={field.path} className="rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{locale === 'mm' ? field.labelMm : field.labelEn}</p>
                  <code className="text-[11px] text-ink-soft">{field.path}</code>
                </div>
                {field.valueMm && <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink">{field.valueMm}</p>}
                {field.valueEn && <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{field.valueEn}</p>}
              </div>
            ))}
          </div>

          {activeReceipt ? (
            <div className="rounded-xl bg-mint-soft p-4 text-sm text-ink">
              <p className="font-bold">{DECISION_LABELS[activeReceipt.decision][locale]}</p>
              {activeReceipt.note && <p className="mt-2 leading-6">{activeReceipt.note}</p>}
              <p className="mt-2 text-xs text-ink-soft">Receipt: {activeReceipt.receiptId}</p>
            </div>
          ) : (
            <form data-testid="clinical-item-decision-form" onSubmit={submit} className="space-y-4 rounded-xl bg-mint-soft p-4">
              <fieldset disabled={busy || !!refreezeReason || complete}>
                <legend className="text-sm font-bold text-ink">{L('ဤစာရင်းတစ်ခုအတွက် ဆုံးဖြတ်ချက်ရွေးပါ', 'Choose a decision for this item')}</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {DECISIONS.map((value) => (
                    <label key={value} className={`flex cursor-pointer items-start gap-2 rounded-xl border bg-white p-3 text-sm ${decision === value ? 'border-sky' : 'border-line'}`}>
                      <input
                        type="radio"
                        name={`decision-${activeItem.assignmentId}`}
                        value={value}
                        checked={decision === value}
                        onChange={() => { setDecision(value); setMessage(''); }}
                        disabled={value === 'approved' && approvalNeedsQualification(activeItem.dimension)
                          && !reviewer.qualification?.trim()}
                        className="mt-1"
                      />
                      <span className="font-semibold leading-6 text-ink">{DECISION_LABELS[value][locale]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block space-y-1.5 text-sm font-medium text-ink">
                <span>{L('သုံးသပ်မှတ်ချက်', 'Review note')} {decision === 'changes_requested' ? '*' : ''}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  required={decision === 'changes_requested'}
                  disabled={busy || !!refreezeReason}
                  placeholder={decision === 'changes_requested' ? L('ပြင်ဆင်ရမည့်အချက်ကို တိတိကျကျ ရေးပါ။', 'Describe the exact required change.') : undefined}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 disabled:opacity-60"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !!refreezeReason || !decision}
                className="min-h-touch rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? L('မှတ်တမ်းတင်နေသည်…', 'Recording…') : L('ဤတစ်ခု၏ ဆုံးဖြတ်ချက်ကို မှတ်တမ်းတင်မည်', 'Record this item decision')}
              </button>
            </form>
          )}
          {message && <p role="status" className="text-sm leading-6 text-ink-soft">{message}</p>}
        </section>
      </div>

      {complete && (
        handoff && batchClearanceComplete ? (
          <section data-testid="clinical-handoff-receipt" className="rounded-card border border-mint bg-mint-soft p-4 shadow-card sm:p-5">
            <h2 className="font-bold text-mint-deep">{L('သုံးသပ်ရေး handoff receipt', 'Review handoff receipt')}</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-ink-soft">Batch</dt><dd className="mt-1 font-medium text-ink">{handoff.batchId}</dd></div>
              <div><dt className="text-xs text-ink-soft">{L('ဆုံးဖြတ်ချက်အရေအတွက်', 'Decision count')}</dt><dd className="mt-1 font-medium text-ink">{handoff.decisionCount}</dd></div>
              <div><dt className="text-xs text-ink-soft">Digest</dt><dd className="mt-1 break-all font-mono text-xs text-ink">{handoff.digest}</dd></div>
              <div><dt className="text-xs text-ink-soft">Receipt digest</dt><dd className="mt-1 break-all font-mono text-xs text-ink">{handoff.receiptDigest}</dd></div>
            </dl>
          </section>
        ) : batchClearanceComplete ? (
          <BlockedCard
            testId="clinical-handoff-pending"
            title={L('ဆုံးဖြတ်ချက်များ ပြီးပါပြီ', 'Decisions complete')}
            body={L('Account မပြောင်းမီ server-issued handoff receipt ရရှိရန် စောင့်ပါ။', 'Wait for the server-issued handoff receipt before changing accounts.')}
          />
        ) : (
          <BlockedCard
            testId="clinical-followup-required"
            title={L('သုံးသပ်ရေး lane မပြီးသေးပါ', 'Review follow-up is still required')}
            body={L(
              'ပြင်ဆင်ရန်တောင်းဆိုထားသော သို့မဟုတ် မသက်ဆိုင်ဟု ဆုံးဖြတ်ထားသော row ရှိပါသည်။ ပြင်ဆင်ပြီး exact revision အသစ်ကို refreeze/re-review မလုပ်မချင်း အခြား reviewer lane သို့ မပြောင်းပါနှင့်။',
              'At least one row requested changes or was marked not applicable. Do not switch reviewer lanes until it is corrected and a new exact revision is refrozen and reviewed.',
            )}
          />
        )
      )}
    </div>
  );
}

export function ClinicalFrozenBatchPanel({ state, reviewer, recordDecision }: ClinicalFrozenBatchPanelProps) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  if (state.kind === 'loading') return <p className="text-ink-soft" role="status">…</p>;
  if (state.kind === 'unauthorized') {
    return <BlockedCard testId="clinical-batch-unauthorized" title={L('သတ်မှတ်ထားသော reviewer account လိုအပ်သည်', 'Assigned reviewer account required')} body={L('ပုံမှန် sign out / sign in ဖြင့် ဤ frozen batch အတွက် သတ်မှတ်ထားသော reviewer account ကို သုံးပါ။', 'Use normal sign out / sign in with the reviewer account assigned to this frozen batch.')} />;
  }
  if (state.kind === 'unavailable') {
    return <BlockedCard testId="clinical-batch-backend-missing" title={L('Exact batch backend မရသေးပါ', 'Exact batch backend unavailable')} body={L('Exact assignment၊ frozen snapshot နှင့် server-issued receipt ပါသော contract မရသေးသဖြင့် မည်သည့် row ကိုမျှ အတည်မပြုနိုင်ပါ။ Broad queue ကို assignment အဖြစ် မယူပါ။', 'No row can be decided until the server returns an exact assignment, frozen snapshot, and server-issued receipt. The broad queue is never treated as an assignment.')} />;
  }
  if (state.kind === 'invalid') {
    return <BlockedCard testId="clinical-batch-invalid" title={L('Batch contract မမှန်ပါ', 'Invalid batch contract')} body={`${L('လုပ်ဆောင်မှု ရပ်ထားသည်။ Refreeze လုပ်ပြီး contract အသစ်ထုတ်ပါ။', 'Work is stopped. Refreeze and issue a new contract.')} (${state.reason})`} />;
  }
  if (state.kind === 'stale') {
    return <BlockedCard testId="clinical-batch-stale" title={L('Batch မူကွဲ ဟောင်းသွားပါပြီ', 'Batch contains a stale revision')} body={L(`Assignment ${state.assignmentIds.join(', ')} ကို ပြန်လည် freeze မလုပ်မချင်း ဆက်မလုပ်နိုင်ပါ။`, `Refreeze assignment ${state.assignmentIds.join(', ')} before continuing.`)} />;
  }
  return <ClinicalBatchSession key={`${state.batch.batchId}:${state.batch.freezeDigest}`} batch={state.batch} reviewer={reviewer} recordDecision={recordDecision} />;
}
