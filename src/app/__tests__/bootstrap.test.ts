import { describe, it, expect } from 'vitest';
import { decideRoute, isDuplicateChild } from '../bootstrap';

// Regression suite for the P1 login/child-bootstrap bug: a returning user with a
// child must land on Home and must NOT be asked to add a child again — and the
// guard must never act on a still-loading query.

describe('decideRoute — login/child bootstrap', () => {
  it('shows a loader while queries are unresolved (never redirects mid-load)', () => {
    // Even if hasChild/consent look "false", an unready state must not redirect.
    expect(decideRoute({ ready: false, consentAccepted: false, hasChild: false })).toBe('loading');
    expect(decideRoute({ ready: false, consentAccepted: true, hasChild: true })).toBe('loading');
  });

  it('existing user with a child lands on Home', () => {
    expect(decideRoute({ ready: true, consentAccepted: true, hasChild: true })).toBe('home');
  });

  it('existing child but (somehow) missing consent still goes Home, not re-onboarding', () => {
    expect(decideRoute({ ready: true, consentAccepted: false, hasChild: true })).toBe('home');
  });

  it('consented user with zero children goes to Add Child', () => {
    expect(decideRoute({ ready: true, consentAccepted: true, hasChild: false })).toBe('add-child');
  });

  it('brand-new user (no consent, no child) sees the Welcome intro', () => {
    expect(decideRoute({ ready: true, consentAccepted: false, hasChild: false })).toBe('welcome');
  });

  it('the exact reported scenario: sign in with an existing child → Home', () => {
    // Simulates the post-login resolved state for a returning parent.
    const route = decideRoute({ ready: true, consentAccepted: true, hasChild: true });
    expect(route).toBe('home');
    expect(route).not.toBe('add-child');
    expect(route).not.toBe('welcome');
  });
});

describe('isDuplicateChild — accidental duplicate prevention', () => {
  const kids = [
    { nickname: 'Phyo', birthDate: '2024-06-25' },
    { nickname: 'Mimi', birthDate: '2022-01-10' },
  ];

  it('flags same nickname + same birth date (accidental repeat)', () => {
    expect(isDuplicateChild(kids, 'Phyo', '2024-06-25')).toBe(true);
    expect(isDuplicateChild(kids, '  phyo ', '2024-06-25')).toBe(true); // trim + case-insensitive
  });

  it('allows a sibling with same name but different birth date', () => {
    expect(isDuplicateChild(kids, 'Phyo', '2020-03-03')).toBe(false);
  });

  it('allows a sibling with same birth date but different name (e.g. twins)', () => {
    expect(isDuplicateChild(kids, 'Phyo2', '2024-06-25')).toBe(false);
  });

  it('never flags on empty input or an empty list', () => {
    expect(isDuplicateChild(kids, '', '2024-06-25')).toBe(false);
    expect(isDuplicateChild(kids, 'Phyo', '')).toBe(false);
    expect(isDuplicateChild([], 'Phyo', '2024-06-25')).toBe(false);
  });
});
