import type { TranslationKey } from '../i18n';

export const PRIMARY_NAV_ITEMS: ReadonlyArray<{
  to: string;
  key: TranslationKey;
  symbol: string;
}> = [
  { to: '/home', key: 'nav.home', symbol: '⌂' },
  { to: '/journey', key: 'nav.journey', symbol: '↗' },
  { to: '/activities', key: 'nav.activities', symbol: '✦' },
  { to: '/learn', key: 'nav.learn', symbol: '▤' },
  { to: '/profile', key: 'nav.profile', symbol: '○' },
] as const;
