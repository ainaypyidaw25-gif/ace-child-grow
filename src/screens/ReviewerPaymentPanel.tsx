import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { downloadReviewerPaymentCsv } from '../domain/reviews/reviewExports';

type PaymentStatus = 'not_calculated' | 'ready_for_review' | 'approved_for_payment' | 'paid' | 'disputed';

type AssignmentRow = {
  assignment: {
    _id: Id<'reviewAssignments'>;
    reviewerId: Id<'users'>;
    contentSlug: string;
    status: string;
    paymentBatchId?: string;
  };
  titleMm: string;
  titleEn: string;
};

type ReviewerName = {
  reviewerId: Id<'users'>;
  reviewerName: string;
};

const STATUS_LABELS: Record<PaymentStatus, { mm: string; en: string }> = {
  not_calculated: { mm: 'မတွက်ချက်ရသေး', en: 'Not calculated' },
  ready_for_review: { mm: 'စစ်ဆေးရန် အသင့်', en: 'Ready for review' },
  approved_for_payment: { mm: 'ငွေပေးရန် အတည်ပြုပြီး', en: 'Approved for payment' },
  paid: { mm: 'ငွေပေးပြီး', en: 'Paid' },
  disputed: { mm: 'ပြန်လည်စစ်ဆေးရန်', en: 'Disputed' },
};

export function allowedPaymentStatusTargets(currentStatus: PaymentStatus, mayAuthorize: boolean): PaymentStatus[] {
  if (currentStatus === 'ready_for_review') {
    return mayAuthorize ? ['approved_for_payment', 'disputed'] : ['disputed'];
  }
  if (currentStatus === 'approved_for_payment') return mayAuthorize ? ['paid', 'disputed'] : ['disputed'];
  if (currentStatus === 'disputed') return ['ready_for_review'];
  return [];
}

export function paymentStatusNeedsConfirmation(status: PaymentStatus): boolean {
  return status === 'approved_for_payment' || status === 'paid';
}

export function paymentBaseAmount(batch: {
  rateBasis: 'per_item' | 'package';
  agreedRateMmk: number;
  assignedItemCount: number;
}): number {
  return batch.rateBasis === 'per_item'
    ? batch.assignedItemCount * batch.agreedRateMmk
    : batch.agreedRateMmk;
}

export function paymentExportAvailable(workspace?: { batches: unknown[]; hasMore: boolean }): boolean {
  return Boolean(workspace && workspace.batches.length > 0 && !workspace.hasMore);
}

