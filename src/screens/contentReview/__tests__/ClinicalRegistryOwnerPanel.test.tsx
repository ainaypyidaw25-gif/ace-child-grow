import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClinicalRegistryOwnerPanel } from '../ClinicalRegistryOwnerPanel';

const registry = vi.hoisted(() => ({
  status: null as null | Record<string, unknown>,
  loadStatus: vi.fn(),
  materialize: vi.fn(),
  activate: vi.fn(),
}));

vi.mock('../../../../convex/_generated/api', () => ({
  api: {
    clinicalReviewRegistry: {
      materializeRegisteredReleaseBatches: 'materializeRegisteredReleaseBatches',
      activateRegisteredBatch: 'activateRegisteredBatch',
    },
    clinicalReviewBatchActions: {
      getOwnerRegistryStatus: 'getOwnerRegistryStatus',
    },
  },
}));

vi.mock('convex/react', () => ({
  useAction: () => registry.loadStatus,
  useMutation: (reference: string) => (
    reference === 'materializeRegisteredReleaseBatches' ? registry.materialize : registry.activate
  ),
}));

vi.mock('../../../app/LocaleContext', () => ({
  useLocale: () => ({ locale: 'en' as const }),
}));

function release(overrides: Record<string, unknown> = {}) {
  return {
    batchId: 'clinical-root-v1',
    sequence: 2,
    dimension: 'clinical',
    activationKind: 'initial',
    freezeDigest: 'f'.repeat(64),
    itemCount: 2,
    expiresAt: 1_816_560_000_000,
    persistedStatus: null,
    persistedBatchRows: 0,
    persistedAssignmentRows: 0,
    persistedReceiptRows: 0,
    registrationExact: false,
    assignmentsExact: false,
    readinessCode: 'not_materialized',
    ...overrides,
  };
}

function status(overrides: Record<string, unknown> = {}) {
  return {
    registryDigest: 'a'.repeat(64),
    registryCode: 'valid',
    materializationCode: 'materialization_required',
    registeredReleaseCount: 1,
    persistedBatchCount: 0,
    persistedAssignmentCount: 0,
    releases: [release()],
    currentActivation: null,
    ...overrides,
  };
}

