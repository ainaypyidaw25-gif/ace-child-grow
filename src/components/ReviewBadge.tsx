import { useLocale } from '../app/LocaleContext';

/**
 * Compact "in review" marker for content not yet published. Deliberately small
 * and subtle (a tiny amber dot + short label) so it never dominates a card.
 * Specialist-risk wording is routed in the Admin CMS, not exposed here.
 */
export function ReviewBadge({ published }: { published: boolean }) {
  const { t } = useLocale();
  if (published) return null;
  return (
    <span
      title={t('review.required')}
      className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-pastel-yellow/70 px-2 py-0.5 text-[11px] font-medium text-ink-soft"
    >
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-state-yellow" />
      {t('review.short')}
    </span>
  );
}
