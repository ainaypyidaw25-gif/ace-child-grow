import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClinicalRegistryOwnerPanel } from '../ClinicalRegistryOwnerPanel';

const registry = vi.hoisted(() => ({
  status: null as null | Record<string, unknown>,
  materialize: vi.fn(),
  activate: vi.fn(),
}));

vi.mock('../../../../convex/_generated/api', () => ({
  api: {
    clinicalReviewRegistry: {
      ownerRegistryStatus: 'ownerRegistryStatus',
      materializeRegisteredReleaseBatches: 'materializeRegisteredReleaseBatches',
      activateRegisteredBatch: 'activateRegisteredBatch',
    },
  },
}));

vi.mock('convex/react', () => ({
  useQuery: () => registry.status,
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
    registry.materialize.mockReset();
    registry.activate.mockReset();
  });

  it('requires the exact registry digest and confirms reactive materialization readback', async () => {
    registry.materialize.mockResolvedValue({
      ok: true,
      code: 'materialized',
      batchId: null,
      createdBatches: 1,
      createdAssignments: 2,
    });
    const view = render(<ClinicalRegistryOwnerPanel />);
    const button = screen.getByRole('button', { name: 'Materialize exact registry' });
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
    view.rerender(<ClinicalRegistryOwnerPanel />);
    expect(screen.getByTestId('clinical-registry-readback')).toHaveTextContent('Server readback confirmed');
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
    const view = render(<ClinicalRegistryOwnerPanel />);
    const button = screen.getByRole('button', { name: 'Activate this exact batch' });
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
    view.rerender(<ClinicalRegistryOwnerPanel />);
    expect(screen.getByTestId('clinical-registry-readback')).toHaveTextContent('Server readback confirmed');
    expect(screen.getByRole('button', { name: 'Activate this exact batch' })).toBeDisabled();
  });
});
