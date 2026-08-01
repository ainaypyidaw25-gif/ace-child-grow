import { describe, expect, it } from 'vitest';
import {
  isAcceptedExistingParentCredential,
  hasLikelyWebPrefixInEmail,
  isSixDigitPin,
  isStrongStaffPassword,
  isValidEmailInput,
  validateAccountPassword,
} from '../auth/passwordPolicy';

describe('account credential policy', () => {
  it('requires exactly six numeric digits for a new parent PIN', () => {
    expect(isSixDigitPin('123456')).toBe(true);
    expect(isSixDigitPin('12345')).toBe(false);
    expect(isSixDigitPin('12345a')).toBe(false);
    expect(() => validateAccountPassword('123456', 'parent')).not.toThrow();
    expect(() => validateAccountPassword('password', 'parent')).toThrow();
  });

  it('keeps staff passwords at eight or more characters', () => {
    expect(isStrongStaffPassword('secure88')).toBe(true);
    expect(isStrongStaffPassword('123456')).toBe(false);
  });

  it('does not lock out parents who already use the former password format', () => {
    expect(isAcceptedExistingParentCredential('123456')).toBe(true);
    expect(isAcceptedExistingParentCredential('old-pass')).toBe(true);
    expect(isAcceptedExistingParentCredential('12345')).toBe(false);
  });

  it('validates email readiness and warns without rewriting a likely web prefix', () => {
    expect(isValidEmailInput(' parent@example.com ')).toBe(true);
    expect(isValidEmailInput('parent@example')).toBe(false);
    expect(hasLikelyWebPrefixInEmail('www.parent@example.com')).toBe(true);
    expect(hasLikelyWebPrefixInEmail('parent@example.com')).toBe(false);
  });
});
