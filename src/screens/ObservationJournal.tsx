import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NoChild } from './Growth';

type Category = 'behavior' | 'development' | 'health' | 'other';

const CATEGORIES: Category[] = ['behavior', 'development', 'health', 'other'];

export function ObservationJournal() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const childId = activeChild?.id as string | undefined;
  const rows = useQuery(api.observations.list, childId ? { childId: childId as never } : 'skip');
  const addObservation = useMutation(api.observations.add);
  const removeObservation = useMutation(api.observations.remove);

  const [date, setDate] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (!activeChild) return <NoChild />;

  const categoryLabel = (value: Category) =>
    t(`journal.category.${value}` as `journal.category.${Category}`);

  async function add() {
    setError('');
    setMessage('');
    if (!date) { setError('date'); return; }
    if (new Date(date) > new Date()) { setError('future'); return; }
    if (!note.trim()) { setError('note'); return; }
    try {
      setBusy(true);
      await addObservation({
        childId: childId as never,
        observedOn: date,
        category: category || undefined,
        note: note.trim(),
      });
      setNote('');
      setCategory('');
    } catch {
      setError('note');
    } finally {
      setBusy(false);
    }
  }

  const errText =
    error === 'date' ? t('journal.date')
    : error === 'future' ? L('မှတ်တမ်းရက်ကို ယနေ့ရက်ထက် နောက်ကျ၍ မသတ်မှတ်နိုင်ပါ။', 'Date is in the future')
    : t('journal.note');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('journal.title')} · {activeChild.nickname}</h1>
      <p className="text-sm text-ink-soft">{t('journal.subtitle')}</p>

      <section className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card">
        <label className="block text-sm">
          {t('journal.date')}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t('journal.category')}
          <select value={category} onChange={(e) => setCategory(e.target.value as Category | '')}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2">
            <option value="">{t('journal.category.unset')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          {t('journal.note')}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder={t('journal.placeholder')}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
        </label>
        {error && <p className="text-sm text-state-red-deep">⚠️ {errText}</p>}
        {message && <p className="text-sm text-state-red-deep">{message}</p>}
        <button onClick={add} type="button" disabled={busy}
          className="min-h-touch rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? '…' : t('journal.add')}
        </button>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-ink">{t('journal.history')}</h2>
        {rows === undefined ? (
          <p className="text-ink-soft">…</p>
        ) : rows.length === 0 ? (
          <p className="text-ink-soft">{t('common.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r._id} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-ink">{r.observedOn}</span>
                    {r.category && (
                      <span className="ml-2 rounded-pill bg-mint-soft px-2 py-0.5 text-xs text-sky-deep">
                        {categoryLabel(r.category)}
                      </span>
                    )}
                    <p className="mt-1 whitespace-pre-wrap text-ink-soft">{r.note}</p>
                  </div>
                  <button type="button" onClick={() => setConfirmRemoveId(r._id)}
                    className="min-h-touch shrink-0 text-xs font-semibold text-state-red-deep">
                    {t('journal.removeLabel')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmRemoveId && (
        <ConfirmDialog
          message={t('journal.removeConfirm')}
          cancelLabel={L('မလုပ်တော့ပါ', 'Cancel')}
          confirmLabel={t('journal.removeLabel')}
          onCancel={() => setConfirmRemoveId(null)}
          onConfirm={async () => {
            const id = confirmRemoveId as Id<'observations'>;
            setConfirmRemoveId(null);
            try {
              await removeObservation({ id });
            } catch (error) {
              console.error(error);
              setMessage(t('journal.removeError'));
            }
          }}
        />
      )}
    </div>
  );
}
