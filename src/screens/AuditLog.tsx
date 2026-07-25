import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

// Audit viewer — staff/super-admin only. Parents receive { allowed:false } from
// the server (never any rows), so this is not merely client-side hiding.
export function AuditLog() {
  const { locale } = useLocale();
  const data = useQuery(api.audit.list, {});
  const [filter, setFilter] = useState('');

  if (data === undefined) return <p className="text-ink-soft">…</p>;
  if (!data.allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <div aria-hidden className="text-4xl">🔒</div>
        <p className="font-semibold text-ink">
          {locale === 'mm' ? 'ဤစာမျက်နှာသို့ ဝင်ခွင့် မရှိပါ။' : 'You do not have access to this page.'}
        </p>
        <p className="text-sm text-ink-soft">
          {locale === 'mm' ? 'Audit log ကို staff/super-admin သာ ကြည့်နိုင်သည်။' : 'Audit logs are visible to staff/super-admin only.'}
        </p>
      </div>
    );
  }

  const rows = data.rows.filter((r) => !filter || r.action.includes(filter));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{locale === 'mm' ? 'စိစစ်မှတ်တမ်း (Audit Log)' : 'Audit Log'}</h1>
      <input
        value={filter} onChange={(e) => setFilter(e.target.value)}
        placeholder={locale === 'mm' ? 'လုပ်ဆောင်ချက်ဖြင့် စစ်ထုတ်ရန်' : 'Filter by action'}
        aria-label={locale === 'mm' ? 'လုပ်ဆောင်ချက်ဖြင့် စစ်ထုတ်ရန်' : 'Filter by action'}
        className="w-full rounded-pill border border-line bg-white px-4 py-2 text-sm"
      />
      {rows.length === 0 ? (
        <p className="text-ink-soft">{locale === 'mm' ? 'မှတ်တမ်း မရှိသေးပါ။' : 'No entries yet.'}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r._id} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{r.action}</span>
                <span className="text-[11px] text-ink-soft">{new Date(r._creationTime).toISOString().slice(0, 16).replace('T', ' ')}</span>
              </div>
              {(r.entityTable || r.summary) && (
                <p className="text-xs text-ink-soft">
                  {r.entityTable}{r.summary ? ` · ${r.summary}` : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
