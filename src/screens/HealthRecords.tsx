import { useState, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useAppState } from '../app/AppState';
import { useLocale } from '../app/LocaleContext';
import { NoChild } from './Growth';

type Tab = 'vaccinations' | 'health' | 'medications';
const today = () => new Date().toISOString().slice(0, 10);
const inputClass = 'mt-1 block min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink';

function optional(value: string): string | undefined {
  return value.trim() || undefined;
}

export function HealthRecords() {
  const { locale } = useLocale();
  const { activeChild } = useAppState();
  const [tab, setTab] = useState<Tab>('vaccinations');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const childId = activeChild?.id as Id<'children'> | undefined;
  const records = useQuery(api.healthRecords.listForChild, childId ? { childId } : 'skip');
  const saveHealth = useMutation(api.healthRecords.saveHealth);
  const saveVaccination = useMutation(api.healthRecords.saveVaccination);
  const saveMedication = useMutation(api.healthRecords.saveMedication);

  const [vaccineName, setVaccineName] = useState('');
  const [doseLabel, setDoseLabel] = useState('');
  const [scheduledOn, setScheduledOn] = useState(today());
  const [administeredOn, setAdministeredOn] = useState('');
  const [vaccineStatus, setVaccineStatus] = useState<'scheduled' | 'completed' | 'missed'>('scheduled');
  const [vaccineFacility, setVaccineFacility] = useState('');
  const [vaccineLot, setVaccineLot] = useState('');
  const [vaccineNotes, setVaccineNotes] = useState('');

  const [healthDate, setHealthDate] = useState(today());
  const [healthCategory, setHealthCategory] = useState<'visit' | 'illness' | 'test' | 'allergy' | 'note'>('visit');
  const [healthTitle, setHealthTitle] = useState('');
  const [healthProvider, setHealthProvider] = useState('');
  const [healthDetails, setHealthDetails] = useState('');

  const [medicineName, setMedicineName] = useState('');
  const [medicinePurpose, setMedicinePurpose] = useState('');
  const [medicineDose, setMedicineDose] = useState('');
  const [medicineFrequency, setMedicineFrequency] = useState('');
  const [medicineRoute, setMedicineRoute] = useState('');
  const [medicineStartedOn, setMedicineStartedOn] = useState(today());
  const [medicineEndedOn, setMedicineEndedOn] = useState('');
  const [medicineLastGivenAt, setMedicineLastGivenAt] = useState('');
  const [medicinePrescriber, setMedicinePrescriber] = useState('');
  const [medicineNotes, setMedicineNotes] = useState('');
  const [medicineActive, setMedicineActive] = useState(true);

  if (!activeChild || !childId) return <NoChild />;

  async function runSave(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await task();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('မှတ်တမ်းကို သိမ်း၍ မရပါ။', 'Could not save the record.'));
    } finally {
      setBusy(false);
    }
  }

  const tabs: Array<{ key: Tab; mm: string; en: string; count: number | undefined }> = [
    { key: 'vaccinations', mm: 'ကာကွယ်ဆေး', en: 'Vaccinations', count: records?.vaccinations.length },
    { key: 'health', mm: 'ကျန်းမာရေး', en: 'Health history', count: records?.health.length },
    { key: 'medications', mm: 'ဆေးမှတ်တမ်း', en: 'Medicines', count: records?.medications.length },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">{activeChild.nickname}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{L('ကျန်းမာရေးမှတ်တမ်း', 'Health records')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-soft">
          {L('ကာကွယ်ဆေးထိုးထားမှု၊ ကျန်းမာရေးတွေ့ဆုံမှုနှင့် တိုက်ကျွေးထားသောဆေးများကို မိဘကိုယ်တိုင် သိမ်းထားနိုင်ပါသည်။ ဤမှတ်တမ်းသည် ဆေးညွှန်း သို့မဟုတ် ရောဂါသတ်မှတ်ချက် မဟုတ်ပါ။', 'Keep vaccination, visit and medicine details together. These parent-entered records are not prescriptions or diagnoses.')}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-mint-soft/45 p-1.5" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => { setTab(item.key); setMessage(''); }}
            className={`min-h-touch rounded-xl px-2 py-2 text-xs font-semibold sm:text-sm ${tab === item.key ? 'bg-white text-sky-deep shadow-sm' : 'text-ink-soft'}`}
          >
            {L(item.mm, item.en)} {item.count === undefined ? '' : `(${item.count})`}
          </button>
        ))}
      </div>

      {message && <p className="rounded-2xl bg-mint-soft px-4 py-3 text-sm text-sky-deep" role="status">{message}</p>}

      {tab === 'vaccinations' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runSave(async () => {
                await saveVaccination({
                  childId,
                  vaccineName,
                  doseLabel: optional(doseLabel),
                  scheduledOn: scheduledOn || undefined,
                  administeredOn: administeredOn || undefined,
                  status: vaccineStatus,
                  facilityName: optional(vaccineFacility),
                  lotNumber: optional(vaccineLot),
                  notes: optional(vaccineNotes),
                });
                setVaccineName(''); setDoseLabel(''); setAdministeredOn(''); setVaccineFacility(''); setVaccineLot(''); setVaccineNotes('');
              }, L('ကာကွယ်ဆေးမှတ်တမ်း သိမ်းပြီးပါပြီ။', 'Vaccination record saved.'));
            }}
            className="space-y-4 rounded-[26px] border border-line bg-white p-5 shadow-card"
          >
            <h2 className="font-bold text-ink">{L('ကာကွယ်ဆေးမှတ်တမ်းအသစ်', 'New vaccination record')}</h2>
            <label className="block text-sm">{L('ကာကွယ်ဆေးအမည်', 'Vaccine name')} *<input required value={vaccineName} onChange={(event) => setVaccineName(event.target.value)} className={inputClass} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">{L('အကြိမ်/ထိုးဆေးအမှတ်', 'Dose')}<input value={doseLabel} onChange={(event) => setDoseLabel(event.target.value)} className={inputClass} placeholder={L('ဥပမာ — ဒုတိယအကြိမ်', 'e.g. Dose 2')} /></label>
              <label className="block text-sm">{L('အခြေအနေ', 'Status')}<select value={vaccineStatus} onChange={(event) => setVaccineStatus(event.target.value as typeof vaccineStatus)} className={inputClass}><option value="scheduled">{L('ထိုးရန် စီစဉ်ထား', 'Scheduled')}</option><option value="completed">{L('ထိုးပြီး', 'Completed')}</option><option value="missed">{L('မထိုးဖြစ်သေး', 'Missed')}</option></select></label>
              <label className="block text-sm">{L('ထိုးရန်ရက်', 'Scheduled date')}<input type="date" value={scheduledOn} onChange={(event) => setScheduledOn(event.target.value)} className={inputClass} /></label>
              <label className="block text-sm">{L('ထိုးပြီးသည့်ရက်', 'Administered date')}<input type="date" value={administeredOn} onChange={(event) => { setAdministeredOn(event.target.value); if (event.target.value) setVaccineStatus('completed'); }} className={inputClass} /></label>
            </div>
            <label className="block text-sm">{L('ဆေးရုံ/ဆေးခန်း', 'Facility')}<input value={vaccineFacility} onChange={(event) => setVaccineFacility(event.target.value)} className={inputClass} /></label>
            <label className="block text-sm">{L('ဆေးအတွဲနံပါတ်', 'Lot number')}<input value={vaccineLot} onChange={(event) => setVaccineLot(event.target.value)} className={inputClass} /></label>
            <label className="block text-sm">{L('မှတ်ချက်', 'Notes')}<textarea rows={3} value={vaccineNotes} onChange={(event) => setVaccineNotes(event.target.value)} className={inputClass} /></label>
            <button type="submit" disabled={busy} className="min-h-touch w-full rounded-pill bg-sky-deep px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? '…' : L('သိမ်းမည်', 'Save')}</button>
          </form>

          <RecordList empty={L('ကာကွယ်ဆေးမှတ်တမ်း မရှိသေးပါ။', 'No vaccination records yet.')} loading={records === undefined}>
            {records?.vaccinations.map((row) => (
              <li key={row._id} className="border-b border-line/70 py-4 last:border-0">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{row.vaccineName} {row.doseLabel ? `· ${row.doseLabel}` : ''}</p><p className="mt-1 text-sm text-ink-soft">{row.administeredOn ?? row.scheduledOn ?? '—'} {row.facilityName ? `· ${row.facilityName}` : ''}</p></div><StatusPill value={row.status} locale={locale} /></div>
                {row.notes && <p className="mt-2 text-sm leading-6 text-ink-soft">{row.notes}</p>}
                {row.status !== 'completed' && <button type="button" onClick={() => void runSave(() => saveVaccination({ id: row._id, childId, vaccineName: row.vaccineName, doseLabel: row.doseLabel, scheduledOn: row.scheduledOn, administeredOn: today(), status: 'completed', providerName: row.providerName, facilityName: row.facilityName, lotNumber: row.lotNumber, notes: row.notes }), L('ထိုးပြီးဟု မှတ်သားပြီးပါပြီ။', 'Marked as completed.'))} className="mt-3 text-sm font-semibold text-sky-deep underline">{L('ယနေ့ ထိုးပြီးဟု မှတ်မည်', 'Mark completed today')}</button>}
              </li>
            ))}
          </RecordList>
        </div>
      )}

      {tab === 'health' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={(event) => { event.preventDefault(); void runSave(async () => { await saveHealth({ childId, recordDate: healthDate, category: healthCategory, title: healthTitle, providerName: optional(healthProvider), details: optional(healthDetails) }); setHealthTitle(''); setHealthProvider(''); setHealthDetails(''); }, L('ကျန်းမာရေးမှတ်တမ်း သိမ်းပြီးပါပြီ။', 'Health record saved.')); }} className="space-y-4 rounded-[26px] border border-line bg-white p-5 shadow-card">
            <h2 className="font-bold text-ink">{L('ကျန်းမာရေးမှတ်တမ်းအသစ်', 'New health note')}</h2>
            <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">{L('ရက်စွဲ', 'Date')}<input type="date" required value={healthDate} onChange={(event) => setHealthDate(event.target.value)} className={inputClass} /></label><label className="block text-sm">{L('အမျိုးအစား', 'Category')}<select value={healthCategory} onChange={(event) => setHealthCategory(event.target.value as typeof healthCategory)} className={inputClass}><option value="visit">{L('ကျန်းမာရေးတွေ့ဆုံမှု', 'Visit')}</option><option value="illness">{L('ဖျားနာမှု', 'Illness')}</option><option value="test">{L('စစ်ဆေးမှု', 'Test')}</option><option value="allergy">{L('ဓာတ်မတည့်မှု', 'Allergy')}</option><option value="note">{L('အခြားမှတ်ချက်', 'Other note')}</option></select></label></div>
            <label className="block text-sm">{L('ခေါင်းစဉ်', 'Title')} *<input required value={healthTitle} onChange={(event) => setHealthTitle(event.target.value)} className={inputClass} /></label>
            <label className="block text-sm">{L('ဆရာဝန်/ကျန်းမာရေးဝန်ထမ်း', 'Provider')}<input value={healthProvider} onChange={(event) => setHealthProvider(event.target.value)} className={inputClass} /></label>
            <label className="block text-sm">{L('အသေးစိတ်မှတ်ချက်', 'Details')}<textarea rows={5} value={healthDetails} onChange={(event) => setHealthDetails(event.target.value)} className={inputClass} /></label>
            <button type="submit" disabled={busy} className="min-h-touch w-full rounded-pill bg-sky-deep px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? '…' : L('သိမ်းမည်', 'Save')}</button>
          </form>
          <RecordList empty={L('ကျန်းမာရေးမှတ်တမ်း မရှိသေးပါ။', 'No health records yet.')} loading={records === undefined}>
            {records?.health.map((row) => <li key={row._id} className="border-b border-line/70 py-4 last:border-0"><p className="text-xs font-semibold uppercase tracking-wide text-sky-deep">{row.recordDate} · {row.category}</p><p className="mt-1 font-semibold text-ink">{row.title}</p>{row.providerName && <p className="mt-1 text-sm text-ink-soft">{row.providerName}</p>}{row.details && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{row.details}</p>}</li>)}
          </RecordList>
        </div>
      )}

      {tab === 'medications' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={(event) => { event.preventDefault(); void runSave(async () => { const timestamp = medicineLastGivenAt ? new Date(medicineLastGivenAt).getTime() : undefined; await saveMedication({ childId, medicineName, purpose: optional(medicinePurpose), dose: optional(medicineDose), frequency: optional(medicineFrequency), route: optional(medicineRoute), startedOn: medicineStartedOn, endedOn: medicineEndedOn || undefined, lastGivenAt: timestamp && Number.isFinite(timestamp) ? timestamp : undefined, prescribedBy: optional(medicinePrescriber), notes: optional(medicineNotes), isActive: medicineActive }); setMedicineName(''); setMedicinePurpose(''); setMedicineDose(''); setMedicineFrequency(''); setMedicineRoute(''); setMedicineEndedOn(''); setMedicineLastGivenAt(''); setMedicinePrescriber(''); setMedicineNotes(''); }, L('ဆေးမှတ်တမ်း သိမ်းပြီးပါပြီ။', 'Medicine record saved.')); }} className="space-y-4 rounded-[26px] border border-line bg-white p-5 shadow-card">
            <h2 className="font-bold text-ink">{L('ဆေးမှတ်တမ်းအသစ်', 'New medicine record')}</h2>
            <label className="block text-sm">{L('ဆေးအမည်', 'Medicine name')} *<input required value={medicineName} onChange={(event) => setMedicineName(event.target.value)} className={inputClass} /></label>
            <label className="block text-sm">{L('တိုက်ကျွေးရသည့်အကြောင်း', 'Purpose')}<input value={medicinePurpose} onChange={(event) => setMedicinePurpose(event.target.value)} className={inputClass} /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">{L('တစ်ကြိမ်ပမာဏ', 'Dose')}<input value={medicineDose} onChange={(event) => setMedicineDose(event.target.value)} className={inputClass} placeholder={L('ဆရာဝန်ညွှန်ကြားချက်အတိုင်း', 'As prescribed')} /></label><label className="block text-sm">{L('တစ်နေ့အကြိမ်ရေ', 'Frequency')}<input value={medicineFrequency} onChange={(event) => setMedicineFrequency(event.target.value)} className={inputClass} /></label><label className="block text-sm">{L('တိုက်ကျွေးနည်း', 'Route')}<input value={medicineRoute} onChange={(event) => setMedicineRoute(event.target.value)} className={inputClass} placeholder={L('ပါးစပ်မှ/လိမ်းဆေး', 'Oral/topical')} /></label><label className="block text-sm">{L('စတင်သည့်ရက်', 'Start date')}<input type="date" required value={medicineStartedOn} onChange={(event) => setMedicineStartedOn(event.target.value)} className={inputClass} /></label><label className="block text-sm">{L('ရပ်သည့်ရက်', 'End date')}<input type="date" value={medicineEndedOn} onChange={(event) => setMedicineEndedOn(event.target.value)} className={inputClass} /></label><label className="block text-sm">{L('နောက်ဆုံးတိုက်ခဲ့ချိန်', 'Last given')}<input type="datetime-local" value={medicineLastGivenAt} onChange={(event) => setMedicineLastGivenAt(event.target.value)} className={inputClass} /></label></div>
            <label className="block text-sm">{L('ညွှန်ကြားသူ', 'Prescribed by')}<input value={medicinePrescriber} onChange={(event) => setMedicinePrescriber(event.target.value)} className={inputClass} /></label>
            <label className="block text-sm">{L('မှတ်ချက်', 'Notes')}<textarea rows={3} value={medicineNotes} onChange={(event) => setMedicineNotes(event.target.value)} className={inputClass} /></label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={medicineActive} onChange={(event) => setMedicineActive(event.target.checked)} className="h-5 w-5" />{L('လက်ရှိတိုက်ကျွေးနေဆဲ', 'Currently taking')}</label>
            <p className="rounded-xl bg-pastel-yellow/45 p-3 text-xs leading-6 text-ink-soft">{L('ဆေးပမာဏနှင့် တိုက်ကျွေးချိန်ကို ဆရာဝန် သို့မဟုတ် ဆေးဝါးပညာရှင်၏ ညွှန်ကြားချက်အတိုင်းသာ လိုက်နာပါ။', 'Follow the dose and timing given by a doctor or pharmacist.')}</p>
            <button type="submit" disabled={busy} className="min-h-touch w-full rounded-pill bg-sky-deep px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? '…' : L('သိမ်းမည်', 'Save')}</button>
          </form>
          <RecordList empty={L('ဆေးမှတ်တမ်း မရှိသေးပါ။', 'No medicine records yet.')} loading={records === undefined}>
            {records?.medications.map((row) => <li key={row._id} className="border-b border-line/70 py-4 last:border-0"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{row.medicineName}</p><p className="mt-1 text-sm text-ink-soft">{[row.dose, row.frequency, row.route].filter(Boolean).join(' · ') || '—'}</p></div><span className={`rounded-pill px-3 py-1 text-xs font-semibold ${row.isActive ? 'bg-mint-soft text-sky-deep' : 'bg-canvas text-ink-soft'}`}>{row.isActive ? L('တိုက်နေဆဲ', 'Active') : L('ရပ်ပြီး', 'Ended')}</span></div><p className="mt-2 text-xs text-ink-soft">{row.startedOn}{row.endedOn ? ` → ${row.endedOn}` : ''}{row.prescribedBy ? ` · ${row.prescribedBy}` : ''}</p>{row.purpose && <p className="mt-2 text-sm text-ink-soft">{row.purpose}</p>}{row.notes && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{row.notes}</p>}</li>)}
          </RecordList>
        </div>
      )}
    </div>
  );
}

function RecordList({ children, empty, loading }: { children: ReactNode; empty: string; loading: boolean }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="min-h-52 rounded-[26px] border border-line bg-white px-5 py-2 shadow-card">
      {loading ? <p className="py-6 text-ink-soft">…</p> : hasItems ? <ul>{children}</ul> : <p className="py-6 text-sm text-ink-soft">{empty}</p>}
    </section>
  );
}

function StatusPill({ value, locale }: { value: 'scheduled' | 'completed' | 'missed'; locale: 'mm' | 'en' }) {
  const labels = {
    scheduled: locale === 'mm' ? 'ထိုးရန်' : 'Scheduled',
    completed: locale === 'mm' ? 'ထိုးပြီး' : 'Completed',
    missed: locale === 'mm' ? 'မထိုးဖြစ်သေး' : 'Missed',
  };
  const style = value === 'completed' ? 'bg-mint-soft text-sky-deep' : value === 'missed' ? 'bg-pink/55 text-state-red' : 'bg-pastel-yellow/60 text-ink';
  return <span className={`shrink-0 rounded-pill px-3 py-1 text-xs font-semibold ${style}`}>{labels[value]}</span>;
}
