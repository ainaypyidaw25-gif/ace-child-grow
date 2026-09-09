import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocale } from '../../app/LocaleContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  applyBulkReplaceToItem,
  previewBulkReplace,
  type BulkReplaceItemPreview,
  type ContentBulkEditItem,
} from '../../domain/content/bulkReplace';

type ApplyOutcome = {
  succeeded: string[];
  failed: Array<{ slug: string; message: string }>;
};

// Bulk find-and-replace for the review workspace's editable wording. Owner
// request: editing one item at a time via the search box does not scale when
// the same wording fix needs to land across many items. This previews every
// affected field before writing anything, then applies via the existing
// library.updateDraft mutation per item — no new write path, so every edit
// still bumps a review revision and requires fresh review, same as a manual
// single-item edit.
export function BulkReplacePanel({ canEdit }: { canEdit: boolean }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const items = useQuery(api.library.contentForBulkEdit) as ContentBulkEditItem[] | undefined;
  const updateDraft = useMutation(api.library.updateDraft);

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [preview, setPreview] = useState<BulkReplaceItemPreview[] | null>(null);
  const [excludedSlugs, setExcludedSlugs] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [applying, setApplying] = useState(false);
  const [outcome, setOutcome] = useState<ApplyOutcome | null>(null);

  const selectedPreview = useMemo(
    () => (preview ?? []).filter((row) => !excludedSlugs.has(row.slug)),
    [preview, excludedSlugs],
  );
  const totalFieldChanges = selectedPreview.reduce((sum, row) => sum + row.fields.length, 0);

  if (!canEdit) return null;
  if (items === undefined) return <p className="text-ink-soft" role="status">…</p>;

  const runPreview = () => {
    setOutcome(null);
    setExcludedSlugs(new Set());
    setPreview(previewBulkReplace(items, query.trim(), replacement, caseSensitive));
  };

  const toggleItem = (slug: string) => {
    setExcludedSlugs((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  };

  const applyReplace = async () => {
    setConfirming(false);
    setApplying(true);
    const succeeded: string[] = [];
    const failed: Array<{ slug: string; message: string }> = [];
    for (const row of selectedPreview) {
      const source = items.find((candidate) => candidate.slug === row.slug);
      if (!source) { failed.push({ slug: row.slug, message: L('မတွေ့ပါ', 'Not found') }); continue; }
      try {
        const payload = applyBulkReplaceToItem(source, query.trim(), replacement, caseSensitive);
        await updateDraft({
          slug: source.slug,
          ...payload,
          expectedReviewRevision: source.reviewRevision ?? 1,
        });
        succeeded.push(row.slug);
      } catch (error) {
        failed.push({ slug: row.slug, message: error instanceof Error ? error.message : String(error) });
      }
    }
    setApplying(false);
    setOutcome({ succeeded, failed });
    setPreview(null);
  };

  return (
    <section className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card">
      <div>
        <h2 className="font-bold text-ink">{L('တစ်ပြိုင်နက် ရှာဖွေအစားထိုးရန်', 'Find and replace across all content')}</h2>
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          {L(
            'စာသားတစ်ခုကို ရှာပြီး အားလုံးထဲတွင် တစ်ပြိုင်နက် အစားထိုးနိုင်ပါသည်။ တိုက်ရိုက် စာလုံးအတိုင်း ရှာဖွေပါသည် — regular expression (regex) မဟုတ်ပါ။ မသိမ်းမီ ပြောင်းလဲမည့် နေရာအားလုံးကို ကြိုတင်ကြည့်ရှုနိုင်ပြီး၊ ရွေးချယ်အတည်ပြုထားသော အကြောင်းအရာများကိုသာ သိမ်းဆည်းပါမည်။',
            'Find a piece of text and replace every occurrence across the content library at once. This is a literal text match, not a regex. You review every field it would change before anything is saved, and only confirmed items are written.',
          )}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('ရှာမည့်စာသား', 'Find')}</span>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPreview(null); setOutcome(null); }}
            className="w-full rounded-xl border border-line px-3 py-2"
            placeholder={L('ဥပမာ — ရှာစေပါ', 'e.g. old wording')}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('အစားထိုးမည့်စာသား', 'Replace with')}</span>
          <input
            value={replacement}
            onChange={(event) => { setReplacement(event.target.value); setPreview(null); setOutcome(null); }}
            className="w-full rounded-xl border border-line px-3 py-2"
            placeholder={L('ဥပမာ — ရှာပါစေ', 'e.g. new wording')}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(event) => { setCaseSensitive(event.target.checked); setPreview(null); setOutcome(null); }}
          className="h-4 w-4"
        />
        {L('စာလုံးအကြီး/အသေး တိုက်ဆိုင်ရမည် (English)', 'Match case (for English text)')}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!query.trim() || applying}
          onClick={runPreview}
          className="min-h-touch rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {L('ကြိုကြည့်မည်', 'Preview changes')}
        </button>
        {preview && (
          <span className="text-sm text-ink-soft">
            {L(
              `ကိုက်ညီသည် ${preview.length} ခု · ${totalFieldChanges} နေရာ ပြောင်းမည်`,
              `${preview.length} item${preview.length === 1 ? '' : 's'} match · ${totalFieldChanges} field${totalFieldChanges === 1 ? '' : 's'} will change`,
            )}
          </span>
        )}
      </div>

      {preview && preview.length === 0 && (
        <p className="rounded-xl border border-line bg-canvas p-4 text-sm text-ink-soft">
          {L('ကိုက်ညီသော အကြောင်းအရာ မတွေ့ပါ။', 'No content matches that text.')}
        </p>
      )}

      {preview && preview.length > 0 && (
        <div className="space-y-3">
          <ul className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {preview.map((row) => {
              const excluded = excludedSlugs.has(row.slug);
              return (
                <li key={row.slug} className={`rounded-xl border p-3 ${excluded ? 'border-line bg-canvas opacity-60' : 'border-sky bg-mint-soft/30'}`}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={!excluded}
                      onChange={() => toggleItem(row.slug)}
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{locale === 'mm' ? row.titleMm : row.titleEn}</span>
                      <span className="block break-all text-xs text-sky-deep">{row.slug} · {row.type}</span>
                      <span className="mt-2 block space-y-2">
                        {row.fields.map((field) => (
                          <span key={field.field} className="block rounded-lg bg-white p-2 text-xs leading-5">
                            <span className="block font-mono font-semibold text-sky-deep">
                              {field.reference} · {L(`${field.occurrences} ကြိမ်`, `${field.occurrences}×`)}
                            </span>
                            <span className="mt-1 block text-state-red-deep line-through">{field.before}</span>
                            <span className="mt-1 block text-mint-deep">{field.after}</span>
                          </span>
                        ))}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <button
              type="button"
              disabled={applying || selectedPreview.length === 0}
              onClick={() => setConfirming(true)}
              className="min-h-touch rounded-pill bg-sky-deep px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {applying
                ? L('အသုံးပြုနေသည်…', 'Applying…')
                : L(`${selectedPreview.length} ခုကို အတည်ပြုမည်`, `Apply to ${selectedPreview.length} item${selectedPreview.length === 1 ? '' : 's'}`)}
            </button>
          </div>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          message={L(
            `ရွေးထားသော အကြောင်းအရာ ${selectedPreview.length} ခုတွင် ဤအစားထိုးမှုကို အသုံးပြုမှာ သေချာပါသလား။ ပြင်ဆင်ပြီးတိုင်း ပြန်လည်သုံးသပ်ရန် လိုအပ်ပါလိမ့်မည်။`,
            `Apply this replacement to ${selectedPreview.length} selected item${selectedPreview.length === 1 ? '' : 's'}? Each edit will require fresh review, same as a manual edit.`,
          )}
          confirmLabel={L('အတည်ပြုမည်', 'Apply')}
          cancelLabel={L('မလုပ်တော့ပါ', 'Cancel')}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void applyReplace()}
        />
      )}

      {outcome && (
        <p className="rounded-xl bg-mint-soft px-3 py-2 text-sm text-ink" role="status">
          {L(
            `${outcome.succeeded.length} ခု ပြင်ပြီးပါပြီ။`,
            `Updated ${outcome.succeeded.length} item${outcome.succeeded.length === 1 ? '' : 's'}.`,
          )}
          {outcome.failed.length > 0 && (
            <>
              {' '}
              {L(`${outcome.failed.length} ခု မအောင်မြင်ပါ:`, `${outcome.failed.length} failed:`)}
              {' '}
              {outcome.failed.map((entry) => `${entry.slug} (${entry.message})`).join(', ')}
            </>
          )}
        </p>
      )}
    </section>
  );
}
