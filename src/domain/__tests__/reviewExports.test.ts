import { describe, expect, it } from 'vitest';
import { buildReviewerCompletionCsv, buildReviewerPaymentCsv, escapeCsvCell } from '../reviews/reviewExports';

describe('reviewer completion CSV export', () => {
  it('quotes commas and quotes safely', () => {
    expect(escapeCsvCell('Dr. A, "Reviewer"')).toBe('"Dr. A, ""Reviewer"""');
  });

  it('neutralises spreadsheet formula prefixes', () => {
    expect(escapeCsvCell('=HYPERLINK("https://example.com")')).toBe('"\'=HYPERLINK(""https://example.com"")"');
    expect(escapeCsvCell('+100')).toBe('"\'+100"');
    expect(escapeCsvCell('  @SUM(1,2)')).toBe('"\'  @SUM(1,2)"');
  });

  it('exports Myanmar-safe, deterministic rows with all completion counts', () => {
    const csv = buildReviewerCompletionCsv([{
      reviewerId: 'reviewer-1',
      reviewerName: 'မသီတာ',
      reviewerType: 'myanmar_language_reviewer',
      assigned: 12,
      completed: 8,
      changesRequested: 2,
      blocked: 1,
      overdue: 3,
      completionPercent: 67,
      lastActivity: Date.UTC(2026, 6, 29, 2, 30),
    }], 'mm');

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"သုံးသပ်သူ"');
    expect(csv).toContain('"မသီတာ","myanmar_language_reviewer","12","8","2","1","3","67","2026-07-29T02:30:00.000Z"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('exports manager payment fields without losing Myanmar text', () => {
    const csv = buildReviewerPaymentCsv([{
      batchKey: 'batch-1',
      reviewerName: 'ဒေါ်သီတာ',
      assignedItemCount: 3,
      firstReviewsCompleted: 2,
      revisionReviewsCompleted: 1,
      finalApprovalsCompleted: 3,
      blockedItems: 0,
      rejectedItems: 0,
      overdueItems: 1,
      totalCompletedItems: 3,
      rateBasis: 'per_item',
      agreedRateMmk: 2_000,
      manualAdjustmentMmk: 500,
      manualAdjustmentReason: 'ပြန်စစ်ရမှု',
      proposedPayableMmk: 6_500,
      status: 'approved_for_payment',
      paymentReference: null,
      note: 'လက်ဖြင့် ငွေပေးရန်',
      updatedAt: Date.UTC(2026, 6, 29, 3, 0),
    }], 'mm');

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"ဒေါ်သီတာ"');
    expect(csv).toContain('"6500","approved_for_payment"');
    expect(csv).toContain('"ပြန်စစ်ရမှု"');
  });
});
