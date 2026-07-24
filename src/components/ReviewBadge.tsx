import { useLocale } from '../app/LocaleContext';

/** Shows "Clinical Review Required" for any content not yet published. */
export function ReviewBadge({ published }: { published: boolean }) {
  const { t } = useLocale();
  if (published) return null;
  return (
    <span className="inline-block rounded-pill bg-pastel-yellow px-3 py-1 text-xs font-medium text-ink">
      {t('review.required')}
    </span>
  );
}
