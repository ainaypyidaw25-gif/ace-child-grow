import { useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { summarizeSleep, minutesToHoursLabel, type SleepSummary } from '../domain/sleep/sleep';
import { SafetyBanner } from '../components/SafetyBanner';

export function Sleep() {
  const { t, locale } = useLocale();
  const [bedtime, setBedtime] = useState('20:00');
  const [wake, setWake] = useState('06:00');
  const [nap, setNap] = useState('0');
  const [waking, setWaking] = useState('0');
  const [breathingPauses, setBreathingPauses] = useState(false);
  const [summary, setSummary] = useState<SleepSummary | null>(null);
  const [error, setError] = useState('');

  function compute() {
    setError('');
    try {
      const s = summarizeSleep({
        bedtime,
        wakeTime: wake,
        naps: nap ? [{ durationMinutes: Number(nap) }] : [],
        nightWakingCount: Number(waking) || 0,
        breathingPauses,
      });
      setSummary(s);
    } catch {
      setError('invalid');
      setSummary(null);
    }
  }

  const total = summary ? minutesToHoursLabel(summary.totalSleepMinutes) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('sleep.title')}</h1>

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
          {locale === 'mm' ? 'အသက်ရှူ ရပ်တန့်မှု' : 'Breathing pauses'}
        </label>
        {error && <p className="text-sm text-state-red">⚠️ {t('sleep.bedtime')} / {t('sleep.wake')}</p>}
        <button onClick={compute} type="button"
          className="min-h-touch rounded-pill bg-sky px-5 py-2 font-semibold text-white">
          {t('sleep.add')}
        </button>
      </section>

      {summary && total && (
        <section className="rounded-card border border-line bg-mint-soft p-4">
          <p className="font-semibold text-ink">
            {t('sleep.total')}: {total.hours}h {total.minutes}m
          </p>
          <p className="text-sm text-ink-soft">
            {t('sleep.waking')}: {summary.nightWakingCount}
            {summary.crossesMidnight ? ' · 🌙' : ''}
          </p>
        </section>
      )}
    </div>
  );
}
