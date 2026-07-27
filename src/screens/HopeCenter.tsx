import { useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { SAMPLE_AWARENESS, isApprovedForParents, type SeedAwarenessTopic } from '../data/seed/content';
import { ReviewBadge } from '../components/ReviewBadge';
import { ReviewOngoingNotice } from '../components/StaffPreviewGate';

const TOPIC_SYMBOLS: Record<string, string> = {
  'autism-spectrum': '◇',
  'speech-language-delay': '◌',
  adhd: '✦',
  'hearing-loss': '◖',
  'cerebral-palsy': '↗',
};

export function HopeCenter() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState<SeedAwarenessTopic | null>(null);
  if (open) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <ReviewOngoingNotice />
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-sky-deep"
        >
          ← {t('common.back')}
        </button>

        <article className="overflow-hidden rounded-[30px] border border-line bg-white shadow-card">
          <header className="border-b border-line bg-cream px-5 py-7 sm:px-8 sm:py-9">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mint-soft text-2xl text-sky-deep">
                {TOPIC_SYMBOLS[open.slug] ?? '○'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-deep">
                  {locale === 'mm' ? 'နားလည်မှုနှင့် အားပေးကူညီမှု' : 'Understand and support'}
                </p>
                <h1 className="mt-2 text-2xl font-bold leading-relaxed text-ink sm:text-3xl">
                  {locale === 'mm' ? open.titleMm : open.titleEn}
                </h1>
              </div>
              <div className="hidden sm:block">
                <ReviewBadge published={isApprovedForParents(open.reviewStatus)} />
              </div>
            </div>
          </header>

          <div className="divide-y divide-line px-5 sm:px-8">
            <section className="py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-deep">01</p>
              <h2 className="mt-1 text-lg font-bold text-ink">{t('hope.whatItMeans')}</h2>
              <p className="mt-3 max-w-3xl text-ink-soft">
                {locale === 'mm' ? open.whatItMeansMm : open.whatItMeansEn}
              </p>
            </section>
            <section className="py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-deep">02</p>
              <h2 className="mt-1 text-lg font-bold text-ink">{t('hope.whatItDoesNotMean')}</h2>
              <p className="mt-3 max-w-3xl text-ink-soft">
                {locale === 'mm' ? open.whatItDoesNotMeanMm : open.whatItDoesNotMeanEn}
              </p>
            </section>
          </div>

          <footer className="bg-mint-soft/70 px-5 py-5 text-sm text-ink sm:px-8">
            <strong>{locale === 'mm' ? 'မှတ်ထားရန် — ' : 'Remember — '}</strong>
            {t('result.disclaimer.nonDiagnostic')}
          </footer>
        </article>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <ReviewOngoingNotice />
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-deep">
          {locale === 'mm' ? 'စောစီးစွာ နားလည်၊ သင့်တော်စွာ ကူညီ' : 'Understand early, support well'}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-relaxed text-ink sm:text-3xl">{t('hope.title')}</h1>
        <p className="mt-2 text-ink-soft">{t('hope.intro')}</p>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-mint/30 bg-mint-soft px-4 py-3 text-sm text-ink">
        <span aria-hidden className="mt-0.5 text-sky-deep">✓</span>
        <p>
          {locale === 'mm'
            ? 'အကြောင်းအရာများကို ပညာရှင်သုံးသပ်မှုနှင့် ကိုးကားချက်များဖြင့် စီမံထားပြီး ရောဂါသတ်မှတ်ရန် မဟုတ်ပါ။'
            : 'These topics are managed with professional review and references. They are not diagnostic tools.'}
        </p>
      </div>

      <ul className="grid overflow-hidden rounded-[30px] border border-line bg-white shadow-card sm:grid-cols-2">
        {SAMPLE_AWARENESS.map((topic, index) => (
          <li
            key={topic.slug}
            className={`${index > 0 ? 'border-t border-line' : ''} sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l`}
          >
            <button
              type="button"
              onClick={() => setOpen(topic)}
              className="group flex min-h-[118px] w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-mint-soft/45"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-canvas text-xl text-sky-deep">
                {TOPIC_SYMBOLS[topic.slug] ?? '○'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-relaxed text-ink">
                  {locale === 'mm' ? topic.titleMm : topic.titleEn}
                </span>
                <span className="mt-1 block text-xs text-ink-soft">
                  {locale === 'mm' ? 'ဘာကိုဆိုလိုပြီး ဘယ်လိုနားလည်ရမလဲ' : 'What it means and how to understand it'}
                </span>
              </span>
              <span className="text-sky-deep transition-transform group-hover:translate-x-1">→</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
