import { useMemo, useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { useOnlineStatus } from '../app/useOnlineStatus';
import { buildOfflineManifest, formatBytes, type OfflineItem } from '../domain/offline/manifest';
import { SAMPLE_LESSONS, SAMPLE_AWARENESS, isApprovedForParents } from '../data/seed/content';
import { PremiumGate } from '../components/PremiumGate';

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
    <PremiumGate feature="offline_downloads">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sky-deep">
          {locale === 'mm' ? 'အင်တာနက်မရှိချိန် ဖတ်ရန် သိမ်းထားမှု' : 'Offline downloads'}
        </h1>
        <span className={`rounded-pill px-3 py-1 text-xs ${online ? 'bg-mint-soft text-mint-deep' : 'bg-pastel-orange text-ink'}`}>
          {online ? `🟢 ${t('common.online')}` : `⚪ ${t('common.offline')}`}
        </span>
      </div>

      <section className="space-y-2 rounded-card border border-line bg-white p-4 shadow-card">
        <label className="flex items-center justify-between">
          <span>{locale === 'mm' ? 'Wi-Fi ချိတ်ဆက်ထားချိန်တွင်သာ သိမ်းမည်' : 'Download on Wi-Fi only'}</span>
          <input type="checkbox" checked={wifiOnly} onChange={(e) => setWifiOnly(e.target.checked)}
            className="h-5 w-5" />
        </label>
        <p className="text-sm text-ink-soft">
          {locale === 'mm' ? 'အသုံးပြုထားသော သိုလှောင်မှုပမာဏ' : 'Storage used'}: {formatBytes(manifest.totalBytes)} · {manifest.count} {locale === 'mm' ? 'ခု' : 'items'}
        </p>
      </section>

      {manifest.count === 0 ? (
        <p className="rounded-card bg-pastel-yellow/60 p-4 text-sm text-ink">
          {locale === 'mm'
            ? 'မိဘများဖတ်ရှုနိုင်ရန် အတည်ပြုထုတ်ဝေထားသော အကြောင်းအရာ မရှိသေးသဖြင့် ယခုအချိန်တွင် သိမ်းထား၍ မရသေးပါ။ ကလေး၏ ကိုယ်ရေးမှတ်တမ်းများကို ဤနေရာတွင် မသိမ်းဆည်းပါ။'
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
    </PremiumGate>
  );
}
