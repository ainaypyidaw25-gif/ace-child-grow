import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { requiredPublicationReviews } from '../../../convex/lib/contentReviewRequirements';
import {
  BIRTH2M_GROSS_MOTOR_CAS_RELEASE_ID,
  BIRTH2M_GROSS_MOTOR_CONTENT_PREIMAGE,
  BIRTH2M_GROSS_MOTOR_DESIRED_DATA,
  BIRTH2M_GROSS_MOTOR_DESIRED_SEARCH_TEXT,
  BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_EN,
  BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_MM,
  BIRTH2M_GROSS_MOTOR_LINK_PREIMAGE,
  BIRTH2M_GROSS_MOTOR_MEDIA_PREIMAGES,
  BIRTH2M_GROSS_MOTOR_REQUIRED_REVISION_4_REVIEWS,
  BIRTH2M_GROSS_MOTOR_REVIEW_PREIMAGES,
  BIRTH2M_GROSS_MOTOR_SOURCE_PREIMAGES,
  BIRTH2M_GROSS_MOTOR_TARGET,
  isBirth2mGrossMotorCasTarget,
  isBirth2mGrossMotorCasTargetSlug,
} from '../../../convex/lib/birth2mGrossMotorCasData';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';

describe('birth-to-2-month gross-motor exact CAS data', () => {
  it('pins raw Production documents to the repo runtime canonicalizer', async () => {
    expect(BIRTH2M_GROSS_MOTOR_CAS_RELEASE_ID)
      .toBe('2026-08-22-birth-2m-gross-motor-content-evidence-v1');
    expect(await sha256Canonical(BIRTH2M_GROSS_MOTOR_CONTENT_PREIMAGE.document))
      .toBe('7ca38a070a79de2b0a46e4cf425211a0f22374637183926656275bfb7e56bc64');
    expect(await sha256Canonical(BIRTH2M_GROSS_MOTOR_LINK_PREIMAGE.document))
      .toBe('71f1bdebb390d90b98b191a5d14a457f401b45f97d2e2578a643485d5ec8704a');

    for (const expected of [
      ...BIRTH2M_GROSS_MOTOR_REVIEW_PREIMAGES,
      ...BIRTH2M_GROSS_MOTOR_SOURCE_PREIMAGES,
    ]) {
      expect(await sha256Canonical(expected.document), expected.rowId)
        .toBe(expected.exactCanonicalSha256);
    }
    expect(BIRTH2M_GROSS_MOTOR_REVIEW_PREIMAGES).toHaveLength(4);
    expect(BIRTH2M_GROSS_MOTOR_MEDIA_PREIMAGES).toEqual([]);
    expect(BIRTH2M_GROSS_MOTOR_SOURCE_PREIMAGES.map((row) => row.sourceId))
      .toEqual(BIRTH2M_GROSS_MOTOR_TARGET.desiredSourceIds);
  });

  it('keeps authored content, generated seed and evidence on the exact postimage', () => {
    const item = CONTENT_SEED.find((candidate) => (
      candidate.slug === BIRTH2M_GROSS_MOTOR_TARGET.slug
    ));
    expect(item).toBeDefined();
    expect(item?.type).toBe('milestone');
    expect(item?.titleMm).toBe(BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_MM);
    expect(item?.titleEn).toBe(BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_EN);
    expect(item?.data).toEqual(BIRTH2M_GROSS_MOTOR_DESIRED_DATA);
    expect(item?.searchText).toBe(BIRTH2M_GROSS_MOTOR_DESIRED_SEARCH_TEXT);
    expect(item?.clinicalStatus).toBe('clinical_review');

    const link = EVIDENCE_LINKS.find((candidate) => (
      candidate.kind === BIRTH2M_GROSS_MOTOR_TARGET.kind
      && candidate.slug === BIRTH2M_GROSS_MOTOR_TARGET.slug
    ));
    expect(link?.sourceIds).toEqual(BIRTH2M_GROSS_MOTOR_TARGET.desiredSourceIds);
  });

  it('starts revision 4 with all six human review dimensions outstanding', () => {
    const item = CONTENT_SEED.find((candidate) => (
      candidate.slug === BIRTH2M_GROSS_MOTOR_TARGET.slug
    ));
    expect(item).toBeDefined();
    expect(BIRTH2M_GROSS_MOTOR_REQUIRED_REVISION_4_REVIEWS).toEqual([
      'native_myanmar',
      'english',
      'child_development',
      'evidence',
      'safety',
      'clinical',
    ]);
    expect(new Set(requiredPublicationReviews(item!))).toEqual(
      new Set(BIRTH2M_GROSS_MOTOR_REQUIRED_REVISION_4_REVIEWS),
    );
    expect(BIRTH2M_GROSS_MOTOR_REVIEW_PREIMAGES.every((row) => (
      row.document.reviewRevision === 3
      && row.document.decision === 'approved'
    ))).toBe(true);
  });

  it('guards only the exact content slug and evidence key', () => {
    expect(isBirth2mGrossMotorCasTargetSlug('ms_birth_2m_gross_motor_1')).toBe(true);
    expect(isBirth2mGrossMotorCasTargetSlug('ms_birth_2m_gross_motor_2')).toBe(false);
    expect(isBirth2mGrossMotorCasTarget('milestone', 'ms_birth_2m_gross_motor_1'))
      .toBe(true);
    expect(isBirth2mGrossMotorCasTarget('guide', 'ms_birth_2m_gross_motor_1'))
      .toBe(false);
  });
});
