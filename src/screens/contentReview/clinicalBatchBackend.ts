import {
  adaptFrozenClinicalBatch,
  type ClinicalBatchLoadState,
  type RecordClinicalBatchDecision,
} from '../../domain/content/clinicalFrozenBatch';

export interface ClinicalBatchBackendBoundary {
  readAssignedBatch(currentRole: string | null | undefined): ClinicalBatchLoadState;
  recordDecision: RecordClinicalBatchDecision;
}

/**
 * Deliberately fail-closed until the server exposes a session-scoped frozen
 * batch query and an assignment-bound decision mutation. The existing
 * ownerPriority queue and saveDecision mutation are not substituted: neither
 * binds a decision to an assignment, snapshot digest or freeze signature.
 */
export const clinicalBatchBackend: ClinicalBatchBackendBoundary = {
  readAssignedBatch(currentRole) {
    return adaptFrozenClinicalBatch(null, currentRole);
  },
  async recordDecision() {
    return {
      ok: false,
      code: 'backend_unavailable',
      message: 'The signed clinical batch backend is not available on this deployment.',
    };
  },
};
