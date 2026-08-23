import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CLINICAL_BATCH_CONTRACT,
  CLINICAL_BATCH_CONTRACT_VERSION,
  type FrozenClinicalBatch,
  type RecordClinicalBatchDecision,
} from '../../../domain/content/clinicalFrozenBatch';
import { ClinicalFrozenBatchPanel } from '../ClinicalFrozenBatchPanel';

vi.mock('../../../app/LocaleContext', () => ({
  useLocale: () => ({ locale: 'en' as const }),
}));

function batch(): FrozenClinicalBatch {
  return {
    contract: CLINICAL_BATCH_CONTRACT,
    contractVersion: CLINICAL_BATCH_CONTRACT_VERSION,
    scope: 'authenticated_assignee',
    batchId: 'clinical-batch-1',
    lane: 'clinical',
    assignedRole: 'clinical_reviewer',
    frozenAt: 1_787_500_000_000,
    freezeDigest: 'sha256:freeze-1',
    freezeReceiptDigest: 'freeze-receipt-1',
    handoff: null,
    items: [
      {
        assignmentId: 'assignment-1',
        slug: 'sleep-one',
        type: 'guide',
        dimension: 'clinical',
        reviewRevision: 4,
        liveReviewRevision: 4,
        decision: null,
        snapshot: {
          digest: 'sha256:snapshot-1',
          titleMm: 'ပထမအကြောင်းအရာ',
          titleEn: 'First assigned item',
          summaryMm: 'ပထမ frozen summary',
          summaryEn: 'First frozen summary',
          sources: [{
            sourceId: 'source-one',
            org: 'CDC',
            title: 'Source One',
            year: 2026,
            url: 'https://example.test/source-one',
          }],
          fields: [{ path: 'data.body', labelMm: 'အကြောင်းအရာ', labelEn: 'Content', valueMm: 'ပထမ body', valueEn: 'First body' }],
        },
      },
      {
        assignmentId: 'assignment-2',
        slug: 'nutrition-two',
        type: 'lesson',
        dimension: 'child_development',
        reviewRevision: 7,
        liveReviewRevision: 7,
        decision: null,
        snapshot: {
          digest: 'sha256:snapshot-2',
          titleMm: 'ဒုတိယအကြောင်းအရာ',
          titleEn: 'Second assigned item',
          summaryMm: 'ဒုတိယ frozen summary',
          summaryEn: 'Second frozen summary',
          sources: [{
            sourceId: 'source-two',
            org: 'NHS',
            title: 'Source Two',
            year: 2026,
            url: 'https://example.test/source-two',
          }],
          fields: [{ path: 'data.safety', labelMm: 'ဘေးကင်းရေး', labelEn: 'Safety', valueMm: 'ဒုတိယ safety', valueEn: 'Second safety' }],
        },
      },
    ],
  };
}

