import { useLocale } from '../app/LocaleContext';

/**
 * Fixed urgent safety banner. Rendered from the deterministic safety engine only.
 * Never contains a fabricated phone number. Always interrupts reassuring content.
 */
export function SafetyBanner() {
  const { t } = useLocale();
  return (
    <div
      role="alert"
      className="rounded-card border-2 border-state-red bg-pink px-4 py-4 text-ink"
    >
      <p aria-hidden className="mb-1 text-2xl">⚠️</p>
      <p className="font-semibold">{t('safety.emergency')}</p>
    </div>
  );
}
