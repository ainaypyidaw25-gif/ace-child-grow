import { describe, expect, it } from 'vitest';
import { REVIEWER_MANUAL_QUEUE } from '../reviewerManualQueue';
import { REVIEWER_MANUAL_RESOLUTIONS } from '../reviewerManualResolutions';
import { filterReviewerManualQueue } from '../../screens/contentReview/ManualReviewPanel';

describe('Batch 4 manual review queue', () => {
  it('keeps all report items 78 through 90 visible without fabricating content records', () => {
    expect(REVIEWER_MANUAL_QUEUE.map((item) => item.reportItem)).toEqual([
      78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
    ]);
    expect(REVIEWER_MANUAL_QUEUE).toHaveLength(13);
    expect(REVIEWER_MANUAL_QUEUE.every((item) => item.claimId && item.suggestedMm && item.source)).toBe(true);
    expect(REVIEWER_MANUAL_QUEUE.some((item) => item.claimId === 'other_types' || item.claimId === 'safety_gaps')).toBe(false);
  });

  it('keeps the report classification separate from the owner implementation decision', () => {
    const clinical = REVIEWER_MANUAL_QUEUE.filter((item) => item.group === 'clinical_safety_gap');
    expect(clinical.map((item) => item.reportItem)).toEqual([83, 84, 85, 86, 87, 88, 89, 90]);
    expect(clinical.every((item) => item.suggestedDimensions.includes('clinical'))).toBe(true);
    expect(clinical.every((item) => item.suggestedDimensions.includes('safety'))).toBe(true);
    expect(REVIEWER_MANUAL_QUEUE.every((item) => !('decision' in item) && !('publicationStatus' in item))).toBe(true);
    expect(REVIEWER_MANUAL_RESOLUTIONS).toHaveLength(13);
    expect(REVIEWER_MANUAL_RESOLUTIONS.every((item) => item.decision === 'accepted_for_implementation')).toBe(true);
    expect(REVIEWER_MANUAL_RESOLUTIONS.every((item) => item.decidedOn === '2026-08-21')).toBe(true);
    expect(REVIEWER_MANUAL_RESOLUTIONS.every((item) => item.targets.length > 0)).toBe(true);
  });

  it('searches by report number, claim ID and Myanmar wording and filters by group', () => {
    expect(filterReviewerManualQueue(REVIEWER_MANUAL_QUEUE, 't2.sleep.pacifier', 'all').map((item) => item.reportItem)).toEqual([89]);
    expect(filterReviewerManualQueue(REVIEWER_MANUAL_QUEUE, 'ဖျားနာ', 'clinical_safety_gap').map((item) => item.reportItem)).toEqual([84, 85, 88]);
    expect(filterReviewerManualQueue(REVIEWER_MANUAL_QUEUE, '', 'content_type_summary').map((item) => item.reportItem)).toEqual([78, 79, 80, 81, 82]);
  });
});
