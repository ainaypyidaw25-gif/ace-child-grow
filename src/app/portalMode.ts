export type PortalMode = 'parent' | 'staff';

const PORTAL_MODE_KEY = 'ace-portal-mode';
const LEGACY_STAFF_DESTINATION_KEY = 'ace-login-destination';

export function getPortalMode(): PortalMode {
  const savedMode = localStorage.getItem(PORTAL_MODE_KEY);
  if (savedMode === 'staff' || savedMode === 'parent') return savedMode;

  // Preserve the intent of users who selected the staff portal before this
  // durable portal preference was introduced.
  return localStorage.getItem(LEGACY_STAFF_DESTINATION_KEY) === 'staff' ? 'staff' : 'parent';
}

export function setPortalMode(mode: PortalMode) {
  localStorage.setItem(PORTAL_MODE_KEY, mode);
  localStorage.removeItem(LEGACY_STAFF_DESTINATION_KEY);
}

export function clearPortalMode() {
  localStorage.removeItem(PORTAL_MODE_KEY);
  localStorage.removeItem(LEGACY_STAFF_DESTINATION_KEY);
}
