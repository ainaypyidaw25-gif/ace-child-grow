import { describe, expect, it } from 'vitest';
import {
  gdBirth2mEmotionalAuditAfterJson,
  gdBirth2mEmotionalAuditBeforeJson,
} from '../../../convex/gdBirth2mEmotionalCas';
import {
  unicefSeenCountedAuditAfterJson,
  unicefSeenCountedAuditBeforeJson,
} from '../../../convex/unicefSeenCountedMetadataCas';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS,
  isEvidenceHumanReviewSuccessorContentSlug,
  isEvidenceHumanReviewSuccessorSourceId,
  isEvidenceHumanReviewSuccessorTarget,
  NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC,
  UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_SPEC,
} from '../../../convex/lib/evidenceHumanReviewSuccessorCasData';

function priorAuditDocument(
  spec: typeof NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC
    | typeof UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_SPEC,
) {
  if (spec === NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC) {
    return {
      _id: spec.priorRelease.rowId,
      _creationTime: spec.priorRelease.creationTime,
      action: spec.priorRelease.action,
      entityTable: 'libraryContent,evidenceLinks,evidenceSources',
      summary: spec.priorRelease.releaseId,
      result: 'ok',
      before: gdBirth2mEmotionalAuditBeforeJson(),
      after: gdBirth2mEmotionalAuditAfterJson({
        updatedAt: 1_787_509_568_107,
        contentHash: spec.targets[0].content.exactCanonicalSha256,
        linkHash: spec.targets[0].link.exactCanonicalSha256,
        sourceHash: spec.stagedSource.exactCanonicalSha256,
        sourceRowId: spec.stagedSource.rowId,
        sourceCreationTime: spec.stagedSource.creationTime,
      }),
    };
  }
  return {
    _id: spec.priorRelease.rowId,
    _creationTime: spec.priorRelease.creationTime,
    action: spec.priorRelease.action,
    entityTable: 'evidenceSources',
    summary: spec.priorRelease.releaseId,
    result: 'ok',
    before: unicefSeenCountedAuditBeforeJson(),
    after: unicefSeenCountedAuditAfterJson(
      1_787_509_679_606,
      spec.stagedSource.exactCanonicalSha256,
    ),
  };
}

describe('human-review successor frozen Production data', () => {
  it('regenerates every full-document hash carried by the two contracts', async () => {
    for (const spec of EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS) {
      expect(await sha256Canonical(spec.stagedSource.document))
        .toBe(spec.stagedSource.exactCanonicalSha256);
      for (const source of spec.supportingSources) {
        expect(await sha256Canonical(source.document))
          .toBe(source.exactCanonicalSha256);
      }
      for (const target of spec.targets) {
        for (const row of [
          target.content,
          target.link,
          ...target.reviews,
          ...target.media,
        ]) {
          expect(row.document).toBeDefined();
          expect(await sha256Canonical(row.document))
            .toBe(row.exactCanonicalSha256);
        }
      }
      expect(await sha256Canonical(priorAuditDocument(spec)))
        .toBe(spec.priorRelease.exactCanonicalSha256);
    }
  });

  it('freezes complete linked-source unions and exact reverse dependencies', () => {
    for (const spec of EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS) {
      const frozenSourceIds = new Set([
        spec.sourceId,
        ...spec.supportingSources.map((source) => source.sourceId),
      ]);
      const linkedSourceIds = new Set(spec.targets.flatMap((target) => {
        const document = target.link.document as { sourceIds: string[] };
        return document.sourceIds;
      }));
      expect(frozenSourceIds).toEqual(linkedSourceIds);
      expect(spec.reverseDependencyKeys).toEqual(
        spec.targets.map((target) => `${target.kind}:${target.slug}`).sort(),
      );
    }
  });

  it('keeps the two release units independent and compile-time protected', () => {
    const [nhs, unicef] = EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS;
    expect(nhs.releaseId).not.toBe(unicef.releaseId);
    expect(nhs.sourceId).not.toBe(unicef.sourceId);
    expect(nhs.targets).toHaveLength(1);
    expect(unicef.targets).toHaveLength(2);
    for (const spec of EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS) {
      expect(isEvidenceHumanReviewSuccessorSourceId(spec.sourceId)).toBe(true);
      for (const target of spec.targets) {
        expect(isEvidenceHumanReviewSuccessorTarget(target.kind, target.slug)).toBe(true);
        expect(isEvidenceHumanReviewSuccessorContentSlug(target.slug)).toBe(true);
      }
    }
    expect(isEvidenceHumanReviewSuccessorSourceId('who-nurturing-care-2018'))
      .toBe(false);
    expect(isEvidenceHumanReviewSuccessorTarget('guide', 'gd_3_4m_sleep'))
      .toBe(false);
  });
});
