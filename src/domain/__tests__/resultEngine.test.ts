import { describe, it, expect } from 'vitest';
import { computeResult, type MilestoneResponseInput } from '../rules/resultEngine';

const noSafety = { confirmedSymptoms: [], lostSkill: false };
const resp = (
  answer: MilestoneResponseInput['answer'],
  repeatedConcern = false,
): MilestoneResponseInput => ({
  milestoneId: Math.random().toString(36).slice(2),
  domain: 'gross_motor',
  answer,
  repeatedConcern,
});

describe('rule-based result engine', () => {
  it('is always non-diagnostic', () => {
    const r = computeResult([resp('yes')], noSafety);
    expect(r.isDiagnostic).toBe(false);
  });

  it('returns GREEN when skills broadly align', () => {
    const r = computeResult(
      [resp('yes'), resp('yes'), resp('yes'), resp('yes'), resp('sometimes')],
      noSafety,
    );
    expect(r.state).toBe('green');
    expect(r.repeatReviewDays).toBe(90);
  });

  it('returns YELLOW when some skills are emerging', () => {
    // 5 answered, one not_yet -> ratio 0.2 -> yellow
    const r = computeResult(
      [resp('yes'), resp('yes'), resp('yes'), resp('yes'), resp('not_yet')],
      noSafety,
    );
    expect(r.state).toBe('yellow');
  });

  it('returns ORANGE when concern ratio is high', () => {
    const r = computeResult(
      [resp('not_yet'), resp('not_yet'), resp('yes'), resp('yes'), resp('yes')],
      noSafety,
    );
    expect(r.state).toBe('orange');
  });

  it('returns ORANGE on repeated concerns even at low ratio', () => {
    const many = Array.from({ length: 20 }, () => resp('yes'));
    many.push(resp('not_yet', true), resp('sometimes', true));
    const r = computeResult(many, noSafety);
    expect(r.state).toBe('orange');
  });

  it('RED overrides everything when a safety rule fires', () => {
    const r = computeResult([resp('yes'), resp('yes'), resp('yes')], {
      confirmedSymptoms: ['unresponsiveness'],
      lostSkill: false,
    });
    expect(r.state).toBe('red');
    expect(r.safety.urgent).toBe(true);
  });

  it('skill loss alone prompts professional assessment without an emergency result', () => {
    const r = computeResult([resp('yes'), resp('yes')], {
      confirmedSymptoms: [],
      lostSkill: true,
    });
    expect(r.state).toBe('orange');
    expect(r.safety.urgent).toBe(false);
    expect(r.safety.message).toBeUndefined();
    expect(r.safety.professionalAssessmentRecommended).toBe(true);
  });

  it('acute emergency signs remain RED when skill loss is also reported', () => {
    const r = computeResult([resp('yes'), resp('yes')], {
      confirmedSymptoms: ['seizure'],
      lostSkill: true,
    });
    expect(r.state).toBe('red');
    expect(r.safety.urgent).toBe(true);
    expect(r.safety.professionalAssessmentRecommended).toBe(true);
  });

  it('treats "not_sure" as neutral (excluded from ratio)', () => {
    const r = computeResult(
      [resp('yes'), resp('yes'), resp('yes'), resp('yes'), resp('not_sure')],
      noSafety,
    );
    expect(r.breakdown.notSure).toBe(1);
    expect(r.state).toBe('green');
  });

  it('never exposes any numeric disease score', () => {
    const r = computeResult([resp('not_yet')], noSafety);
    expect(Object.keys(r)).not.toContain('score');
    expect(Object.keys(r)).not.toContain('probability');
    expect(Object.keys(r)).not.toContain('percentage');
    expect(Object.keys(r.breakdown)).not.toContain('concernRatio');
    expect(r.isDiagnostic).toBe(false);
  });

  it('treats custom ratios as non-diagnostic presentation grouping only', () => {
    const r = computeResult(
      [resp('yes'), resp('not_yet')],
      noSafety,
      { yellowConcernRatio: 0.9, orangeConcernRatio: 1, repeatedConcernsForOrange: 3 },
    );
    expect(r.state).toBe('green');
    expect(r.isDiagnostic).toBe(false);
    expect(Object.keys(r.breakdown)).not.toContain('concernRatio');
  });
});
