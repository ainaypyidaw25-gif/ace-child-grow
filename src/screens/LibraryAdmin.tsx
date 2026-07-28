import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useLocale } from '../app/LocaleContext';
import { seedPayload } from '../content/seed';
import { CONTENT_TYPES } from '../content/taxonomy';

function MediaUploader({ slug }: { slug: string }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const generateUploadUrl = useMutation(api.library.generateMediaUploadUrl);
  const attachMedia = useMutation(api.library.attachUploadedMedia);
  const [kind, setKind] = useState<'illustration' | 'animation' | 'video'>('illustration');
  const [file, setFile] = useState<File | null>(null);
  const [altMm, setAltMm] = useState('');
  const [altEn, setAltEn] = useState('');
  const [captionMm, setCaptionMm] = useState('');
  const [captionEn, setCaptionEn] = useState('');
  const [transcriptMm, setTranscriptMm] = useState('');
  const [transcriptEn, setTranscriptEn] = useState('');
  const [rightsOwner, setRightsOwner] = useState('ACE Child Grow');
  const [licenseType, setLicenseType] = useState('Original work — all rights reserved');
  const [accessLevel, setAccessLevel] = useState<'free_sample' | 'premium'>('premium');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !altMm.trim() || !altEn.trim() || !rightsOwner.trim() || !licenseType.trim()) {
      setMessage(L('ဖိုင်၊ ဖော်ပြချက်၊ မူပိုင်ခွင့်ပိုင်ရှင်နှင့် အသုံးပြုခွင့်အမျိုးအစား လိုအပ်ပါသည်။', 'File, descriptions, rights owner, and license type are required.'));
      return;
    }
    const maxBytes = kind === 'illustration' ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxBytes) {
      setMessage(L(kind === 'illustration' ? 'ပုံသည် 5MB အောက် ဖြစ်ရပါမည်။' : 'လှုပ်ရှားရုပ်ပုံ သို့မဟုတ် ဗီဒီယိုသည် 100MB အောက် ဖြစ်ရပါမည်။', kind === 'illustration' ? 'Image must be under 5 MB.' : 'Animation or video must be under 100 MB.'));
      return;
    }
    setBusy(true); setMessage('');
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) throw new Error('Upload failed');
      const { storageId } = await response.json() as { storageId: string };
      await attachMedia({
        contentSlug: slug,
        kind,
        storageId: storageId as Id<'_storage'>,
        altMm: altMm.trim(),
        altEn: altEn.trim(),
        captionMm: captionMm.trim() || undefined,
        captionEn: captionEn.trim() || undefined,
        transcriptMm: transcriptMm.trim() || undefined,
        transcriptEn: transcriptEn.trim() || undefined,
        rightsOwner: rightsOwner.trim(),
        licenseType: licenseType.trim(),
        accessLevel,
        durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
      });
      setFile(null); setCaptionMm(''); setCaptionEn(''); setTranscriptMm(''); setTranscriptEn(''); setDurationSeconds('');
      setMessage(L('မီဒီယာ တင်ပြီးပါပြီ။ ပညာရှင် သုံးသပ်အတည်ပြုပြီးမှ မိဘများ မြင်ရပါမည်။', 'Media uploaded. Parents see it only after professional review.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('တင်၍ မရပါ။', 'Unable to upload.'));
    } finally { setBusy(false); }
  };

  return (
    <details className="mt-2 rounded-lg bg-canvas px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-sky-deep">{L('ပုံ / လှုပ်ရှားရုပ်ပုံ / ဗီဒီယို ထည့်ရန်', 'Add image / animation / video')}</summary>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <select value={kind} onChange={(event) => { setKind(event.target.value as 'illustration' | 'animation' | 'video'); setFile(null); }} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm">
          <option value="illustration">{L('သင်ကြားရေးပုံ', 'Learning image')}</option>
          <option value="animation">{L('မူရင်း 2D လှုပ်ရှားရုပ်ပုံ', 'Original 2D animation')}</option>
          <option value="video">{L('သင်ကြားရေးဗီဒီယို', 'Learning video')}</option>
        </select>
        <input type="file" accept={kind === 'illustration' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-xs text-ink-soft" />
        <input value={altMm} onChange={(event) => setAltMm(event.target.value)} placeholder="မြန်မာလို ပုံ/ဗီဒီယိုဖော်ပြချက် *" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
        <input value={altEn} onChange={(event) => setAltEn(event.target.value)} placeholder="English description *" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
        <textarea value={captionMm} onChange={(event) => setCaptionMm(event.target.value)} placeholder="မြန်မာ caption (optional)" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
        <textarea value={captionEn} onChange={(event) => setCaptionEn(event.target.value)} placeholder="English caption (optional)" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
        {kind !== 'illustration' && (
          <>
            <textarea value={transcriptMm} onChange={(event) => setTranscriptMm(event.target.value)} placeholder="မြန်မာ transcript (optional)" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            <textarea value={transcriptEn} onChange={(event) => setTranscriptEn(event.target.value)} placeholder="English transcript (optional)" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            <input inputMode="numeric" value={durationSeconds} onChange={(event) => setDurationSeconds(event.target.value)} placeholder={L('ကြာချိန် (စက္ကန့်)', 'Duration (seconds)')} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </>
        )}
        <input value={rightsOwner} onChange={(event) => setRightsOwner(event.target.value)} placeholder={L('မူပိုင်ခွင့်ပိုင်ရှင် *', 'Rights owner *')} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
        <input value={licenseType} onChange={(event) => setLicenseType(event.target.value)} placeholder={L('အသုံးပြုခွင့်အမျိုးအစား *', 'License type *')} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
        <select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as 'free_sample' | 'premium')} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm">
          <option value="free_sample">{L('အခမဲ့ နမူနာ', 'Free sample')}</option>
          <option value="premium">Premium</option>
        </select>
        <button type="submit" disabled={busy} className="min-h-touch rounded-pill bg-sky px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? L('တင်နေသည်…', 'Uploading…') : L('မီဒီယာ တင်မည်', 'Upload media')}</button>
        {message && <p className="text-xs text-ink-soft" role="status">{message}</p>}
      </form>
    </details>
  );
}

