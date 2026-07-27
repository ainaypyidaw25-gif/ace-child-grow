export const TOUR_VERSION = 1;

export type TourKind = 'parent' | 'staff';

export function shouldAutoShowTour(args: {
  kind: TourKind;
  pathname: string;
  consentAccepted: boolean;
  isStaff: boolean;
  completedVersion: number;
}): boolean {
  if (args.completedVersion >= TOUR_VERSION) return false;
  if (args.kind === 'staff') return args.isStaff && args.pathname === '/admin';
  return args.consentAccepted && args.pathname === '/home';
}
