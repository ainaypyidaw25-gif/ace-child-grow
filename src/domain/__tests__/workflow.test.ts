import { describe, it, expect } from 'vitest';
import {
  canTransition,
  transition,
  nextStep,
  isParentVisible,
  WorkflowError,
} from '../content/workflow';

describe('content review workflow', () => {
  it('walks the happy path to published', () => {
    let s = nextStep('draft');
    const seen = ['draft'];
    while (s) {
      seen.push(s);
      s = nextStep(s);
    }
    expect(seen).toEqual([
      'draft', 'content_review', 'translation_review', 'clinical_review', 'approved', 'published',
    ]);
  });

  it('forbids skipping the required professional-review workflow', () => {
    expect(canTransition('translation_review', 'approved')).toBe(false);
    expect(canTransition('draft', 'published')).toBe(false);
    expect(() => transition('draft', 'published')).toThrowError(WorkflowError);
  });

  it('allows rejection back one step', () => {
    expect(canTransition('clinical_review', 'translation_review')).toBe(true);
  });

  it('allows unpublish and archive', () => {
    expect(canTransition('published', 'approved')).toBe(true);
    expect(canTransition('published', 'archived')).toBe(true);
    expect(canTransition('draft', 'archived')).toBe(true);
  });

  it('only publishes state is parent-visible', () => {
    expect(isParentVisible('published')).toBe(true);
    for (const s of ['draft', 'content_review', 'translation_review', 'clinical_review', 'approved', 'archived'] as const) {
      expect(isParentVisible(s)).toBe(false);
    }
  });

  it('nextStep returns null at published', () => {
    expect(nextStep('published')).toBeNull();
  });
});