describe('ClinicalFrozenBatchPanel', () => {
  it('shows a fail-closed message and no decision controls without an exact backend contract', () => {
    render(
      <ClinicalFrozenBatchPanel
        state={{ kind: 'unavailable', reason: 'backend_contract_missing' }}
        reviewer={{ displayName: 'Dr Reviewer', qualification: 'MBBS' }}
        recordDecision={vi.fn()}
      />,
    );
    expect(screen.getByTestId('clinical-batch-backend-missing')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Record this item decision/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('records one exact row at a time, auto-advances, and renders the handoff receipt after unanimous approval', async () => {
    const recordDecision = vi.fn<RecordClinicalBatchDecision>()
      .mockResolvedValueOnce({
        ok: true,
        receipt: { decision: 'approved', note: null, reviewedAt: 1_787_500_010_000, receiptId: 'receipt-1' },
      })
      .mockResolvedValueOnce({
        ok: true,
        receipt: { decision: 'approved', note: null, reviewedAt: 1_787_500_020_000, receiptId: 'receipt-2' },
        handoff: {
          batchId: 'clinical-batch-1',
          decisionCount: 2,
          completedAt: 1_787_500_020_000,
          digest: 'sha256:handoff-1',
          receiptDigest: 'handoff-receipt-1',
        },
      });

    render(
      <ClinicalFrozenBatchPanel
        state={{ kind: 'ready', batch: batch() }}
        reviewer={{ displayName: 'Dr Reviewer', qualification: 'MBBS' }}
        recordDecision={recordDecision}
      />,
    );

    expect(screen.getByRole('link', { name: /Source One/ })).toHaveAttribute('href', 'https://example.test/source-one');

    fireEvent.click(screen.getByRole('radio', { name: 'Approve this exact revision' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record this item decision' }));
    await waitFor(() => expect(recordDecision).toHaveBeenCalledTimes(1));
    expect(recordDecision).toHaveBeenNthCalledWith(1, {
      batchId: 'clinical-batch-1',
      assignmentId: 'assignment-1',
      contentSlug: 'sleep-one',
      dimension: 'clinical',
      decision: 'approved',
      expectedReviewRevision: 4,
      expectedSnapshotDigest: 'sha256:snapshot-1',
      expectedFreezeDigest: 'sha256:freeze-1',
      note: undefined,
    });
    expect(await screen.findByRole('heading', { name: 'ဒုတိယအကြောင်းအရာ' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Approve this exact revision' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record this item decision' }));
    await waitFor(() => expect(recordDecision).toHaveBeenCalledTimes(2));
    expect(recordDecision).toHaveBeenNthCalledWith(2, expect.objectContaining({
      assignmentId: 'assignment-2',
      contentSlug: 'nutrition-two',
      dimension: 'child_development',
      expectedReviewRevision: 7,
      expectedSnapshotDigest: 'sha256:snapshot-2',
      expectedFreezeDigest: 'sha256:freeze-1',
    }));
    expect(await screen.findByTestId('clinical-handoff-receipt')).toHaveTextContent('handoff-receipt-1');
    expect(screen.queryByText(/approve all/i)).not.toBeInTheDocument();
  });

  it('requires a change note and blocks lane handoff when follow-up remains', async () => {
    const existing = batch();
    existing.items[0].decision = {
      decision: 'approved', note: null, reviewedAt: 1_787_500_010_000, receiptId: 'receipt-1',
    };
    const recordDecision = vi.fn<RecordClinicalBatchDecision>().mockResolvedValue({
      ok: true,
      receipt: {
        decision: 'changes_requested',
        note: 'Add a direct source.',
        reviewedAt: 1_787_500_020_000,
        receiptId: 'receipt-2',
      },
    });
    render(
      <ClinicalFrozenBatchPanel
        state={{ kind: 'ready', batch: existing }}
        reviewer={{ displayName: 'Dr Reviewer', qualification: 'MBBS' }}
        recordDecision={recordDecision}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Request changes' }));
    fireEvent.submit(screen.getByTestId('clinical-item-decision-form'));
    expect(recordDecision).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Write a note explaining what must change.');

    fireEvent.change(screen.getByRole('textbox', { name: /Review note/ }), { target: { value: 'Add a direct source.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record this item decision' }));
    expect(await screen.findByTestId('clinical-followup-required')).toHaveTextContent('Do not switch reviewer lanes');
    expect(screen.queryByTestId('clinical-handoff-receipt')).not.toBeInTheDocument();
  });

  it('rejects a final handoff response when an earlier exact row was not approved', async () => {
    const recordDecision = vi.fn<RecordClinicalBatchDecision>()
      .mockResolvedValueOnce({
        ok: true,
        receipt: {
          decision: 'changes_requested',
          note: 'Correct and refreeze this row.',
          reviewedAt: 1_787_500_010_000,
          receiptId: 'receipt-1',
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        receipt: { decision: 'approved', note: null, reviewedAt: 1_787_500_020_000, receiptId: 'receipt-2' },
        handoff: {
          batchId: 'clinical-batch-1',
          decisionCount: 2,
          completedAt: 1_787_500_020_000,
          digest: 'malformed-handoff',
          receiptDigest: 'malformed-receipt',
        },
      });
    render(
      <ClinicalFrozenBatchPanel
        state={{ kind: 'ready', batch: batch() }}
        reviewer={{ displayName: 'Dr Reviewer', qualification: 'MBBS' }}
        recordDecision={recordDecision}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Request changes' }));
    fireEvent.change(screen.getByRole('textbox', { name: /Review note/ }), {
      target: { value: 'Correct and refreeze this row.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record this item decision' }));
    expect(await screen.findByRole('heading', { name: 'ဒုတိယအကြောင်းအရာ' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Approve this exact revision' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record this item decision' }));
    expect(await screen.findByTestId('clinical-batch-refreeze-required')).toHaveTextContent('does not cover this complete batch');
    expect(screen.queryByTestId('clinical-handoff-receipt')).not.toBeInTheDocument();
  });

  it('stops the batch and disables further recording when the server reports a stale revision', async () => {
    const recordDecision = vi.fn<RecordClinicalBatchDecision>().mockResolvedValue({
      ok: false,
      code: 'stale_revision',
      message: 'Revision is now 5. Refreeze required.',
      currentReviewRevision: 5,
    });
    render(
      <ClinicalFrozenBatchPanel
        state={{ kind: 'ready', batch: batch() }}
        reviewer={{ displayName: 'Dr Reviewer', qualification: 'MBBS' }}
        recordDecision={recordDecision}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Approve this exact revision' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record this item decision' }));
    expect(await screen.findByTestId('clinical-batch-refreeze-required')).toHaveTextContent('Revision is now 5');
    expect(screen.getByRole('button', { name: 'Record this item decision' })).toBeDisabled();
  });
});
