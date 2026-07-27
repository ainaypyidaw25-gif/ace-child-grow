import { describe, expect, it } from 'vitest';
import { shouldAutoShowTour, TOUR_VERSION } from '../tour';

describe('first-login tour policy', () => {
  it('shows the parent tour after consent on home', () => {
    expect(shouldAutoShowTour({
      kind: 'parent', pathname: '/home', consentAccepted: true, isStaff: false, completedVersion: 0,
    })).toBe(true);
  });

  it('does not interrupt consent or child setup', () => {
    expect(shouldAutoShowTour({
      kind: 'parent', pathname: '/consent', consentAccepted: false, isStaff: false, completedVersion: 0,
    })).toBe(false);
  });

  it('shows the staff tour only to staff at the workspace entry', () => {
    expect(shouldAutoShowTour({
      kind: 'staff', pathname: '/admin', consentAccepted: false, isStaff: true, completedVersion: 0,
    })).toBe(true);
    expect(shouldAutoShowTour({
      kind: 'staff', pathname: '/admin', consentAccepted: false, isStaff: false, completedVersion: 0,
    })).toBe(false);
  });

  it('does not auto-show a completed version', () => {
    expect(shouldAutoShowTour({
      kind: 'parent', pathname: '/home', consentAccepted: true, isStaff: false, completedVersion: TOUR_VERSION,
    })).toBe(false);
  });
});
