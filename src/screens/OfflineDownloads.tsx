import { useMemo, useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { useOnlineStatus } from '../app/useOnlineStatus';
import { buildOfflineManifest, formatBytes, type OfflineItem } from '../domain/offline/manifest';
import { SAMPLE_LESSONS, SAMPLE_AWARENESS, isApprovedForParents } from '../data/seed/content';

export function OfflineDownloads() {
  const { t, locale } = useLocale();
  const online = useOnlineStatus();
  const [wifiOnly, setWifiOnly] = useState(true);

  // Only PUBLIC (published) content is downloadable. Seed content is all under
  // clinical review, so the manifest is honestly empty until content is approved.
  const candidates: OfflineItem[] = useMemo(
    () => [
      ...SAMPLE_LESSONS.map((l, i) => ({
        id: `lesson-${i}`, kind: 'lesson' as const,
        title: locale === 'mm' ? l.titleMm : l.titleEn,
        bytes: 40_000, isPublic: isApprovedForParents(l.reviewStatus),
      })),
      ...SAMPLE_AWARENESS.map((a) => ({
        id: `awareness-${a.slug}`, kind: 'awareness' as const,
        title: locale === 'mm' ? a.titleMm : a.titleEn,
        bytes: 60_000, isPublic: isApprovedForParents(a.reviewStatus),
      })),
    ],
    [locale],
  );

  const manifest = useMemo(() => buildOfflineManifest(candidates), [candidates]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sky-deep">
          {locale === 'mm' ? 'အော့ဖ်လိုင်း ဒေါင်းလုဒ်များ' : 'Offline downloads'}
        </h1>
        <span className={`rounded-pill px-3 py-1 text-xs ${online ? 'bg-mint-soft text-mint' : 'bg-pastel-orange text-ink'}`}>
          {online ? `🟢 ${t('common.online')}` : `⚪ ${t('common.offline')}`}
        </span>
      </div>

      <section className="space-y-2 rounded-card border border-line bg-white p-4 shadow-card">
        <label className="flex items-center justify-between">
          <span>{locale === 'mm' ? 'Wi-Fi ဖြင့်သာ ဒေါင်းလုဒ်' : 'Download on Wi-Fi only'}</span>
          <input type="checkbox" checked={wifiOnly} onChange={(e) => setWifiOnly(e.target.checked)}
            className="h-5 w-5" />
        </label>
        <p className="text-sm text-ink-soft">
          {locale === 'mm' ? 'သိမ်းဆည်းမှု' : 'Storage used'}: {formatBytes(manifest.totalBytes)} · {manifest.count} {locale === 'mm' ? 'ခု' : 'items'}
        </p>
      </section>

      {manifest.count === 0 ? (
        <p className="rounded-card bg-pastel-yellow/60 p-4 text-sm text-ink">
          {locale === 'mm'
            ? 'အတည်ပြုပြီး (published) ပညာပေးအကြောင်းအရာ မရှိသေးသဖြင့် ဒေါင်းလုဒ်ရန် မရနိုင်သေးပါ။ ကလေး၏ ကိုယ်ရေးမှတ်တမ်းများကို အော့ဖ်လိုင်း cache တွင် ဘယ်တော့မှ မသိမ်းပါ။'
            : 'No published educational content is available to download yet. Private child records are never stored in the offline cache.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {manifest.items.map((i) => (
            <li key={i.id} className="flex justify-between rounded-xl border border-line bg-white px-3 py-2 text-sm">
              <span>{i.title}</span>
              <span className="text-ink-soft">{formatBytes(i.bytes)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
