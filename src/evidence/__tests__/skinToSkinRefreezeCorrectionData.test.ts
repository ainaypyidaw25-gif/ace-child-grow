import { describe, expect, it } from 'vitest';
import {
  SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS,
  SKIN_TO_SKIN_REFREEZE_TARGETS,
} from '../../../convex/lib/skinToSkinRefreezeCorrectionData';

describe('skin-to-skin refreeze correction data', () => {
  it('freezes exactly two consecutive revision resets and all six review lanes', () => {
    expect(SKIN_TO_SKIN_REFREEZE_TARGETS.map((target) => ({
      slug: target.slug,
      from: target.initialReviewRevision,
      to: target.desiredReviewRevision,
    }))).toEqual([
      { slug: 'act_skin_to_skin_calm', from: 2, to: 3 },
      { slug: 'gd_birth_2m_sleep', from: 3, to: 4 },
    ]);
    expect(SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS).toEqual([
      'native_myanmar',
      'english',
      'child_development',
      'evidence',
      'safety',
      'clinical',
    ]);
  });

  it('removes the unsupported at-home feeding and treatment claims', () => {
    const target = SKIN_TO_SKIN_REFREEZE_TARGETS[0];
    const serialized = JSON.stringify(target.desiredContent);
    expect(target.desiredContent.titleEn).toBe('Awake skin-to-skin closeness');
    expect(serialized).not.toContain('Feeding often becomes easier');
    expect(serialized).not.toContain('Skin-to-skin calming');
    expect(serialized).not.toContain('help your baby settle');
    expect(serialized).toContain('makes no claim that repeated at-home use improves feeding or treats distress');
  });

  it('keeps the sleep authored content exact while moving it to a fresh revision', () => {
    const target = SKIN_TO_SKIN_REFREEZE_TARGETS[1];
    expect(target.initialAuthoredSha256).toBe(target.desiredAuthoredSha256);
    expect(target.sourceIds).toHaveLength(6);
    expect(target.mediaCount).toBe(0);
    const data = target.desiredContent.data as {
      safety: { mm: string };
      observationQuestions: Array<{ mm: string }>;
      encouragement: { mm: string };
    };
    expect(data.safety.mm).toMatch(/^ကျောပေါ်လှန်အိပ်ပါ။/);
    expect(data.observationQuestions[1].mm).toBe('ကျောပေါ်လှန်၍ အိပ်ပါသလား။');
    expect(data.encouragement.mm)
      .toBe('အိပ်ရေးပုံစံသည် တဖြည်းဖြည်း တည်ငြိမ်လာမည် — သည်းခံပါ။');
  });
});
