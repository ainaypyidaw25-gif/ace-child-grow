export type ReviewerCompletionRow = {
  reviewerId: string;
  reviewerName: string;
  reviewerType: string;
  assigned: number;
  completed: number;
  changesRequested: number;
  blocked: number;
  overdue: number;
  completionPercent: number;
  lastActivity: number | null;
};

export type ReviewerPaymentExportRow = {
  batchKey: string;
  reviewerName: string;
  assignedItemCount: number;
  firstReviewsCompleted: number;
  revisionReviewsCompleted: number;
  finalApprovalsCompleted: number;
  blockedItems: number;
  rejectedItems: number;
  overdueItems: number;
  totalCompletedItems: number;
  rateBasis: 'per_item' | 'package';
  agreedRateMmk: number;
  manualAdjustmentMmk: number;
  manualAdjustmentReason: string | null;
  proposedPayableMmk: number;
  status: string;
  paymentReference: string | null;
  note: string | null;
  updatedAt: number;
};

const CSV_FORMULA_PREFIX = /^[=+\-@]/;

export function escapeCsvCell(value: string | number | null): string {
  let text = value === null ? '' : String(value);
  // Spreadsheet programs may execute cells beginning with these characters.
  // Prefixing a quote preserves the visible value while keeping exports inert.
  if (CSV_FORMULA_PREFIX.test(text.replace(/^\s+/, ''))) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildReviewerCompletionCsv(
  rows: ReviewerCompletionRow[],
  locale: 'mm' | 'en',
): string {
  const headers = locale === 'mm'
    ? ['သုံးသပ်သူ', 'သုံးသပ်သူအမျိုးအစား', 'တာဝန်စုစုပေါင်း', 'ပြီးစီး', 'ပြင်ဆင်ရန်', 'ပိတ်ဆို့', 'နောက်ကျ', 'ပြီးစီးမှုရာခိုင်နှုန်း', 'နောက်ဆုံးလုပ်ဆောင်ချိန်']
    : ['Reviewer', 'Reviewer type', 'Assigned', 'Completed', 'Changes requested', 'Blocked', 'Overdue', 'Completion percent', 'Last activity'];
  const lines = [headers.map(escapeCsvCell).join(',')];

  for (const row of rows) {
    const lastActivity = row.lastActivity === null ? '' : new Date(row.lastActivity).toISOString();
    lines.push([
      row.reviewerName,
      row.reviewerType,
      row.assigned,
      row.completed,
      row.changesRequested,
      row.blocked,
      row.overdue,
      row.completionPercent,
      lastActivity,
    ].map(escapeCsvCell).join(','));
  }

  // The BOM keeps Myanmar text readable when opened directly in Excel.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function buildReviewerPaymentCsv(
  rows: ReviewerPaymentExportRow[],
  locale: 'mm' | 'en',
): string {
  const headers = locale === 'mm'
    ? [
      'စာရင်းအမှတ်', 'သုံးသပ်သူ', 'တာဝန်စုစုပေါင်း', 'ပထမအကြိမ်ပြီးစီး', 'ပြင်ဆင်ပြီးပြန်စစ်ပြီး',
      'နောက်ဆုံးအတည်ပြုပြီး', 'ပိတ်ဆို့', 'ပယ်ချ', 'နောက်ကျ', 'ပြီးစီးစုစုပေါင်း', 'တွက်ချက်ပုံ',
      'သတ်မှတ်နှုန်း (ကျပ်)', 'ထပ်ပေါင်း/နုတ် (ကျပ်)', 'ပြင်ဆင်ရသည့်အကြောင်း', 'အဆိုပြုငွေ (ကျပ်)',
      'အခြေအနေ', 'ငွေပေးချေမှုအမှတ်စဉ်', 'မှတ်ချက်', 'နောက်ဆုံးပြင်ဆင်ချိန်',
    ]
    : [
      'Batch reference', 'Reviewer', 'Assigned items', 'First reviews completed', 'Revision reviews completed',
      'Final approvals completed', 'Blocked', 'Rejected', 'Overdue', 'Total completed', 'Rate basis',
      'Agreed rate (MMK)', 'Manual adjustment (MMK)', 'Adjustment reason', 'Proposed payable (MMK)',
      'Status', 'Payment reference', 'Note', 'Last updated',
    ];
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    lines.push([
      row.batchKey,
      row.reviewerName,
      row.assignedItemCount,
      row.firstReviewsCompleted,
      row.revisionReviewsCompleted,
      row.finalApprovalsCompleted,
      row.blockedItems,
      row.rejectedItems,
      row.overdueItems,
      row.totalCompletedItems,
      row.rateBasis,
      row.agreedRateMmk,
      row.manualAdjustmentMmk,
      row.manualAdjustmentReason,
      row.proposedPayableMmk,
      row.status,
      row.paymentReference,
      row.note,
      new Date(row.updatedAt).toISOString(),
    ].map(escapeCsvCell).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function downloadCsv(csv: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Safari may not begin the download until after the click handler returns.
  // Keep the object URL alive briefly, then release it.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadReviewerCompletionCsv(
  rows: ReviewerCompletionRow[],
  locale: 'mm' | 'en',
): void {
  const csv = buildReviewerCompletionCsv(rows, locale);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `ace-child-grow-reviewer-completion-${date}.csv`);
}

export function downloadReviewerPaymentCsv(
  rows: ReviewerPaymentExportRow[],
  locale: 'mm' | 'en',
): void {
  const csv = buildReviewerPaymentCsv(rows, locale);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `ace-child-grow-reviewer-payments-${date}.csv`);
}
