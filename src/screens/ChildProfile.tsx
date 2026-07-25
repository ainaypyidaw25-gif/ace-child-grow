import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { ageLabels } from '../domain/age/ageLabel';
import { chronologicalAge } from '../domain/age/age';
import { NoChild } from './Growth';

// Dedicated child profile — separate from parent account settings.
// Aggregates the child's records; never exposes sensitive notes in shared views.
export function ChildProfile() {
  const { t, locale } = useLocale();
  const { activeChild, dispatch } = useAppState();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);

  const childId = activeChild?.id as string | undefined;
  const growth = useQuery(api.growth.list, childId ? { childId: childId as never } : 'skip');
  const sleep = useQuery(api.sleep.list, childId ? { childId: childId as never } : 'skip');
  const sessions = useQuery(api.milestones.listSessions, childId ? { childId: childId as never } : 'skip');

  if (!activeChild) return <NoChild />;

  const labels = ageLabels(new Date(activeChild.birthDate), new Date(), locale, {
    gestationalWeeks: activeChild.gestationalWeeks,
    useCorrected: activeChild.useCorrectedAge,
  });
  const chrono = chronologicalAge(new Date(activeChild.birthDate), new Date());
  const latest = sessions && sessions.length > 0 ? sessions[0] : null;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{activeChild.nickname}</h1>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <Row label={locale === 'mm' ? 'မွေးနေ့' : 'Date of birth'} value={activeChild.birthDate} />
        <Row label={locale === 'mm' ? 'အသက် (ပြက္ခဒိန်)' : 'Chronological age'} value={labels.chronological} />
        {labels.corrected && (
          <Row label={locale === 'mm' ? 'ပြင်ဆင်အသက်' : 'Corrected age'} value={labels.corrected} />
        )}
        {activeChild.gestationalWeeks && (
          <Row label={locale === 'mm' ? 'ကိုယ်ဝန်သက်တမ်း' : 'Gestational age'} value={`${activeChild.gestationalWeeks} wks`} />
        )}
        <Row label={locale === 'mm' ? 'အသက် (လ)' : 'Age (months)'} value={String(chrono.totalMonths)} />
      </section>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-1 font-semibold text-ink">{locale === 'mm' ? 'အနှစ်ချုပ်' : 'Summary'}</h2>
        <Row label={t('growth.title')} value={growth ? `${growth.length} ${locale === 'mm' ? 'ခု' : 'records'}` : '…'} />
        <Row label={t('sleep.title')} value={sleep ? `${sleep.length} ${locale === 'mm' ? 'ခု' : 'records'}` : '…'} />
        <Row
          label={locale === 'mm' ? 'နောက်ဆုံး ပြန်လည်သုံးသပ်မှု' : 'Latest review'}
          value={latest ? (latest.resultState ?? '—') : (locale === 'mm' ? 'မရှိသေး' : 'None')}
        />
      </section>

      <div className="flex gap-2">
        <Link to="/edit-child" role="button"
          className="min-h-touch flex-1 rounded-pill bg-sky px-5 py-2 text-center font-semibold text-white">
          {locale === 'mm' ? 'ပြင်ရန်' : 'Edit'}
        </Link>
        <Link to="/report" role="button"
          className="min-h-touch flex-1 rounded-pill border border-line px-5 py-2 text-center">
          {t('report.title')}
        </Link>
      </div>

      <button type="button" onClick={() => setConfirm(true)}
        className="w-full rounded-pill border border-state-red px-4 py-2 text-left text-state-red">
        🗑️ {locale === 'mm' ? 'ဤကလေးကို ဖျက်ရန်' : 'Delete this child'}
      </button>

      {confirm && (
        <div role="dialog" aria-modal className="rounded-card border-2 border-state-red bg-pink/40 p-4">
          <p className="font-semibold">
            {locale === 'mm' ? 'ဤကလေး၏ မှတ်တမ်းများ ဖျက်မှာ သေချာပါသလား။' : "Delete this child's records?"}
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setConfirm(false)}
              className="rounded-pill border border-line px-4 py-2">{t('common.cancel')}</button>
            <button type="button"
              onClick={() => { dispatch({ type: 'delete_child', id: activeChild.id }); navigate('/profile'); }}
              className="rounded-pill bg-state-red px-4 py-2 font-semibold text-white">{t('common.confirm')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
