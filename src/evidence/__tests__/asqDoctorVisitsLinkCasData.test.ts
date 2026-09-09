import { describe, expect, it } from 'vitest';
import {
  ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID,
  ASQ_DOCTOR_VISITS_MEDIA_PREIMAGES,
  ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES,
  ASQ_DOCTOR_VISITS_SOURCE_ID,
  ASQ_DOCTOR_VISITS_SOURCE_PREIMAGES,
  ASQ_DOCTOR_VISITS_TARGET,
  isAsqDoctorVisitsLinkCasTarget,
} from '../../../convex/lib/asqDoctorVisitsLinkCasData';
import { EVIDENCE_LINKS } from '../links';

describe('ASQ doctor-visits exact CAS data', () => {
  it('freezes the unique content, link, media and review preimages', () => {
    expect(ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID)
      .toBe('2026-08-21-asq-doctor-visits-scope-unlink-v1');
    expect(ASQ_DOCTOR_VISITS_TARGET).toMatchObject({
      kind: 'lesson',
      slug: 'lsn_doctor_visits',
      contentId: 'kx7atdfkr5bh08yb9n7naxhz3h8b97h4',
      contentInitialReviewRevision: 3,
      contentDesiredReviewRevision: 4,
      linkId: 'k9751x50x9kzyqx0kj17bs7w6x8b9jcr',
    });
    expect(ASQ_DOCTOR_VISITS_MEDIA_PREIMAGES).toHaveLength(1);
    expect(ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES).toHaveLength(1);
    expect(ASQ_DOCTOR_VISITS_SOURCE_PREIMAGES).toHaveLength(8);
    expect(new Set(ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES.map(
      (row) => row.rowId,
    )).size).toBe(1);
  });

  it('removes only the scope-mismatched ASQ validation study', () => {
    expect(ASQ_DOCTOR_VISITS_TARGET.initialSourceIds)
      .toContain(ASQ_DOCTOR_VISITS_SOURCE_ID);
    expect(ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds)
      .toEqual([
        'tb-bright-futures-4e-2017',
        'nhs-baby-reviews-2023',
        'cdc-monitoring-screening-2026',
        'nhs-vaccinations-2023',
        'cdc-immunization-schedule-2025',
        'who-ia2030-2020',
        'myanmar-nsp-newborn-child-2015',
      ]);
    expect(ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds)
      .not.toContain(ASQ_DOCTOR_VISITS_SOURCE_ID);

    const link = EVIDENCE_LINKS.find((candidate) => candidate.kind === 'lesson'
      && candidate.slug === ASQ_DOCTOR_VISITS_TARGET.slug);
    expect(link?.sourceIds).toEqual(ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds);
  });

  it('guards only the exact kind and slug at the generic import boundary', () => {
    expect(isAsqDoctorVisitsLinkCasTarget('lesson', 'lsn_doctor_visits'))
      .toBe(true);
    expect(isAsqDoctorVisitsLinkCasTarget('guide', 'lsn_doctor_visits'))
      .toBe(false);
    expect(isAsqDoctorVisitsLinkCasTarget('lesson', 'not-a-target'))
      .toBe(false);
  });
});
