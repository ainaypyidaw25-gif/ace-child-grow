import { Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';

export function Welcome() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <div aria-hidden className="text-6xl">🌱</div>
      <div>
        <h1 className="text-xl font-bold text-sky-deep">{t('app.name')}</h1>
        <p className="mt-1 text-ink-soft">{t('app.tagline')}</p>
      </div>
      <Link
        to="/home"
        role="button"
        className="rounded-pill bg-sky px-6 py-3 font-semibold text-white shadow-card"
      >
        {t('home.cta.start')}
      </Link>
      <p className="max-w-xs text-sm text-ink-soft">{t('result.disclaimer.nonDiagnostic')}</p>
    </div>
  );
}
