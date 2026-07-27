export type StaffRouteDecision = 'loading' | 'allow' | 'redirect';

export function decideStaffRoute(access: { isStaff?: boolean } | null | undefined): StaffRouteDecision {
  if (access === undefined) return 'loading';
  return access?.isStaff === true ? 'allow' : 'redirect';
}
