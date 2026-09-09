import { AI_PUBLICATION_POLICY_VERSION } from './aiPublicationPolicy';
import {
  AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_COMPLETED_AT,
  AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_STARTED_AT,
  AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
  AI_PUBLICATION_SUCCESSOR_20260909_TARGETS,
} from './aiPublicationSuccessor20260909Data';

export type AiPublicationSuccessor20260909AuditTarget = {
  type: 'lesson' | 'story';
  slug: 'lsn_early_math' | 'st_waiting_at_clinic' | 'st_first_day_school';
  contentSnapshotHash: string;
  evidenceLinkSnapshotHash: string;
  sourceId: string;
  sourceUpdatedAt: number;
  sourceSnapshotHash: string;
  sourceFullSnapshotHash: string;
  sourceUrl: string;
  verdict: 'pass' | 'blocked';
  blockers: readonly string[];
  claimScope: string;
  evidenceFindings: readonly string[];
  contentChecks: readonly string[];
  limitations: readonly string[];
};

/**
 * Fresh audit of the exact 2026-09-09 Production snapshots. This is a new
 * artifact; the 2026-08-19 artifact remains untouched and continues to explain
 * what the predecessor releases actually assessed.
 */
export const AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT = {
  schemaVersion: 1,
  artifactId: '2026-09-09-ai-educational-preview-source-refresh-3-audit-v1',
  releaseId: AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
  policyVersion: AI_PUBLICATION_POLICY_VERSION,
  provider: 'OpenAI',
  model: 'Codex agent exact-state audit',
  modelVersion: '2026-09-09 session',
  auditedWorkspaceBaseCommit: 'f2924888889db392adcbfa83dd0d22eafd4a2c1f',
  auditStartedAt: AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_STARTED_AT,
  auditCompletedAt: AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_COMPLETED_AT,
  productionSnapshotCapturedAt: 1_788_937_050_595,
  summary: 'A fresh read-only audit re-bound the same three low-risk educational previews to their exact current Production content, evidence-link and source rows after human source-review metadata changed. The release is blocked because the early-math human review note names an unrelated UNICEF report.',
  limitations: [
    'This artifact does not represent clinician or native Myanmar-language approval of the three content items.',
    'Publisher pages can change after the recorded 2026-09-09 URL checks; runtime hashes bind the Production registry rows, not remote page bytes.',
    'The early-math evidence row currently contains a human review note that names an unrelated UNICEF report; this audit does not rely on that note as evidence approval.',
    'Already-downloaded offline content can remain readable until the device reconnects after a kill-switch withdrawal.',
  ],
  targets: [
    {
      type: 'lesson',
      slug: 'lsn_early_math',
      contentSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].contentSnapshotHash,
      evidenceLinkSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].linkSnapshotHash,
      sourceId: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].sourceSnapshot.sourceId,
      sourceUpdatedAt: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].sourceUpdatedAt,
      sourceSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].sourceSnapshotHash,
      sourceFullSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].sourceFullSnapshotHash,
      sourceUrl: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].sourceSnapshot.url,
      verdict: 'blocked',
      blockers: [
        'The frozen human review note names an unrelated UNICEF report instead of the Head Start ELOF source. Correct the source review provenance and freeze a new release generation; this release must never be staged or activated.',
      ],
      claimScope: 'Playful early mathematics concepts and learning opportunities for the allowlisted educational lesson; no developmental assessment or readiness decision.',
      evidenceFindings: [
        'The exact Production content and evidence-link hashes are unchanged from the predecessor release.',
        'The exact Production source hash is unchanged; its updatedAt changed when human review metadata was added.',
        'The official Head Start PDF retrieved on 2026-09-09 still contains the 2015 ELOF, preschool Mathematics Development and play-based learning support; it now also includes a dated 2026 cover letter.',
      ],
      contentChecks: [
        'Myanmar/English semantic parity rechecked',
        'Low-risk educational scope',
        'Claim-direct source mapping',
        'No clinical, diagnostic, treatment or urgent-safety claim',
        'AI disclosure retained in the exact content snapshot',
      ],
      limitations: [
        'Not a developmental assessment or school-readiness decision.',
        'The unrelated human review-note text is preserved in the exact full-source hash and requires separate correction.',
      ],
    },
    {
      type: 'story',
      slug: 'st_waiting_at_clinic',
      contentSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[1].contentSnapshotHash,
      evidenceLinkSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[1].linkSnapshotHash,
      sourceId: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[1].sourceSnapshot.sourceId,
      sourceUpdatedAt: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[1].sourceUpdatedAt,
      sourceSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[1].sourceSnapshotHash,
      sourceFullSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[1].sourceFullSnapshotHash,
      sourceUrl: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[1].sourceSnapshot.url,
      verdict: 'pass',
      blockers: [],
      claimScope: 'Waiting-area context and possible activities for a fictional child-at-clinic story; no promise about a particular appointment or child response.',
      evidenceFindings: [
        'The exact Production content and evidence-link hashes are unchanged from the predecessor release.',
        'The exact Production source hash is unchanged; its updatedAt changed when human education-scope approval metadata was added.',
        'The current Alder Hey page retrieved on 2026-09-09 still states that a child waits in the waiting area and that some areas may have toys or activities for younger children; it displays the stored 04/07/2023 review date.',
      ],
      contentChecks: [
        'Myanmar/English semantic parity rechecked',
        'Low-risk fictional educational scope',
        'Claim-direct waiting-area source',
        'No clinical, diagnostic, treatment or urgent-safety claim',
        'AI and fictional-story disclosures retained in the exact content snapshot',
      ],
      limitations: [
        'The story does not promise a particular clinic experience or child response.',
        'Human approval of the source is not human approval of the fictional content.',
      ],
    },
    {
      type: 'story',
      slug: 'st_first_day_school',
      contentSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[2].contentSnapshotHash,
      evidenceLinkSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[2].linkSnapshotHash,
      sourceId: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[2].sourceSnapshot.sourceId,
      sourceUpdatedAt: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[2].sourceUpdatedAt,
      sourceSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[2].sourceSnapshotHash,
      sourceFullSnapshotHash: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[2].sourceFullSnapshotHash,
      sourceUrl: AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[2].sourceSnapshot.url,
      verdict: 'pass',
      blockers: [],
      claimScope: 'First-day nervousness, welcoming adults and classmates for a fictional school-transition story; no promise about an individual child response.',
      evidenceFindings: [
        'The exact Production content and evidence-link hashes are unchanged from the predecessor release.',
        'The exact Production source hash is unchanged; its updatedAt changed when human education-scope approval metadata was added.',
        'The current Head Start page retrieved on 2026-09-09 still provides the title, reader and transcript supporting first-day nervousness, welcoming adults, classmates and settling after starting.',
      ],
      contentChecks: [
        'Myanmar/English semantic parity rechecked',
        'Low-risk fictional educational scope',
        'Claim-direct school-transition source',
        'No clinical, diagnostic, treatment or urgent-safety claim',
        'AI and fictional-story disclosures retained in the exact content snapshot',
      ],
      limitations: [
        'The story does not imply every child will feel or respond in the same way.',
        'The current rendered publisher page did not display the stored edition date or a Preschoolers label; the claim mapping does not rely on either field.',
      ],
    },
  ] satisfies readonly AiPublicationSuccessor20260909AuditTarget[],
} as const;