// Staff CMS for the content library: import/seed, coverage overview, and
// per-item professionally scoped review transitions. Server enforces staff-only for every
// mutation; a non-staff visitor sees the access notice.
export function LibraryAdmin() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const stats = useQuery(api.library.stats, {});
  const access = useQuery(api.admin.myAccess);
  const [type, setType] = useState('lesson');
  const list = useQuery(api.library.listByType, { type });
  const importSeed = useMutation(api.library.importSeed);
  const createAnimationQueue = useMutation(api.library.createStarterAnimationQueue);
  const setReview = useMutation(api.library.setReview);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  if (stats === undefined) return <p className="text-ink-soft">…</p>;
  if (!stats.allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <div aria-hidden className="text-4xl">🔒</div>
        <p className="font-semibold text-ink">{L('ဝင်ခွင့် မရှိပါ။', 'You do not have access.')}</p>
        <p className="text-sm text-ink-soft">{L('အကြောင်းအရာစီမံခန့်ခွဲရေးစနစ်ကို ဝန်ထမ်းများသာ အသုံးပြုနိုင်သည်။', 'The CMS is staff-only.')}</p>
      </div>
    );
  }
  const canEdit = access?.role === 'owner' || access?.role === 'content_editor';
  const canReview = access?.role === 'clinical_reviewer' || (access?.role === 'owner' && !!access.qualification);
  const educationReviewer = access?.role === 'owner' && !!access.qualification;

  const runImport = async () => {
    setBusy(true); setMsg('');
    try {
      const res = await importSeed({ items: seedPayload() });
      setMsg(L(`တင်သွင်းပြီး — အသစ် ${res.created}၊ ပြင် ${res.updated}`, `Imported — ${res.created} new, ${res.updated} updated`));
    } catch (e) {
      setMsg(L('တင်သွင်းမှု မအောင်မြင်ပါ။', 'Import failed.') + ' ' + (e as Error).message);
    } finally { setBusy(false); }
  };

  const transition = async (slug: string, clinicalStatus: string) => {
    if (pending) return; // guard against double-clicks
    setPending(slug);
    try {
      await setReview({ slug, clinicalStatus });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{L('အကြောင်းအရာ စီမံခန့်ခွဲရေး', 'Content CMS')}</h1>
      <Link to="/admin/reviews" className="inline-flex rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white">
        {L('အကြောင်းအရာ တည်းဖြတ်ပြီး သုံးသပ်ရန်', 'Edit and review content')}
      </Link>

      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {L(
          canReview
            ? educationReviewer
              ? 'ပညာရေးနှင့် အထူးပညာရေးဆိုင်ရာ သုံးသပ်သူအဖြစ် အကြောင်းအရာများကို ထုတ်ဝေနိုင်ပါသည်။ ဤအတည်ပြုချက်သည် ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက် မဟုတ်ပါ။ လုပ်ဆောင်ချက်တိုင်းကို မှတ်တမ်းတင်ထားသည်။'
              : 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်သူအဖြစ် အကြောင်းအရာများကို ထုတ်ဝေနိုင်ပါသည်။ လုပ်ဆောင်ချက်တိုင်းကို မှတ်တမ်းတင်ထားသည်။'
            : 'အကြောင်းအရာများကို ကြည့်ရှုတည်းဖြတ်နိုင်ပါသည်။ ထုတ်ဝေရန် သတ်မှတ်ထားသော အရည်အချင်းရှိ ပညာရှင်၏ သုံးသပ်ချက် လိုအပ်ပါသည်။',
          canReview
            ? educationReviewer
              ? 'You may publish with education and special-education review scope. This is not clinical approval. Every action is audited.'
              : 'You may publish as the assigned clinical reviewer. Every action is audited.'
            : 'You may inspect and edit content. Publishing requires an assigned qualified reviewer.',
        )}
      </p>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">{L('အနှစ်ချုပ်', 'Overview')}</h2>
        <p className="text-sm text-ink-soft">{L('စုစုပေါင်း', 'Total items')}: <b>{stats.total}</b></p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(stats.byType).map(([k, n]) => (
            <span key={k} className="rounded-pill bg-lavender/40 px-3 py-0.5">{k}: {n as number}</span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(stats.byStatus).map(([k, n]) => (
            <span key={k} className="rounded-pill bg-canvas px-3 py-0.5">{k}: {n as number}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {L('အသက်အုပ်စု', 'Ages covered')}: {stats.ages.length} · {L('နယ်ပယ်', 'Domains')}: {stats.domains.length}
        </p>
        {canEdit && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={runImport} disabled={busy}
              className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? L('တင်သွင်းနေသည်…', 'Importing…') : L('မူလအကြောင်းအရာများ တင်သွင်းရန်', 'Import seed content')}
            </button>
            <button type="button" disabled={busy} onClick={async () => {
              setBusy(true); setMsg('');
              try {
                const result = await createAnimationQueue({});
                setMsg(L(`Animation အစီအစဉ် — အသစ် ${result.created}၊ ရှိပြီး ${result.existing}`, `Animation queue — ${result.created} created, ${result.existing} existing`));
              } catch (error) {
                setMsg(error instanceof Error ? error.message : 'Unable to create queue');
              } finally {
                setBusy(false);
              }
            }} className="rounded-pill border border-sky px-5 py-2 text-sm font-semibold text-sky-deep disabled:opacity-50">
              {L('Animation ၂၅ ခု စီစဉ်ရန်', 'Plan 25 animations')}
            </button>
          </div>
        )}
        {msg && <p className="mt-2 text-sm text-ink-soft">{msg}</p>}
        <p className="mt-2 text-[11px] text-ink-soft">
          {L('အကြောင်းအရာကို ထပ်မပွားစေဘဲ တင်သွင်းနိုင်ပါသည်။ ပြောင်းလဲထားသောမူကွဲသည် အသစ်ပြန်လည်သုံးသပ်ရပြီး ယခင်ဆုံးဖြတ်ချက်များကို မှတ်တမ်းအဖြစ်သာ ထိန်းသိမ်းထားသည်။',
             'Import is idempotent. Changed revisions require fresh review; prior decisions remain history only.')}
        </p>
      </section>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">{L('ပညာရှင် သုံးသပ်ခြင်း', 'Professional review')}</h2>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="mb-3 rounded-pill border border-line bg-white px-3 py-1.5 text-sm">
          {CONTENT_TYPES.map((tk) => <option key={tk} value={tk}>{tk}</option>)}
        </select>
        {list === undefined ? <p className="text-ink-soft">…</p> : (
          <ul className="space-y-2">
            {list.items.map((it) => (
              <li key={it._id} className="rounded-lg border border-line px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{locale === 'mm' ? it.titleMm : it.titleEn}</span>
                  <span className="text-[11px] text-ink-soft">{it.clinicalStatus}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {['draft', 'clinical_review', 'published'].map((s) => (
                    <button key={s} type="button" onClick={() => transition(it.slug, s)}
                      disabled={
                        (it.clinicalStatus === s && !(s === 'published' && access?.role === 'clinical_reviewer' && it.reviewScope !== 'clinical')) ||
                        pending === it.slug ||
                        (s === 'published' ? !canReview : !canEdit)
                      }
                      className={`min-h-touch rounded-pill px-2.5 py-1 text-xs disabled:opacity-50 ${
                        it.clinicalStatus === s ? 'bg-lavender/40 text-ink-soft' : 'border border-line text-ink'
                      }`}>
                      {s === 'published'
                        ? access?.role === 'clinical_reviewer' && it.reviewScope !== 'clinical'
                          ? L('သုံးသပ်ပြီးသော မူကွဲကို ထုတ်ဝေမည်', 'Publish reviewed revision')
                          : L('ထုတ်ဝေမည်', 'Publish')
                        : s === 'clinical_review' ? L('သုံးသပ်ရန်', 'Review') : L('မူကြမ်း', 'Draft')}
                    </button>
                  ))}
                </div>
                {canEdit && <MediaUploader slug={it.slug} />}
              </li>
            ))}
            {list.items.length === 0 && <p className="text-sm text-ink-soft">{L('အကြောင်းအရာ မရှိသေးပါ။ အထက်ရှိ မူလအကြောင်းအရာများကို တင်သွင်းပါ။', 'Empty — import the seed above.')}</p>}
          </ul>
        )}
      </section>
    </div>
  );
}
