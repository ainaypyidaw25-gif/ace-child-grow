import { describe, expect, it } from 'vitest';
import { needsEvidenceAttention } from '../registryVisibility';

describe('evidence registry visibility', () => {
  it('keeps approved references out of the default attention list', () => {
    expect(needsEvidenceAttention('approved', false)).toBe(false);
  });

  it('shows records that need a decision or an overdue re-check', () => {
    expect(needsEvidenceAttention('evidence_required', false)).toBe(true);
    expect(needsEvidenceAttention('awaiting_review', false)).toBe(true);
    expect(needsEvidenceAttention('in_review', false)).toBe(true);
    expect(needsEvidenceAttention('approved', true)).toBe(true);
  });

  it('keeps retired audit records out of the working list', () => {
    expect(needsEvidenceAttention('retired', true)).toBe(false);
  });
});
