import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

// Verified-data-only directory. Shows ONLY active + verified facilities.
// When none exist, shows the mandated Myanmar notice — never invented data.
export function HealthcareDirectory() {
  const { t, locale } = useLocale();
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const facilities = useQuery(api.directory.listPublic, {
    region: region || undefined,
    facilityType: type || undefined,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ကျန်းမာရေး ဝန်ဆောင်မှု လမ်းညွှန်' : 'Healthcare Directory'}
      </h1>

      <div className="flex flex-wrap gap-2">
        <input
          value={region} onChange={(e) => setRegion(e.target.value)}
          placeholder={locale === 'mm' ? 'တိုင်း/ပြည်နယ်' : 'Region/State'}
          className="flex-1 rounded-pill border border-line bg-white px-4 py-2 text-sm"
        />
        <input
          value={type} onChange={(e) => setType(e.target.value)}
          placeholder={locale === 'mm' ? 'အမျိုးအစား' : 'Facility type'}
          className="flex-1 rounded-pill border border-line bg-white px-4 py-2 text-sm"
        />
      </div>

      {facilities === undefined ? (
        <p className="text-ink-soft">…</p>
      ) : facilities.length === 0 ? (
        <p className="rounded-card bg-pastel-yellow/50 p-4 text-sm text-ink">{t('directory.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {facilities.map((f) => (
            <li key={f._id} className="rounded-card border border-line bg-white p-4 shadow-card">
              <p className="font-semibold text-ink">{f.name}</p>
              {f.facilityType && <p className="text-xs text-ink-soft">{f.facilityType}</p>}
              {f.address && <p className="mt-1 text-sm text-ink-soft">📍 {f.address}</p>}
              {f.phone && <p className="text-sm text-ink-soft">📞 {f.phone}</p>}
              {f.services && <p className="mt-1 text-xs text-ink-soft">{f.services}</p>}
              <p className="mt-2 text-[11px] text-ink-soft">
                {f.source && `${locale === 'mm' ? 'ရင်းမြစ်' : 'Source'}: ${f.source} · `}
                {f.lastVerifiedAt
                  ? `${locale === 'mm' ? 'အတည်ပြုသည့်ရက်' : 'Verified'}: ${new Date(f.lastVerifiedAt).toISOString().slice(0, 10)}`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
