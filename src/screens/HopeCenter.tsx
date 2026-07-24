import { useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { SAMPLE_AWARENESS, isApprovedForParents, type SeedAwarenessTopic } from '../data/seed/content';
import { ReviewBadge } from '../components/ReviewBadge';

export function HopeCenter() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState<SeedAwarenessTopic | null>(null);

  if (open) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setOpen(null)}
          className="min-h-touch rounded-pill border border-line bg-white px-4 py-2 text-sm">
          ← {t('common.back')}
        </button>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-sky-deep">
            {locale === 'mm' ? open.titleMm : open.titleEn}
          </h1>
          <ReviewBadge published={isApprovedForParents(open.reviewStatus)} />
        </div>
        <section className="rounded-card border border-line bg-white p-4">
          <h2 className="font-semibold text-mint">{t('hope.whatItMeans')}</h2>
          <p className="mt-1 text-ink-soft">{open.whatItMeansEn}</p>
        </section>
        <section className="rounded-card border border-line bg-mint-soft p-4">
          <h2 className="font-semibold text-sky-deep">{t('hope.whatItDoesNotMean')}</h2>
          <p className="mt-1 text-ink">{open.whatItDoesNotMeanEn}</p>
        </section>
        <p className="rounded-lg bg-canvas p-3 text-xs text-ink-soft">
          {t('result.disclaimer.nonDiagnostic')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('hope.title')}</h1>
      <p className="text-sm text-ink-soft">{t('hope.intro')}</p>
      <ul className="grid grid-cols-1 gap-3">
        {SAMPLE_AWARENESS.map((topic) => (
          <li key={topic.slug}>
            <button
              type="button"
              onClick={() => setOpen(topic)}
              className="flex w-full items-center justify-between rounded-card border border-line bg-white p-4 text-left shadow-card"
            >
              <span className="font-semibold text-ink">
                {locale === 'mm' ? topic.titleMm : topic.titleEn}
              </span>
              <ReviewBadge published={isApprovedForParents(topic.reviewStatus)} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
