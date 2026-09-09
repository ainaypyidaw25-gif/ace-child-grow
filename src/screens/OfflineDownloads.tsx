import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useOnlineStatus } from '../app/useOnlineStatus';
import { PremiumGate } from '../components/PremiumGate';
import { isOfflineStorageAvailable } from '../app/offlineStore';
import { useDownloadedLibrary, useOfflineDownload } from '../app/useOfflineLibrary';
import {
  countByType,
  formatBytes,
  totalBytes,
  totalMediaBytes,
  totalMediaCount,
  type LibraryRowLike,
} from '../domain/offline/offlineLibrary';

// The content a parent reads. Private child records are never downloadable —
// see selectDownloadable(), which drops anything not published.
const TYPE_LABELS: Record<string, { mm: string; en: string }> = {
  guide: { mm: 'လမ်းညွှန်', en: 'Guides' },
  activity: { mm: 'လှုပ်ရှားမှု', en: 'Activities' },
  lesson: { mm: 'သင်ခန်းစာ', en: 'Lessons' },
  story: { mm: 'ပုံပြင်', en: 'Stories' },
  milestone: { mm: 'မှတ်တိုင်', en: 'Milestones' },
  special_need: { mm: 'အထူးလိုအပ်ချက်', en: 'Special needs' },
  printable: { mm: 'ပုံနှိပ်အသုံးပြုရန်', en: 'Printables' },
};

