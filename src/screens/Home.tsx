import { Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <h2 className="mb-2 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function Home() {
  const { t } = useLocale();
  const plans = [
    { label: t('home.morning'), emoji: '🌅' },
    { label: t('home.afternoon'), emoji: '☀️' },
    { label: t('home.evening'), emoji: '🌙' },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-card bg-mint-soft p-5">
        <p className="text-ink-soft">{t('home.greeting')} 👋</p>
        <p className="mt-1 text-lg font-bold text-sky-deep">{t('app.tagline')}</p>
      </div>

      <Card title={t('home.todayPlan')}>
        <ul className="space-y-2">
          {plans.map((p) => (
            <li
              key={p.label}
              className="flex min-h-touch items-center gap-3 rounded-xl bg-canvas px-3 py-2"
            >
              <span aria-hidden className="text-xl">{p.emoji}</span>
              <span>{p.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('home.snapshot')}>
        <Link to="/journey" role="button" className="inline-block rounded-pill bg-sky px-5 py-2 font-medium text-white">
          {t('nav.journey')} →
        </Link>
      </Card>

      <Card title={t('home.parentTip')}>
        <p className="text-ink-soft">{t('result.consult.green')}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[
          { to: '/growth', label: t('growth.title'), emoji: '📏' },
          { to: '/sleep', label: t('sleep.title'), emoji: '😴' },
          { to: '/hope', label: t('hope.title'), emoji: '💛' },
          { to: '/report', label: t('report.title'), emoji: '📄' },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            role="button"
            className="flex min-h-touch flex-col items-start gap-1 rounded-card border border-line bg-white p-4 shadow-card"
          >
            <span aria-hidden className="text-xl">{q.emoji}</span>
            <span className="text-sm font-medium text-ink">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
