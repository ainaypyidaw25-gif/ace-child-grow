import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { summarizeSleep, minutesToHoursLabel, type SleepSummary } from '../domain/sleep/sleep';
import { SafetyBanner } from '../components/SafetyBanner';
import { NoChild } from './Growth';

export function Sleep() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const childId = activeChild?.id as string | undefined;
  const recent = useQuery(api.sleep.list, childId ? { childId: childId as never } : 'skip');
  const addSleep = useMutation(api.sleep.add);

  const today = new Date().toISOString().slice(0, 10);
  const [bedtime, setBedtime] = useState('20:00');
  const [wake, setWake] = useState('06:00');
  const [nap, setNap] = useState('0');
  const [waking, setWaking] = useState('0');
  const [breathingPauses, setBreathingPauses] = useState(false);
  const [summary, setSummary] = useState<SleepSummary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!activeChild) return <NoChild />;

  async function saveAndSummarize() {
    setError('');
    try {
      const s = summarizeSleep({
        bedtime, wakeTime: wake,
        naps: nap ? [{ durationMinutes: Number(nap) }] : [],
        nightWakingCount: Number(waking) || 0,
        breathingPauses,
      });
      setSummary(s);
      setBusy(true);
      await addSleep({
        childId: childId as never,
        recordDate: today,
        bedtime, wakeTime: wake,
        napMinutes: Number(nap) || 0,
        nightWakingCount: Number(waking) || 0,
        breathingPauses,
      });
    } catch {
      setError('invalid');
      setSummary(null);
    } finally {
      setBusy(false);
    }
  }

  const total = summary ? minutesToHoursLabel(summary.totalSleepMinutes) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('sleep.title')} · {activeChild.nickname}</h1>

      {summary?.urgentBreathingFlag && <SafetyBanner />}

      <section className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            {t('sleep.bedtime')}
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            {t('sleep.wake')}
            <input type="time" value={wake} onChange={(e) => setWake(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            {t('sleep.naps')}
            <input inputMode="numeric" value={nap} onChange={(e) => setNap(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            {t('sleep.waking')}
            <input inputMode="numeric" value={waking} onChange={(e) => setWaking(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={breathingPauses}
            onChange={(e) => setBreathingPauses(e.target.checked)} className="h-5 w-5" />
          {locale === 'mm' ? 'အိပ်နေစဉ် အသက်ရှူရပ်တန့်မှု' : 'Breathing pauses'}
        </label>
        {error && <p className="text-sm text-state-red-deep">⚠️ {t('sleep.bedtime')} / {t('sleep.wake')}</p>}
        <button onClick={saveAndSummarize} type="button" disabled={busy}
          className="min-h-touch rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? '…' : t('sleep.add')}
        </button>
      </section>

      {summary && total && (
        <section className="rounded-card border border-line bg-mint-soft p-4">
          <p className="font-semibold text-ink">{t('sleep.total')}: {total.hours}h {total.minutes}m</p>
          <p className="text-sm text-ink-soft">
            {t('sleep.waking')}: {summary.nightWakingCount}{summary.crossesMidnight ? ' · 🌙' : ''}
          </p>
        </section>
      )}

      {recent && recent.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-ink">{locale === 'mm' ? 'မကြာသေးမီ မှတ်တမ်း' : 'Recent'}</h2>
          <ul className="space-y-2">
            {recent.slice(0, 7).map((r) => (
              <li key={r._id} className="flex justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm">
                <span>{r.recordDate}</span>
                <span className="text-ink-soft">{r.bedtime}–{r.wakeTime}{r.breathingPauses ? ' · ⚠️' : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
