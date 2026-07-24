import { useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { toKg, toCm, round, type WeightUnit, type LengthUnit } from '../domain/growth/units';

interface GrowthRow {
  date: string;
  weightKg?: number;
  heightCm?: number;
}

export function Growth() {
  const { t } = useLocale();
  const [rows, setRows] = useState<GrowthRow[]>([]);
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [wUnit, setWUnit] = useState<WeightUnit>('kg');
  const [height, setHeight] = useState('');
  const [lUnit, setLUnit] = useState<LengthUnit>('cm');
  const [error, setError] = useState('');

  function add() {
    setError('');
    if (!date) {
      setError('date');
      return;
    }
    try {
      const row: GrowthRow = { date };
      if (weight) row.weightKg = round(toKg(Number(weight), wUnit), 3);
      if (height) row.heightCm = round(toCm(Number(height), lUnit), 2);
      setRows((r) => [...r, row].sort((a, b) => a.date.localeCompare(b.date)));
      setWeight('');
      setHeight('');
    } catch {
      setError('value');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('growth.title')}</h1>
      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-xs text-ink">
        {t('growth.who.pending')}
      </p>

      <section className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card">
        <label className="block text-sm">
          {t('growth.date')}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {t('growth.weight')}
          <div className="mt-1 flex gap-2">
            <input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="block w-full rounded-lg border border-line px-3 py-2"
            />
            <select value={wUnit} onChange={(e) => setWUnit(e.target.value as WeightUnit)}
              className="rounded-lg border border-line px-2">
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </label>
        <label className="block text-sm">
          {t('growth.height')}
          <div className="mt-1 flex gap-2">
            <input
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="block w-full rounded-lg border border-line px-3 py-2"
            />
            <select value={lUnit} onChange={(e) => setLUnit(e.target.value as LengthUnit)}
              className="rounded-lg border border-line px-2">
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        </label>
        {error && <p className="text-sm text-state-red">⚠️ {error === 'date' ? t('growth.date') : t('growth.weight')}</p>}
        <button onClick={add} type="button"
          className="min-h-touch rounded-pill bg-sky px-5 py-2 font-semibold text-white">
          {t('growth.add')}
        </button>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-ink">{t('growth.history')}</h2>
        {rows.length === 0 ? (
          <p className="text-ink-soft">{t('common.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={i} className="flex justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm">
                <span>{r.date}</span>
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
