import { useLocale } from '../app/LocaleContext';

/**
 * Honest "not yet available" screen for routes that are part of the roadmap but
 * not implemented in this foundation build. We never show fake success states.
 */
export function Placeholder({ titleKey, note }: { titleKey?: undefined; note: string }) {
  const { t } = useLocale();
  void titleKey;
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <div aria-hidden className="text-4xl">🚧</div>
      <p className="font-semibold text-ink">{note}</p>
      <p className="text-sm text-ink-soft">{t('review.required')}</p>
    </div>
  );
}