export function OfflineDownloads() {
  const { locale } = useLocale();
  const online = useOnlineStatus();
  const { records, loaded } = useDownloadedLibrary();
  const { download, clear } = useOfflineDownload();
  const [busy, setBusy] = useState<'download' | 'clear' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);

  // One query per readable type; each returns published rows only for a parent.
  const guides = useQuery(api.library.listByType, { type: 'guide', audience: 'parent' });
  const activities = useQuery(api.library.listByType, { type: 'activity', audience: 'parent' });
  const lessons = useQuery(api.library.listByType, { type: 'lesson', audience: 'parent' });
  const stories = useQuery(api.library.listByType, { type: 'story', audience: 'parent' });
  const milestones = useQuery(api.library.listByType, { type: 'milestone', audience: 'parent' });
  const specialNeeds = useQuery(api.library.listByType, { type: 'special_need', audience: 'parent' });
  const printables = useQuery(api.library.listByType, { type: 'printable', audience: 'parent' });

  const available = useMemo(() => {
    const groups = [guides, activities, lessons, stories, milestones, specialNeeds, printables];
    if (groups.some((group) => group === undefined)) return null; // still loading
    return groups.flatMap((group) => (group?.items ?? []) as LibraryRowLike[]);
  }, [guides, activities, lessons, stories, milestones, specialNeeds, printables]);

  const storedBytes = useMemo(() => totalBytes(records), [records]);
  const storedCounts = useMemo(() => countByType(records), [records]);
  const storedMediaBytes = useMemo(() => totalMediaBytes(records), [records]);
  const storedMediaCount = useMemo(() => totalMediaCount(records), [records]);
  const storageUsable = isOfflineStorageAvailable();

  async function runDownload() {
    if (!available || busy) return;
    setBusy('download');
    setMessage('');
    setError('');
    const result = await download(available);
    setBusy(null);
    if (!result.ok) {
      setError(L(
        'ဖုန်းတွင် သိမ်းဆည်း၍ မရပါ။ သိုလှောင်နေရာ လွတ်မလွတ် စစ်ဆေးပါ။',
        'Could not save to this device. Check its available storage space.',
      ));
      return;
    }
    setMessage(L(
      `${result.saved} ခုနှင့် ပုံ/အသံ ${result.mediaSaved} ခု သိမ်းပြီးပါပြီ။ အင်တာနက်မရှိချိန်တွင် ဖတ်နိုင်ပါပြီ။`,
      `Saved ${result.saved} items and ${result.mediaSaved} image/audio files. They can now be read without an internet connection.`,
    ));
  }

  async function runClear() {
    if (busy) return;
    setBusy('clear');
    setMessage('');
    setError('');
    const ok = await clear();
    setBusy(null);
    if (ok) setMessage(L('သိမ်းထားသည်များကို ဖျက်ပြီးပါပြီ။', 'Downloaded content removed.'));
    else setError(L('ဖျက်၍ မရပါ။', 'Could not remove the downloaded content.'));
  }

  return (
    <PremiumGate feature="offline_downloads">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-sky-deep">
            {L('အင်တာနက်မရှိချိန် ဖတ်ရန် သိမ်းထားမှု', 'Offline downloads')}
          </h1>
          <span className={`shrink-0 rounded-pill px-3 py-1 text-xs ${online ? 'bg-mint-soft text-mint-deep' : 'bg-pastel-orange text-ink'}`}>
            {online ? `🟢 ${L('အွန်လိုင်း', 'Online')}` : `⚪ ${L('အင်တာနက်မရှိ', 'Offline')}`}
          </span>
        </div>

        <section className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ink-soft">{L('ဖုန်းထဲတွင် သိမ်းဆည်းထားမှု', 'Stored on this device')}</span>
            <span className="text-lg font-bold text-sky-deep">
              {loaded ? `${records.length} ${L('ခု', 'items')}` : '…'}
            </span>
          </div>
          {records.length > 0 && (
            <>
              <p className="text-sm text-ink-soft">
                {L('နေရာယူမှု', 'Storage used')}: {formatBytes(storedBytes + storedMediaBytes)}
              </p>
              {storedMediaCount > 0 && (
                <p className="text-sm text-ink-soft">
                  {L('Offline ပုံ/အသံ', 'Offline image/audio')}: {storedMediaCount} · {formatBytes(storedMediaBytes)}
                </p>
              )}
              <ul className="flex flex-wrap gap-1.5">
                {Object.entries(storedCounts).map(([type, count]) => (
                  <li key={type} className="rounded-pill bg-mint-soft px-2.5 py-1 text-xs text-mint-deep">
                    {TYPE_LABELS[type]?.[locale] ?? type}: {count}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {!storageUsable && (
          <p role="alert" className="rounded-card bg-pastel-orange/60 p-4 text-sm text-ink">
            {L(
              'ဤ browser တွင် သိုလှောင်ခွင့် ပိတ်ထားသဖြင့် သိမ်းဆည်း၍ မရပါ (သီးသန့် mode ဖြစ်နိုင်ပါသည်)။',
              'This browser has storage disabled, so downloads are not possible here (private browsing can cause this).',
            )}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void runDownload()}
            disabled={!online || !available || busy !== null || !storageUsable}
            className="min-h-touch flex-1 rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy === 'download'
              ? L('သိမ်းနေသည်…', 'Saving…')
              : available === null
                ? L('စာရင်း ရယူနေသည်…', 'Loading…')
                : records.length > 0
                  ? L(`အသစ် ပြန်သိမ်းမည် (${available.length})`, `Update download (${available.length})`)
                  : L(`ဖုန်းတွင် သိမ်းမည် (${available.length})`, `Download (${available.length} items)`)}
          </button>
          {records.length > 0 && (
            <button
              type="button"
              onClick={() => void runClear()}
              disabled={busy !== null}
              className="min-h-touch rounded-pill border border-line bg-white px-6 py-3 font-semibold text-ink-soft disabled:opacity-50"
            >
              {busy === 'clear' ? L('ဖျက်နေသည်…', 'Removing…') : L('ဖျက်မည်', 'Remove')}
            </button>
          )}
        </div>

        {!online && records.length === 0 && (
          <p className="rounded-card bg-pastel-yellow/60 p-4 text-sm text-ink">
            {L(
              'အင်တာနက် ပြန်ချိတ်ဆက်မှသာ သိမ်းဆည်းနိုင်ပါမည်။',
              'Reconnect to the internet to download content for offline reading.',
            )}
          </p>
        )}

        {message && <p role="status" className="rounded-card bg-mint-soft p-3 text-sm text-mint-deep">✓ {message}</p>}
        {error && <p role="alert" className="rounded-card bg-pink/50 p-3 text-sm text-state-red-deep">⚠️ {error}</p>}

        <p className="text-xs text-ink-soft">
          {L(
            'အတည်ပြု ထုတ်ဝေပြီးသော ပညာပေးအကြောင်းအရာနှင့် အတည်ပြုထားသော ပုံ/အသံများကိုသာ သိမ်းပါသည်။ ကလေး၏ ကိုယ်ရေးမှတ်တမ်းများ (ကြီးထွားမှု၊ အိပ်စက်မှု၊ ကျန်းမာရေး) ကို ဤနေရာတွင် ဘယ်သောအခါမျှ မသိမ်းပါ။',
            'Only published educational content and its approved image/audio files are stored. Your child’s private records — growth, sleep and health — are never written to offline storage.',
          )}
        </p>
      </div>
    </PremiumGate>
  );
}
