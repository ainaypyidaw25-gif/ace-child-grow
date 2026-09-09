import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

type FacilityForm = {
  country: string; region: string; township: string; name: string; facilityType: string;
  phone: string; address: string; services: string; source: string;
};

const EMPTY: FacilityForm = {
  country: 'Myanmar', region: '', township: '', name: '', facilityType: '',
  phone: '', address: '', services: '', source: '',
};

export function AdminDirectory() {
  const { locale } = useLocale();
  const data = useQuery(api.directory.adminList);
  const create = useMutation(api.directory.create);
  const update = useMutation(api.directory.update);
  const verify = useMutation(api.directory.verify);
  const deactivate = useMutation(api.directory.deactivate);
  const [form, setForm] = useState<FacilityForm>(EMPTY);
  const [editing, setEditing] = useState<Id<'healthcareFacilities'> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  if (data === undefined) return <p role="status" aria-live="polite" className="text-ink-soft">…</p>;
  if (!data.allowed) return <p className="rounded-card bg-white p-4">{L('Owner သာ စီမံနိုင်ပါသည်။', 'Only the owner can manage this directory.')}</p>;

  const field = (key: keyof FacilityForm, labelMm: string, labelEn: string, required = false) => (
    <input
      required={required}
      value={form[key]}
      onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))}
      placeholder={L(labelMm, labelEn)}
      aria-label={L(labelMm, labelEn)}
      className="w-full rounded-lg border border-line px-3 py-2 text-sm"
    />
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-sky-deep">{L('ကျောင်းနှင့် ဝန်ဆောင်မှု စီမံခန့်ခွဲမှု', 'School and service directory')}</h1>
        <p className="text-sm text-ink-soft">{L('Owner ကသာ ထည့်၊ ပြင်၊ အတည်ပြုနှင့် ပိတ်နိုင်ပါသည်။ ပြင်ဆင်ပြီးတိုင်း ပြန်လည်အတည်ပြုရန် လိုပြီး၊ အတည်ပြုချက်သည် ၆ လ သက်တမ်းရှိပါသည်။', 'Only the owner can add, edit, verify, or deactivate entries. Every edit requires re-verification; verification lasts six months.')}</p>
      </div>

      <form
        className="space-y-2 rounded-card border border-line bg-white p-4 shadow-card"
        onSubmit={async (event) => {
          event.preventDefault(); setBusy(true); setMessage('');
          const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || undefined])) as Record<string, string | undefined>;
          try {
            if (editing) await update({ id: editing, ...payload } as Parameters<typeof update>[0]);
            else await create(payload as Parameters<typeof create>[0]);
            setForm(EMPTY); setEditing(null);
            setMessage(L('သိမ်းပြီးပါပြီ။ မိဘများ မြင်တွေ့နိုင်ရန် “စစ်ဆေးအတည်ပြုပြီး ထုတ်ဝေမည်” ကို နှိပ်ပါ။', 'Saved. Select Verify before parents can see it.'));
          } catch (error) { console.error(error); setMessage(L('သိမ်း၍ မရပါ။', 'Unable to save.')); }
          finally { setBusy(false); }
        }}
      >
        <h2 className="font-semibold">{editing ? L('အချက်အလက် ပြင်ရန်', 'Edit entry') : L('အသစ်ထည့်ရန်', 'Add entry')}</h2>
        {field('name', 'ကျောင်း/အဖွဲ့အစည်းအမည်', 'School or organization name', true)}
        <div className="grid gap-2 sm:grid-cols-2">{field('country', 'နိုင်ငံ', 'Country', true)}{field('region', 'တိုင်း/ပြည်နယ်', 'Region/State')}</div>
        <div className="grid gap-2 sm:grid-cols-2">{field('township', 'မြို့နယ်', 'Township')}{field('facilityType', 'ဝန်ဆောင်မှုအမျိုးအစား', 'Service type')}</div>
        {field('phone', 'ဖုန်းနံပါတ်', 'Phone', true)}
        {field('address', 'လိပ်စာ', 'Address', true)}
        {field('services', 'ဝန်ဆောင်မှုများ', 'Services')}
        {field('source', 'အချက်အလက်ရင်းမြစ် URL', 'Source URL', true)}
        <div className="flex gap-2">
          <button disabled={busy} className="rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50">{busy ? '…' : L('သိမ်းမည်', 'Save')}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="rounded-pill border border-line px-4 py-2">{L('မပြင်တော့ပါ', 'Cancel')}</button>}
        </div>
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      </form>

      <ul className="space-y-3">
        {data.rows.map((row) => (
          <li key={row._id} className="rounded-card border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{row.name}</p><p className="text-xs text-ink-soft">{row.phone || L('ဖုန်းမရှိ', 'No phone')} · {row.isActive ? L('ဖော်ပြထား', 'Visible') : L('မဖော်ပြထား', 'Hidden')}</p></div>
              <span className={`rounded-pill px-2 py-1 text-xs ${row.isActive ? 'bg-mint-soft text-mint-deep' : 'bg-pastel-yellow text-ink'}`}>{row.isActive ? '✓' : '—'}</span>
            </div>
            {row.nextVerificationAt && <p className="mt-1 text-xs text-ink-soft">{L('နောက်ဆုံးပြန်စစ်ရန်', 'Reverify by')}: {new Date(row.nextVerificationAt).toISOString().slice(0, 10)}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => {
                setEditing(row._id);
                setForm({ country: row.country, region: row.region ?? '', township: row.township ?? '', name: row.name, facilityType: row.facilityType ?? '', phone: row.phone ?? '', address: row.address ?? '', services: row.services ?? '', source: row.source ?? '' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="rounded-pill border border-line px-3 py-1 text-sm">{L('ပြင်မည်', 'Edit')}</button>
              {!row.isActive ? <button type="button" onClick={() => void verify({ id: row._id })} className="rounded-pill bg-mint px-3 py-1 text-sm font-semibold text-white">{L('စစ်ဆေးအတည်ပြုပြီး ထုတ်ဝေမည်', 'Verify and publish')}</button>
                : <button type="button" onClick={() => void deactivate({ id: row._id })} className="rounded-pill border border-state-red px-3 py-1 text-sm text-state-red-deep">{L('ပိတ်ထားမည်', 'Deactivate')}</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
