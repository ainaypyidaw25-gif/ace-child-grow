import { describe, it, expect } from 'vitest';
import {
  ACUTE_URGENT_SYMPTOMS,
  evaluateSafety,
  EMERGENCY_MESSAGE,
  URGENT_SYMPTOMS,
} from '../safety/safety';

describe('urgent safety engine', () => {
  it('exposes every fixed urgent symptom except skill loss as an acute UI option', () => {
    expect(ACUTE_URGENT_SYMPTOMS).toEqual(
      URGENT_SYMPTOMS.filter((symptom) => symptom !== 'loss_of_acquired_skills'),
    );
  });

  it('is not urgent with no symptoms and no skill loss', () => {
    const r = evaluateSafety({ confirmedSymptoms: [], lostSkill: false });
    expect(r.urgent).toBe(false);
    expect(r.message).toBeUndefined();
    expect(r.triggers).toEqual([]);
  });

  it.each(ACUTE_URGENT_SYMPTOMS)(
    'fires on the fixed acute symptom %s and returns the fixed message',
    (symptom) => {
      const r = evaluateSafety({ confirmedSymptoms: [symptom], lostSkill: false });
      expect(r.urgent).toBe(true);
      expect(r.message).toEqual(EMERGENCY_MESSAGE);
      expect(r.triggers).toEqual([symptom]);
    },
  );

  it('treats skill loss as an urgent trigger and saves the concern', () => {
    const r = evaluateSafety({ confirmedSymptoms: [], lostSkill: true });
    expect(r.urgent).toBe(true);
    expect(r.triggers).toContain('loss_of_acquired_skills');
    expect(r.saveSkillLossConcern).toBe(true);
  });

  it('ignores unknown symptom strings (defensive)', () => {
    const r = evaluateSafety({
      // @ts-expect-error testing runtime robustness against bad input
      confirmedSymptoms: ['made_up_symptom'],
      lostSkill: false,
    });
    expect(r.urgent).toBe(false);
  });

  it('never fabricates a phone number', () => {
    const r = evaluateSafety({ confirmedSymptoms: ['blue_lips'], lostSkill: false });
    expect(r.message?.mm).not.toMatch(/\d{3,}/); // no digit runs (no phone numbers)
    expect(r.message?.en).not.toMatch(/\d{3,}/);
  });
});