function PaymentStatusForm({
  batchId,
  batchKey,
  reviewerName,
  proposedPayableMmk,
  currentStatus,
  mayAuthorize,
  locale,
}: {
  batchId: Id<'reviewPaymentBatches'>;
  batchKey: string;
  reviewerName: string;
  proposedPayableMmk: number;
  currentStatus: PaymentStatus;
  mayAuthorize: boolean;
  locale: 'mm' | 'en';
}) {
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const setPaymentStatus = useMutation(api.reviewReports.setPaymentStatus);
  const allowedStatuses = allowedPaymentStatusTargets(currentStatus, mayAuthorize);
  const [status, setStatus] = useState<PaymentStatus>(allowedStatuses[0] ?? currentStatus);
  const [note, setNote] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (paymentStatusNeedsConfirmation(status) && !confirming) {
      setMessage('');
      setConfirming(true);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await setPaymentStatus({
        batchId,
        status,
        note: note.trim(),
        paymentReference: status === 'paid' ? paymentReference.trim() : undefined,
      });
      setNote('');
      setPaymentReference('');
      setConfirming(false);
      setMessage(L('အခြေအနေကို သိမ်းပြီးပါပြီ။', 'Status saved.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('သိမ်း၍ မရပါ။', 'Unable to save.'));
    } finally {
      setBusy(false);
    }
  };

  if (allowedStatuses.length === 0) {
    return <p className="mt-3 text-xs text-ink-soft">{L('ဤစာရင်းအတွက် ဆက်လက်ပြောင်းလဲနိုင်သည့် အခြေအနေ မရှိပါ။', 'No further status action is available for this batch.')}</p>;
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 rounded-xl bg-canvas p-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs font-medium text-ink">
        <span>{L('အခြေအနေအသစ်', 'New status')}</span>
        <select value={status} onChange={(event) => { setStatus(event.target.value as PaymentStatus); setConfirming(false); }} className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm">
          {allowedStatuses.map((value) => <option key={value} value={value}>{STATUS_LABELS[value][locale]}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium text-ink">
        <span>{L('မှတ်ချက်', 'Note')}</span>
        <input value={note} onChange={(event) => { setNote(event.target.value); setConfirming(false); }} required className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
      </label>
      {status === 'paid' && (
        <label className="space-y-1 text-xs font-medium text-ink sm:col-span-2">
          <span>{L('ငွေပေးချေမှု အမှတ်စဉ်', 'Payment reference')}</span>
          <input value={paymentReference} onChange={(event) => { setPaymentReference(event.target.value); setConfirming(false); }} required className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
        </label>
      )}
      {confirming ? (
        <div role="alert" className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-ink sm:col-span-2">
          <p className="font-semibold">{status === 'paid' ? L('ငွေပေးချေပြီးကြောင်း အတည်ပြုပါ', 'Confirm payment') : L('ငွေပေးရန် အတည်ပြုပါ', 'Confirm payment approval')}</p>
          <p>
            {status === 'paid'
              ? L(`${batchKey} စာရင်းမှ ${reviewerName} အတွက် ${proposedPayableMmk.toLocaleString()} ကျပ် ပေးချေပြီးဖြစ်ကြောင်း မှတ်တမ်းတင်ပါမည်။ ငွေပေးချေမှု အမှတ်စဉ်မှာ ${paymentReference.trim()} ဖြစ်ပါသည်။`, `This will record ${proposedPayableMmk.toLocaleString()} MMK as paid to ${reviewerName} for batch ${batchKey}, using payment reference ${paymentReference.trim()}.`)
              : L(`${batchKey} စာရင်းမှ ${reviewerName} အတွက် ${proposedPayableMmk.toLocaleString()} ကျပ်ကို ငွေပေးရန် အတည်ပြုပါမည်။`, `This will approve ${proposedPayableMmk.toLocaleString()} MMK for payment to ${reviewerName} for batch ${batchKey}.`)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="rounded-pill bg-sky px-4 py-2 font-semibold text-white disabled:opacity-50">
              {busy ? L('သိမ်းနေသည်…', 'Saving…') : status === 'paid' ? L('ပေးချေပြီးကြောင်း အတည်ပြုမည်', 'Confirm as paid') : L('ငွေပေးရန် အတည်ပြုမည်', 'Confirm approval')}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="rounded-pill border border-line bg-white px-4 py-2 font-semibold text-ink disabled:opacity-50">
              {L('မလုပ်တော့ပါ', 'Cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <button type="submit" disabled={busy || !note.trim() || (status === 'paid' && !paymentReference.trim())} className="rounded-pill border border-sky px-4 py-2 text-xs font-semibold text-sky-deep disabled:opacity-50">
            {busy
              ? L('သိမ်းနေသည်…', 'Saving…')
              : paymentStatusNeedsConfirmation(status)
                ? L('အတည်ပြုရန် ပြန်စစ်မည်', 'Review and confirm')
                : L('အခြေအနေ သိမ်းမည်', 'Save status')}
          </button>
        </div>
      )}
      {message && <span role="status" className="text-xs text-ink-soft sm:col-span-2">{message}</span>}
    </form>
  );
}

export function ReviewerPaymentPanel({
  roles,
  assignments,
  reviewers,
  locale,
}: {
  roles: string[];
  assignments: AssignmentRow[];
  reviewers: ReviewerName[];
  locale: 'mm' | 'en';
}) {
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const workspace = useQuery(api.reviewReports.paymentWorkspace, {});
  const createPaymentBatch = useMutation(api.reviewReports.createPaymentBatch);
  const recordExport = useMutation(api.reviewReports.recordExport);
  const mayAuthorize = roles.some((role) => role === 'owner' || role === 'system_admin');
  const eligible = useMemo(
    () => assignments.filter((row) => row.assignment.status === 'approved' && !row.assignment.paymentBatchId),
    [assignments],
  );
  const reviewerOptions = useMemo(() => {
    const names = new Map(reviewers.map((row) => [row.reviewerId, row.reviewerName]));
    return [...new Set(eligible.map((row) => row.assignment.reviewerId))].map((reviewerId) => ({
      reviewerId,
      reviewerName: names.get(reviewerId) ?? (locale === 'mm' ? 'သုံးသပ်သူ' : 'Reviewer'),
    }));
  }, [eligible, reviewers, locale]);
  const [reviewerId, setReviewerId] = useState('');
  const [assignmentIds, setAssignmentIds] = useState<Set<string>>(new Set());
  const [batchKey, setBatchKey] = useState('');
  const [rateBasis, setRateBasis] = useState<'per_item' | 'package'>('per_item');
  const [rate, setRate] = useState('');
  const [adjustment, setAdjustment] = useState('0');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const reviewerAssignments = eligible.filter((row) => row.assignment.reviewerId === reviewerId);

  const toggleAssignment = (assignmentId: string) => {
    setAssignmentIds((current) => {
      const next = new Set(current);
      if (next.has(assignmentId)) next.delete(assignmentId);
      else next.add(assignmentId);
      return next;
    });
  };

  const submitBatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!reviewerId || assignmentIds.size === 0) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await createPaymentBatch({
        batchKey: batchKey.trim(),
        reviewerId: reviewerId as Id<'users'>,
        assignmentIds: [...assignmentIds] as Id<'reviewAssignments'>[],
        agreedRateMmk: Number(rate),
        rateBasis,
        manualAdjustmentMmk: Number(adjustment || 0),
        manualAdjustmentReason: Number(adjustment || 0) === 0 ? undefined : adjustmentReason.trim(),
        note: note.trim() || undefined,
      });
      setAssignmentIds(new Set());
      setBatchKey('');
      setRate('');
      setAdjustment('0');
      setAdjustmentReason('');
      setNote('');
      setMessage(L(`ငွေပေးရန် အဆိုပြုပမာဏ ${result.proposedPayableMmk.toLocaleString()} ကျပ် ဖြစ်ပါသည်။`, `Proposed payable amount: ${result.proposedPayableMmk.toLocaleString()} MMK.`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('စာရင်းပြုလုပ်၍ မရပါ။', 'Unable to create payment batch.'));
    } finally {
      setBusy(false);
    }
  };

  const exportPaymentReport = async (kind: 'payment_csv' | 'payment_print') => {
    if (!workspace) return;
    setMessage('');
    if (!paymentExportAvailable(workspace)) {
      setMessage(L('ငွေစာရင်းအပြည့်အစုံ ရရှိမှသာ အစီရင်ခံစာ ထုတ်ယူနိုင်ပါမည်။', 'The complete payment list is required before exporting a report.'));
      return;
    }
    try {
      await recordExport({ kind, filterSummary: 'latest payment batches' });
      if (kind === 'payment_csv') {
        downloadReviewerPaymentCsv(workspace.batches, locale);
        return;
      }
      document.body.classList.add('print-reviewer-payments');
      try {
        window.print();
      } finally {
        document.body.classList.remove('print-reviewer-payments');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('အစီရင်ခံစာ ထုတ်ယူ၍ မရပါ။', 'Unable to export report.'));
    }
  };

  return (
    <details id="reviewer-payment-report" className="rounded-card border border-line bg-white p-4 shadow-card">
      <summary className="cursor-pointer font-bold text-sky-deep">{L('သုံးသပ်ခ စီမံရန်', 'Manage reviewer fees')}</summary>
      <p className="mt-2 text-sm text-ink-soft print:hidden">
        {L('ပြီးစီးအတည်ပြုထားသည့် တာဝန်များအတွက် စာရင်းပြုလုပ်နိုင်ပါသည်။ ဤနေရာမှ အလိုအလျောက် ငွေလွှဲခြင်း မရှိပါ။', 'Prepare fees for approved work. This workspace never transfers money automatically.')}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={() => void exportPaymentReport('payment_csv')} disabled={!paymentExportAvailable(workspace)} className="rounded-pill border border-sky px-4 py-2 text-xs font-semibold text-sky-deep disabled:opacity-50">{L('ငွေစာရင်း CSV ထုတ်မည်', 'Export payment CSV')}</button>
        <button type="button" onClick={() => void exportPaymentReport('payment_print')} disabled={!paymentExportAvailable(workspace)} className="rounded-pill border border-sky px-4 py-2 text-xs font-semibold text-sky-deep disabled:opacity-50">{L('ငွေစာရင်း ပုံနှိပ်မည်', 'Print payment report')}</button>
      </div>
      {workspace?.hasMore && (
        <p role="alert" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-ink print:hidden">
          {L('ငွေစာရင်းအချို့ကိုသာ ယခုစာမျက်နှာတွင် ပြထားနိုင်သေးသောကြောင့် မပြည့်စုံသည့် CSV သို့မဟုတ် ပုံနှိပ်အစီရင်ခံစာ မထွက်စေရန် ယာယီပိတ်ထားပါသည်။ စာရင်းအပြည့်အစုံ ရနိုင်မှ ထုတ်ယူနိုင်ပါမည်။', 'More payment batches exist than this page currently loads. CSV and print are disabled to prevent an incomplete report.')}
        </p>
      )}

      <form onSubmit={submitBatch} className="mt-4 grid gap-3 print:hidden lg:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('သုံးသပ်သူ', 'Reviewer')}</span>
          <select value={reviewerId} onChange={(event) => { setReviewerId(event.target.value); setAssignmentIds(new Set()); }} required className="w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="">{L('သုံးသပ်သူ ရွေးပါ', 'Select reviewer')}</option>
            {reviewerOptions.map((row) => <option key={row.reviewerId} value={row.reviewerId}>{row.reviewerName}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('စာရင်းအမှတ်', 'Batch reference')}</span>
          <input value={batchKey} onChange={(event) => setBatchKey(event.target.value)} required className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
        {reviewerId && (
          <fieldset className="space-y-2 rounded-xl border border-line bg-canvas p-3 lg:col-span-2">
            <legend className="px-1 text-sm font-semibold text-ink">{L('ငွေတွက်မည့် ပြီးစီးတာဝန်များ', 'Approved work to include')}</legend>
            {reviewerAssignments.map((row) => (
              <label key={row.assignment._id} className="flex items-start gap-2 rounded-lg bg-white p-2 text-sm text-ink">
                <input type="checkbox" checked={assignmentIds.has(row.assignment._id)} onChange={() => toggleAssignment(row.assignment._id)} className="mt-1" />
                <span><b>{locale === 'mm' ? row.titleMm : row.titleEn}</b><span className="block text-xs text-ink-soft">{row.assignment.contentSlug}</span></span>
              </label>
            ))}
            {reviewerAssignments.length === 0 && <p className="text-sm text-ink-soft">{L('ငွေစာရင်းမသွင်းရသေးသည့် ပြီးစီးတာဝန် မရှိပါ။', 'No approved unbatched work is available.')}</p>}
          </fieldset>
        )}
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('တွက်ချက်ပုံ', 'Rate basis')}</span>
          <select value={rateBasis} onChange={(event) => setRateBasis(event.target.value as 'per_item' | 'package')} className="w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="per_item">{L('တစ်ခုချင်းနှုန်း', 'Per item')}</option>
            <option value="package">{L('အစုလိုက်နှုန်း', 'Package')}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{rateBasis === 'per_item' ? L('တစ်ခုလျှင် ကျပ်', 'MMK per item') : L('အစုလိုက် ကျပ်', 'Package amount (MMK)')}</span>
          <input type="number" min="0" step="1" value={rate} onChange={(event) => setRate(event.target.value)} required className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('ထပ်ပေါင်း/နုတ် ပမာဏ', 'Manual adjustment (MMK)')}</span>
          <input type="number" step="1" value={adjustment} onChange={(event) => setAdjustment(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
        {Number(adjustment || 0) !== 0 && (
          <label className="space-y-1 text-sm font-medium text-ink">
            <span>{L('ပြင်ဆင်ရသည့် အကြောင်းရင်း', 'Adjustment reason')}</span>
            <input value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)} required className="w-full rounded-xl border border-line px-3 py-2" />
          </label>
        )}
        <label className="space-y-1 text-sm font-medium text-ink lg:col-span-2">
          <span>{L('အတွင်းမှတ်ချက်', 'Internal note')}</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button type="submit" disabled={busy || !reviewerId || !batchKey.trim() || assignmentIds.size === 0 || Number(rate) < 0 || !rate} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? L('စာရင်းပြုလုပ်နေသည်…', 'Preparing…') : L('ငွေပေးချေမှုစာရင်း ပြုလုပ်မည်', 'Prepare payment batch')}
          </button>
          {message && <span role="status" className="text-sm text-ink-soft">{message}</span>}
        </div>
      </form>

      <section className="mt-5 space-y-3">
        <h3 className="font-semibold text-ink">{L('ပြုလုပ်ထားသော စာရင်းများ', 'Prepared batches')}</h3>
        {workspace === undefined ? <p role="status" className="text-sm text-ink-soft">…</p> : workspace.batches.length === 0 ? (
          <p className="text-sm text-ink-soft">{L('ငွေပေးချေမှုစာရင်း မရှိသေးပါ။', 'No payment batches yet.')}</p>
        ) : workspace.batches.map((batch) => (
          <article key={batch._id} className="rounded-xl border border-line bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="font-semibold text-ink">{batch.batchKey} · {batch.reviewerName}</p><p className="text-xs text-ink-soft">{batch.totalCompletedItems} {L('ခု', 'item(s)')}</p></div>
              <span className="rounded-pill bg-mint-soft px-3 py-1 text-xs font-semibold text-sky-deep">{STATUS_LABELS[batch.status][locale]}</span>
            </div>
            <dl className="mt-3 grid gap-2 rounded-xl bg-canvas p-3 text-xs text-ink sm:grid-cols-2">
              <div>
                <dt className="text-ink-soft">{L('တွက်ချက်ပုံ', 'Rate basis')}</dt>
                <dd className="font-semibold">{batch.rateBasis === 'per_item' ? L('တစ်ခုချင်းနှုန်း', 'Per item') : L('အစုလိုက်နှုန်း', 'Package')}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">{L('သဘောတူနှုန်း', 'Agreed rate')}</dt>
                <dd className="font-semibold">{batch.agreedRateMmk.toLocaleString()} MMK{batch.rateBasis === 'per_item' ? L(' / တစ်ခု', ' / item') : ''}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">{L('မူလတွက်ချက်မှု', 'Base calculation')}</dt>
                <dd className="font-semibold">
                  {batch.rateBasis === 'per_item'
                    ? `${batch.assignedItemCount.toLocaleString()} × ${batch.agreedRateMmk.toLocaleString()} = ${paymentBaseAmount(batch).toLocaleString()} MMK`
                    : `${paymentBaseAmount(batch).toLocaleString()} MMK`}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">{L('ထပ်ပေါင်း/နုတ်', 'Manual adjustment')}</dt>
                <dd className="font-semibold">{batch.manualAdjustmentMmk > 0 ? '+' : ''}{batch.manualAdjustmentMmk.toLocaleString()} MMK</dd>
              </div>
              {batch.manualAdjustmentMmk !== 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-ink-soft">{L('ပြင်ဆင်ရသည့် အကြောင်းရင်း', 'Adjustment reason')}</dt>
                  <dd className="font-semibold">{batch.manualAdjustmentReason}</dd>
                </div>
              )}
              <div className="border-t border-line pt-2 sm:col-span-2">
                <dt className="text-ink-soft">{L('နောက်ဆုံး ငွေပေးရန်အဆိုပြုပမာဏ', 'Final proposed payable')}</dt>
                <dd className="text-base font-bold text-sky-deep">{batch.proposedPayableMmk.toLocaleString()} MMK</dd>
              </div>
            </dl>
            {batch.note && <p className="mt-2 text-sm text-ink-soft">{batch.note}</p>}
            {batch.paymentReference && <p className="mt-1 text-xs text-ink-soft">{L('ငွေပေးချေမှု အမှတ်စဉ်', 'Payment reference')}: {batch.paymentReference}</p>}
            <div className="print:hidden"><PaymentStatusForm key={`${batch._id}-${batch.status}`} batchId={batch._id} batchKey={batch.batchKey} reviewerName={batch.reviewerName} proposedPayableMmk={batch.proposedPayableMmk} currentStatus={batch.status} mayAuthorize={mayAuthorize} locale={locale} /></div>
          </article>
        ))}
      </section>
    </details>
  );
}
