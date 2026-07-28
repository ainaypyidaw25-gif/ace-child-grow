const STORAGE_KEY = 'ace_referral_code';
const CODE_PATTERN = /^ACE-[A-Z2-9]{8}$/;

export function normalizeReferralCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function captureReferralFromSearch(search: string, storage: Pick<Storage, 'setItem'>): string | null {
  const value = new URLSearchParams(search).get('ref');
  if (!value) return null;
  const code = normalizeReferralCode(value);
  if (!CODE_PATTERN.test(code)) return null;
  storage.setItem(STORAGE_KEY, code);
  return code;
}

export function pendingReferralCode(storage: Pick<Storage, 'getItem'>): string | null {
  const value = storage.getItem(STORAGE_KEY);
  if (!value) return null;
  const code = normalizeReferralCode(value);
  return CODE_PATTERN.test(code) ? code : null;
}

export function clearPendingReferralCode(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(STORAGE_KEY);
}
