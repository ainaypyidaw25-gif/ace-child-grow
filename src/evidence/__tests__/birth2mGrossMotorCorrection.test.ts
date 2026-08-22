import { describe, expect, it } from 'vitest';
import {
  BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET,
  isBirth2mGrossMotorCorrectionLink,
  isBirth2mGrossMotorCorrectionSlug,
  isBirth2mGrossMotorCorrectionSource,
} from '../../../convex/lib/birth2mGrossMotorCorrection';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';
import { SOURCE_BY_ID } from '../sources';

describe('birth-to-2-month gross-motor correction proposal', () => {
  it('keeps the authored copy on the direct CDC observation and safe-sleep scope', () => {
    const item = CONTENT_SEED.find((candidate) => (
      candidate.slug === BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.slug
    ));
    expect(item).toBeDefined();
    expect(item?.type).toBe('milestone');
    expect(item?.clinicalStatus).toBe('clinical_review');
    expect(item?.data).toMatchObject({
      observeEn: 'Briefly lifts the head during awake, supervised tummy time?',
      whyEn: 'Lifting the head during awake tummy time is an observation on the CDC 2-month checklist.',
      encouragementEn: expect.stringContaining('Place the baby on the back for sleep.'),
      evidenceSummary: expect.stringContaining('exact CDC 2-month checklist'),
      editorialStatus: 'reference_verified',
    });
    expect(String(item?.data.redEn)).toContain('not a pass/fail test or a diagnosis');
    expect(String(item?.data.redMm)).toContain('အောင်/မအောင် စစ်ဆေးချက်');
  });

  it('uses only the exact age page and direct safe-sleep source', () => {
    const link = EVIDENCE_LINKS.find((candidate) => (
      candidate.kind === BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.kind
      && candidate.slug === BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.slug
    ));
    expect(link?.sourceIds).toEqual([
      'cdc-milestones-2m-2026',
      'aap-safe-sleep-2022',
    ]);
    expect(link?.sourceIds).not.toContain('cdc-milestones-2026');
    expect(link?.sourceIds).not.toContain('jr-who-motor-windows-2006');
    expect(link?.sourceIds).not.toContain('tb-campbell-pt-6e-2022');
  });

  it('stores the exact CDC page as awaiting human review metadata', () => {
    const source = SOURCE_BY_ID.get(BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.exactSourceId);
    expect(source).toMatchObject({
      id: 'cdc-milestones-2m-2026',
      title: 'Milestones by 2 Months',
      url: 'https://www.cdc.gov/act-early/milestones/2-months.html',
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewDate: null,
      verifiedOn: '2026-08-22',
      ageMonthsMin: 2,
      ageMonthsMax: 2,
    });
    expect(source?.verifiedNote).toContain('holding the head up when on the tummy');
    expect(source?.verifiedNote).toContain('not a diagnostic or pass/fail standard');
  });

  it('guards only the exact source, content slug, and evidence key', () => {
    expect(isBirth2mGrossMotorCorrectionSlug('ms_birth_2m_gross_motor_1')).toBe(true);
    expect(isBirth2mGrossMotorCorrectionSlug('ms_birth_2m_gross_motor_2')).toBe(false);
    expect(isBirth2mGrossMotorCorrectionLink('milestone', 'ms_birth_2m_gross_motor_1'))
      .toBe(true);
    expect(isBirth2mGrossMotorCorrectionLink('guide', 'ms_birth_2m_gross_motor_1'))
      .toBe(false);
    expect(isBirth2mGrossMotorCorrectionSource('cdc-milestones-2m-2026')).toBe(true);
    expect(isBirth2mGrossMotorCorrectionSource('cdc-milestones-2026')).toBe(false);
  });
});
