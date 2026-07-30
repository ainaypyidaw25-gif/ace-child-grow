import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppState } from '../app/AppState';
import { useLocale } from '../app/LocaleContext';
import { PremiumGate } from '../components/PremiumGate';
import { NoChild } from './Growth';
import { isFeatureAvailableOnCurrentPlatform } from '../app/platform';

function toLocalInput(timestamp: number): string {
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function Appointments() {
  const { locale } = useLocale();
  const { activeChild } = useAppState();
  const subscription = useQuery(api.subscriptions.mine);
  const enabled = isFeatureAvailableOnCurrentPlatform(subscription?.features ?? [], 'appointments');
  const rows = useQuery(
    api.appointments.listMine,
    activeChild && enabled ? { childId: activeChild.id as never } : 'skip',
  );
  const add = useMutation(api.appointments.add);
  const setStatus = useMutation(api.appointments.setStatus);
  const [title, setTitle] = useState('');
  const [providerName, setProviderName] = useState('');
  const [appointmentAt, setAppointmentAt] = useState(toLocalInput(Date.now() + 86_400_000));
  const [questions, setQuestions] = useState('');
  const [remind, setRemind] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  if (!activeChild) return <NoChild />;
  if (subscription === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (!enabled) return <PremiumGate feature="appointments"><span /></PremiumGate>;

  async function save() {
    const timestamp = new Date(appointmentAt).getTime();
    if (!title.trim() || !Number.isFinite(timestamp)) {
      setMessage(L('ခေါင်းစဉ်နှင့် ရက်ချိန်ကို ဖြည့်ပါ။', 'Enter a title and date.'));
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await add({
        childId: activeChild!.id as never,
        title: title.trim(),
        providerName: providerName.trim() || undefined,
        appointmentAt: timestamp,
        questions: questions.trim() || undefined,
        reminderAt: remind ? timestamp - 24 * 60 * 60 * 1000 : undefined,
      });
      setTitle('');
      setProviderName('');
      setQuestions('');
      setMessage(L('ချိန်းဆိုမှုကို သိမ်းပြီးပါပြီ။', 'Appointment saved.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('သိမ်း၍ မရပါ။', 'Could not save.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PremiumGate feature="appointments">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">ACE Premium</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">{L('ချိန်းဆိုမှုနှင့် မေးခွန်းများ', 'Appointments & questions')}</h1>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            {L(`${activeChild.nickname} အတွက် ဆရာဝန်၊ ဆရာမ သို့မဟုတ် ပညာရှင်နှင့် တွေ့ဆုံမည့်အချိန်ကို မှတ်ထားပါ။`, `Keep ${activeChild.nickname}’s doctor, teacher, or specialist visits together.`)}
          </p>
        </header>

        <section className="grid gap-4 rounded-[28px] border border-line bg-white p-5 shadow-card sm:grid-cols-2">
          <label className="text-sm font-medium">
            {L('ချိန်းဆိုမှုအကြောင်း', 'Appointment')}
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-3" placeholder={L('ဥပမာ — ကလေးဆရာဝန်နှင့် တွေ့ရန်', 'e.g. Pediatric visit')} />
          </label>
          <label className="text-sm font-medium">
            {L('တွေ့ဆုံမည့်သူ', 'Provider')}
            <input value={providerName} onChange={(event) => setProviderName(event.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-3" />
          </label>
          <label className="text-sm font-medium">
            {L('ရက်နှင့် အချိန်', 'Date & time')}
            <input type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-3" />
          </label>
          <label className="flex items-end gap-3 rounded-xl bg-canvas px-3 py-3 text-sm">
            <input type="checkbox" checked={remind} onChange={(event) => setRemind(event.target.checked)} className="h-5 w-5" />
            {L('တစ်ရက်ကြို သတိပေးရန်', 'Remind me one day before')}
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {L('မေးလိုသည့်အချက်များ', 'Questions to ask')}
            <textarea value={questions} onChange={(event) => setQuestions(event.target.value)} rows={3} className="mt-1 block w-full rounded-xl border border-line px-3 py-3" placeholder={L('မေးခွန်းတစ်ခုစီကို စာကြောင်းတစ်ကြောင်းစီ ရေးပါ။', 'Write one question per line.')} />
          </label>
          <button type="button" onClick={() => void save()} disabled={busy} className="min-h-touch rounded-pill bg-sky-deep px-6 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2">
            {busy ? '…' : L('ချိန်းဆိုမှု သိမ်းမည်', 'Save appointment')}
          </button>
          {message && <p className="text-sm text-ink-soft sm:col-span-2" role="status">{message}</p>}
        </section>

        <section>
          <h2 className="font-bold text-ink">{L('ချိန်းဆိုမှုမှတ်တမ်း', 'Your appointments')}</h2>
          {rows === undefined ? <p className="mt-3 text-ink-soft">…</p> : rows.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-canvas p-4 text-sm text-ink-soft">{L('ချိန်းဆိုမှု မရှိသေးပါ။', 'No appointments yet.')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-white">
              {rows.map((row) => (
                <li key={row._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{row.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{new Date(row.appointmentAt).toLocaleString(locale === 'mm' ? 'my-MM' : 'en-GB')} {row.providerName ? `· ${row.providerName}` : ''}</p>
                  </div>
                  <button type="button" disabled={row.status === 'completed'} onClick={() => void setStatus({ id: row._id, status: 'completed' })} className="rounded-pill border border-sky/30 px-4 py-2 text-sm font-semibold text-sky-deep disabled:opacity-50">
                    {row.status === 'completed' ? L('ပြီးပါပြီ', 'Completed') : L('ပြီးပြီဟု မှတ်မည်', 'Mark complete')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PremiumGate>
  );
}
