export type AccountPasswordKind = 'parent' | 'staff';

export function isSixDigitPin(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function isStrongStaffPassword(value: string): boolean {
  return value.length >= 8;
}

export function validateAccountPassword(value: string, kind: AccountPasswordKind): void {
  const valid = kind === 'parent' ? isSixDigitPin(value) : isStrongStaffPassword(value);
  if (!valid) {
    throw new Error(kind === 'parent' ? 'Parent PIN must contain exactly 6 digits' : 'Staff password must contain at least 8 characters');
  }
}

// Existing accounts may still have the previous 8+ character password. They
// remain able to sign in and can switch to a six-digit parent PIN through reset.
export function isAcceptedExistingParentCredential(value: string): boolean {
  return isSixDigitPin(value) || value.length >= 8;
}
