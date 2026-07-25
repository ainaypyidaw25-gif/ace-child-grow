import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { toKg, toCm, round, type WeightUnit, type LengthUnit } from '../domain/growth/units';

export function Growth() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const childId = activeChild?.id as string | undefined;
  const rows = useQuery(api.growth.list, childId ? { childId: childId as never } : 'skip');
  const addRecord = useMutation(api.growth.add);

  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [wUnit, setWUnit] = useState<WeightUnit>('kg');
  const [height, setHeight] = useState('');
  const [lUnit, setLUnit] = useState<LengthUnit>('cm');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!activeChild) return <NoChild />;

  async function add() {
    setError('');
    if (!date) { setError('date'); return; }
    if (new Date(date) > new Date()) { setError('future'); return; }
    try {
      setBusy(true);
      await addRecord({
        childId: childId as never,
        measuredOn: date,
        weightKg: weight ? round(toKg(Number(weight), wUnit), 3) : undefined,
        heightCm: height ? round(toCm(Number(height), lUnit), 2) : undefined,
        inputWeightUnit: weight ? wUnit : undefined,
        inputLengthUnit: height ? lUnit : undefined,
      });
      setWeight(''); setHeight('');
    } catch {
      setError('value');
    } finally {
      setBusy(false);
    }
  }

  const errText =
    error === 'date' ? t('growth.date')
    : error === 'future' ? (locale === 'mm' ? 'ရက်စွဲ အနာဂတ်ဖြစ်နေသည်' : 'Date is in the future')
    : t('growth.weight');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('growth.title')} · {activeChild.nickname}</h1>
      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-xs text-ink">{t('growth.who.pending')}</p>

      <section className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card">
        <label className="block text-sm">
          {t('growth.date')}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t('growth.weight')}
          <div className="mt-1 flex gap-2">
            <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)}
              className="block w-full rounded-lg border border-line px-3 py-2" />
            <select value={wUnit} onChange={(e) => setWUnit(e.target.value as WeightUnit)}
              aria-label={locale === 'mm' ? 'အလေးချိန် ယူနစ်' : 'Weight unit'}
              className="rounded-lg border border-line px-2">
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </label>
        <label className="block text-sm">
          {t('growth.height')}
          <div className="mt-1 flex gap-2">
            <input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)}
              className="block w-full rounded-lg border border-line px-3 py-2" />
            <select value={lUnit} onChange={(e) => setLUnit(e.target.value as LengthUnit)}
              aria-label={locale === 'mm' ? 'အရပ် ယူနစ်' : 'Height unit'}
              className="rounded-lg border border-line px-2">
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        </label>
        {error && <p className="text-sm text-state-red">⚠️ {errText}</p>}
        <button onClick={add} type="button" disabled={busy}
          className="min-h-touch rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? '…' : t('growth.add')}
        </button>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-ink">{t('growth.history')}</h2>
        {rows === undefined ? (
          <p className="text-ink-soft">…</p>
        ) : rows.length === 0 ? (
          <p className="text-ink-soft">{t('common.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r._id} className="flex justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm">
                <span>{r.measuredOn}</span>
                <span className="text-ink-soft">
                  {r.weightKg != null && `${r.weightKg} kg`} {r.heightCm != null && `· ${r.heightCm} cm`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Shown when there is no active child to attach records to. */
export function NoChild() {
  const { locale } = useLocale();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <div aria-hidden className="text-4xl">🌱</div>
      <p className="text-ink-soft">
        {locale === 'mm' ? 'ဤအင်္ဂါရပ်ကို သုံးရန် ကလေးတစ်ဦး အရင်ထည့်ပါ။' : 'Add a child first to use this feature.'}
      </p>
      <Link to="/add-child" role="button" className="rounded-pill bg-sky px-5 py-2 font-semibold text-white">
        {locale === 'mm' ? 'ကလေး ထည့်ရန်' : 'Add child'}
      </Link>
    </div>
  );
}