describe('ClinicalRegistryOwnerPanel', () => {
  beforeEach(() => {
    registry.status = status();
    registry.loadStatus.mockReset();
    registry.loadStatus.mockImplementation(async () => registry.status);
    registry.materialize.mockReset();
    registry.activate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes owner readiness from the server at least once per minute', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-24T08:00:00.000Z'));
    render(<ClinicalRegistryOwnerPanel />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(registry.loadStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(registry.loadStatus).toHaveBeenCalledTimes(2);
  });

  it('requires the exact registry digest and confirms reactive materialization readback', async () => {
    registry.materialize.mockResolvedValue({
      ok: true,
      code: 'materialized',
      batchId: null,
      createdBatches: 1,
      createdAssignments: 2,
    });
    render(<ClinicalRegistryOwnerPanel />);
    const button = await screen.findByRole('button', { name: 'Materialize exact registry' });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Registry digest confirmation' }), {
      target: { value: 'wrong-digest' },
    });
    expect(button).toBeDisabled();
    expect(registry.materialize).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Registry digest confirmation' }), {
      target: { value: ` ${'a'.repeat(64)} ` },
    });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Registry digest confirmation' }), {
      target: { value: 'a'.repeat(64) },
    });
    fireEvent.click(button);
    await waitFor(() => expect(registry.materialize).toHaveBeenCalledTimes(1));
    expect(registry.materialize).toHaveBeenCalledWith({ expectedRegistryDigest: 'a'.repeat(64) });
    expect(button).toBeDisabled();
    expect(screen.getByTestId('clinical-registry-readback')).toHaveTextContent('Waiting for server readback');

    registry.status = status({
      materializationCode: 'materialized_exact',
      persistedBatchCount: 1,
      persistedAssignmentCount: 2,
      releases: [release({
        persistedStatus: 'frozen',
        persistedBatchRows: 1,
        persistedAssignmentRows: 2,
        registrationExact: true,
        assignmentsExact: true,
        readinessCode: 'ready_initial',
      })],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }));
    await waitFor(() => expect(screen.getByTestId('clinical-registry-readback')).toHaveTextContent('Server readback confirmed'));
  });

  it('exposes only the server-selected activation and requires its exact typed phrase', async () => {
    registry.status = status({
      materializationCode: 'materialized_exact',
      persistedBatchCount: 1,
      persistedAssignmentCount: 2,
      releases: [release({
        activationKind: 'after_handoff',
        persistedStatus: 'frozen',
        persistedBatchRows: 1,
        persistedAssignmentRows: 2,
        registrationExact: true,
        assignmentsExact: true,
        readinessCode: 'ready_after_handoff',
      })],
      currentActivation: {
        batchId: 'clinical-root-v1',
        freezeDigest: 'f'.repeat(64),
        expectedUpstreamReceiptDigest: 'r'.repeat(64),
        confirmationText: 'ACTIVATE clinical-root-v1',
        readinessCode: 'ready_after_handoff',
      },
    });
    registry.activate.mockResolvedValue({
      ok: true,
      code: 'activated',
      batchId: 'clinical-root-v1',
      createdBatches: 0,
      createdAssignments: 0,
    });
    render(<ClinicalRegistryOwnerPanel />);
    const button = await screen.findByRole('button', { name: 'Activate this exact batch' });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Activation confirmation' }), {
      target: { value: 'ACTIVATE wrong-batch' },
    });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Activation confirmation' }), {
      target: { value: 'ACTIVATE clinical-root-v1 ' },
    });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Activation confirmation' }), {
      target: { value: 'ACTIVATE clinical-root-v1' },
    });
    fireEvent.click(button);
    await waitFor(() => expect(registry.activate).toHaveBeenCalledTimes(1));
    expect(registry.activate).toHaveBeenCalledWith({
      batchId: 'clinical-root-v1',
      expectedFreezeDigest: 'f'.repeat(64),
      expectedUpstreamReceiptDigest: 'r'.repeat(64),
    });
    expect(button).toBeDisabled();

    registry.status = status({
      materializationCode: 'materialized_exact',
      persistedBatchCount: 1,
      persistedAssignmentCount: 2,
      releases: [release({
        persistedStatus: 'active',
        persistedBatchRows: 1,
        persistedAssignmentRows: 2,
        registrationExact: true,
        assignmentsExact: true,
        readinessCode: 'already_active',
      })],
      currentActivation: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }));
    await waitFor(() => expect(screen.getByTestId('clinical-registry-readback')).toHaveTextContent('Server readback confirmed'));
    expect(screen.getByRole('button', { name: 'Activate this exact batch' })).toBeDisabled();
  });

  it('requires the exact refreeze phrase and decision-set digest before activating', async () => {
    const decisionSetDigest = 'd'.repeat(64);
    registry.status = status({
      materializationCode: 'materialized_exact',
      persistedBatchCount: 1,
      persistedAssignmentCount: 2,
      releases: [release({
        activationKind: 'after_changes_requested_refreeze',
        persistedStatus: 'frozen',
        persistedBatchRows: 1,
        persistedAssignmentRows: 2,
        registrationExact: true,
        assignmentsExact: true,
        readinessCode: 'ready_after_changes_requested_refreeze',
      })],
      currentActivation: {
        batchId: 'clinical-root-v1',
        freezeDigest: 'f'.repeat(64),
        expectedUpstreamReceiptDigest: decisionSetDigest,
        confirmationText: 'ACTIVATE clinical-root-v1',
        readinessCode: 'ready_after_changes_requested_refreeze',
      },
    });
    registry.activate.mockResolvedValue({
      ok: true,
      code: 'activated',
      batchId: 'clinical-root-v1',
      createdBatches: 0,
      createdAssignments: 0,
    });
    render(<ClinicalRegistryOwnerPanel />);
    const button = await screen.findByRole('button', { name: 'Activate this exact batch' });
    const phrase = screen.getByRole('textbox', { name: 'Activation confirmation' });
    const digest = screen.getByRole('textbox', { name: 'Decision-set digest confirmation' });
    expect(button).toBeDisabled();

    fireEvent.change(phrase, { target: { value: 'ACTIVATE clinical-root-v1' } });
    expect(button).toBeDisabled();
    fireEvent.change(digest, { target: { value: ` ${decisionSetDigest} ` } });
    expect(button).toBeDisabled();
    fireEvent.change(digest, { target: { value: decisionSetDigest } });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    await waitFor(() => expect(registry.activate).toHaveBeenCalledTimes(1));
    expect(registry.activate).toHaveBeenCalledWith({
      batchId: 'clinical-root-v1',
      expectedFreezeDigest: 'f'.repeat(64),
      expectedUpstreamReceiptDigest: decisionSetDigest,
    });
    expect(button).toBeDisabled();

    registry.status = status({
      materializationCode: 'materialized_exact',
      persistedBatchCount: 1,
      persistedAssignmentCount: 2,
      releases: [release({
        activationKind: 'after_changes_requested_refreeze',
        persistedStatus: 'active',
        persistedBatchRows: 1,
        persistedAssignmentRows: 2,
        registrationExact: true,
        assignmentsExact: true,
        readinessCode: 'already_active',
      })],
      currentActivation: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }));
    await waitFor(() => expect(screen.getByTestId('clinical-registry-readback')).toHaveTextContent('Server readback confirmed'));
  });
});
