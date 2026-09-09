import { describe, expect, it } from 'vitest';
import { relatedContent, sourcesForContent } from '../links';
import { SOURCE_BY_ID } from '../sources';

describe('bounded AI source-audit lane', () => {
  it('uses claim-direct current sources for everyday early math', () => {
    expect(sourcesForContent('lsn_early_math', 'lesson')).toEqual([
      'us-hhs-head-start-elof-2015',
    ]);
    expect(sourcesForContent('lsn_early_math', 'lesson')).not.toContain(
      'tb-handbook-ecse-2016',
    );
    expect(SOURCE_BY_ID.get('aap-power-of-play-2018')).toMatchObject({
      url: 'https://publications.aap.org/pediatrics/article/142/3/e20182058/38649/The-Power-of-Play-A-Pediatric-Role-in-Enhancing',
      edition: 'Pediatrics 142(3):e20182058; reaffirmed January 2025',
      authors:
        'Yogman M, Garner A, Hutchinson J, Hirsh-Pasek K, Golinkoff RM; Committee on Psychosocial Aspects of Child and Family Health; Council on Communications and Media',
      evidenceLevel: 'expert_consensus',
      topics: expect.arrayContaining(['cognitive', 'school_readiness']),
      ageMonthsMin: 0,
      ageMonthsMax: 72,
      verifiedOn: '2026-08-19',
      reviewStatus: 'awaiting_review',
    });
    expect(SOURCE_BY_ID.get('us-hhs-head-start-elof-2015')).toMatchObject({
      url: 'https://headstart.gov/sites/default/files/pdf/elof-ohs-framework.pdf',
      title: 'Head Start Early Learning Outcomes Framework: Ages Birth to Five',
      year: 2015,
      evidenceLevel: 'expert_consensus',
      topics: expect.arrayContaining(['cognitive', 'school_readiness']),
      ageMonthsMin: 0,
      ageMonthsMax: 60,
      verifiedOn: '2026-08-19',
      reviewStatus: 'awaiting_review',
    });
  });

  it('uses outpatient waiting-area guidance instead of a baby-review schedule', () => {
    expect(sourcesForContent('st_waiting_at_clinic', 'story')).toEqual([
      'nhs-alder-hey-outpatient-2023',
    ]);
    expect(SOURCE_BY_ID.get('nhs-alder-hey-outpatient-2023')).toMatchObject({
      org: "Alder Hey Children's NHS Foundation Trust",
      title: 'What to expect at an outpatient appointment',
      year: 2023,
      edition: 'Page last reviewed: 04/07/2023',
      evidenceLevel: 'parent_education',
      verifiedOn: '2026-08-19',
      reviewStatus: 'awaiting_review',
    });
    expect(relatedContent('nhs-alder-hey-outpatient-2023').story).toEqual([
      'st_waiting_at_clinic',
    ]);
  });

  it('uses preschool first-day transition guidance without generic textbook links', () => {
    expect(sourcesForContent('st_first_day_school', 'story')).toEqual([
      'us-hhs-head-start-first-day-jitters-2024',
    ]);
    expect(SOURCE_BY_ID.get('us-hhs-head-start-first-day-jitters-2024')).toMatchObject({
      orgKey: 'GOV',
      title: 'First Day Jitters',
      year: 2024,
      edition: 'Last Updated: September 26, 2024',
      evidenceLevel: 'parent_education',
      ageMonthsMin: 36,
      ageMonthsMax: 60,
      verifiedOn: '2026-08-19',
      reviewStatus: 'awaiting_review',
    });
    expect(relatedContent('us-hhs-head-start-first-day-jitters-2024').story).toEqual([
      'st_first_day_school',
    ]);
  });
});
