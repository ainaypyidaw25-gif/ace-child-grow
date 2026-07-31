import { useMemo, useState } from 'react';
import {
  collectEditableFields,
  humanizeField,
  type EditableField,
} from '../../src/screens/ContentReviewWorkspace';

/**
 * Scripted, silent-video demonstration of the reviewer workflow.
 *
 * Built for a no-audio training clip, so every instruction is an on-screen
 * Myanmar caption with a smaller English line under it.
 *
 * HONESTY CONSTRAINTS, because a training video that lies is worse than none:
 *   - The field list, labels and grouping come from the REAL exported helpers
 *     (collectEditableFields / humanizeField), so what a reviewer practises
 *     here is what they will actually see in /admin/reviews.
 *   - The content is a clearly-labelled demo record. Nothing is read from or
 *     written to any deployment: "save" advances a local counter and shows the
 *     same consequence the real mutation reports (a new review revision, and
 *     earlier approvals going stale).
 *   - A permanent banner says so, so a frame of this video can never be
 *     mistaken for a real record being edited.
 *
 * Playwright drives it one step at a time (tests/e2e/reviewer-guide.video.spec.ts)
 * and records the screen; holding each step long enough to read is the test's
 * job, not an animation's.
 */

type Step = {
  id: string;
  captionMm: string;
  captionEn: string;
  focus: 'queue' | 'warnings' | 'sidebyside' | 'edit' | 'save' | 'decision' | 'request' | 'done';
};

const STEPS: Step[] = [
  {
    id: 'queue',
    captionMm: '၁။ သင့်အလုပ်ကို ဤနေရာတွင် ရှာပါ။ အပေါ်ဆုံးက အရေးအကြီးဆုံး — P0 ကို ဦးစားပေး လုပ်ပါ။',
    captionEn: '1. Find your work here. The top of the list is the most urgent — start with P0.',
    focus: 'queue',
  },
  {
    id: 'warnings',
    captionMm: '၂။ ဖွင့်လိုက်ပါ။ အဝါရောင် သတိပေးချက်များကို အရင်ဖတ်ပါ — ဤအကြောင်းအရာသည် မိဘများ ယခု မြင်နေရသည်။',
    captionEn: '2. Open it. Read the yellow warnings first — this content is visible to parents right now.',
    focus: 'warnings',
  },
  {
    id: 'sidebyside',
    captionMm: '၃။ မြန်မာနှင့် English ကို ဘေးချင်းယှဉ် ဖတ်ပါ။ အဓိပ္ပာယ် တူ/မတူ စစ်ပါ။',
    captionEn: '3. Read the Myanmar and English side by side. Check they say the same thing.',
    focus: 'sidebyside',
  },
  {
    id: 'edit',
    captionMm: '၄။ ပြင်ရန် — အကွက်ထဲတွင် တိုက်ရိုက် ရိုက်ထည့်ပါ။ နည်းပညာပုံစံ ရေးရန် မလိုပါ။',
    captionEn: '4. To correct wording, type directly in the field. No technical format is needed.',
    focus: 'edit',
  },
  {
    id: 'save',
    captionMm: '၅။ “ပြင်ဆင်ချက် သိမ်းမည်” ကို နှိပ်ပါ။ သိမ်းပြီးလျှင် မူကွဲအသစ် ဖြစ်သွားပြီး ယခင် အတည်ပြုချက်များ ပြန်လည်စစ်ဆေးရမည်။',
    captionEn: '5. Press “Save revision”. Saving creates a new revision, so earlier approvals must be re-checked.',
    focus: 'save',
  },
  {
    id: 'decision',
    captionMm: '၆။ သင့်တာဝန်ရှိသော အပိုင်းကိုသာ ဆုံးဖြတ်ပါ။ အခြားအပိုင်းများကို ရွေး၍ မရပါ။',
    captionEn: '6. Decide only your own review area. The others are locked for your role.',
    focus: 'decision',
  },
  {
    id: 'request',
    captionMm: '၇။ အခြားစစ်ဆေးမှု လိုအပ်လျှင် တောင်းဆိုပါ။ ဤသည်မှာ တောင်းဆိုခြင်းသာ — မည်သူ့ကိုမျှ တာဝန်ပေးလိုက်ခြင်း မဟုတ်ပါ။',
    captionEn: '7. Ask for other reviews if needed. This is a request only — it assigns nobody.',
    focus: 'request',
  },
  {
    id: 'done',
    captionMm: '၈။ မသေချာလျှင် အတည်မပြုပါနှင့်။ “ပြင်ဆင်ရန်လို” ဟု မှတ်၍ မှတ်ချက်ရေးပါ။',
    captionEn: '8. If you are not sure, do not approve. Mark “changes requested” and write a note.',
    focus: 'done',
  },
];

const DEMO_DATA = {
  observeMm: 'ကလေးသည် ကူညီမှုမပါဘဲ စက္ကန့် ၃၀ ခန့် ထိုင်နိုင်ပါသလား။',
  observeEn: 'Can the child sit without support for about 30 seconds?',
  whyMm: 'ထိုင်နိုင်မှုသည် လက်နှစ်ဖက်ဖြင့် ကစားရန် လမ်းဖွင့်ပေးသည်။',
  whyEn: 'Sitting frees both hands for play.',
  encouragementMm: 'နေ့စဉ် ခဏတာ ထိုင်လေ့ကျင့်ခန်း ပေးပါ။ အနီးတွင် လူကြီး ရှိပါစေ။',
  encouragementEn: 'Offer short daily sitting practice with an adult close by.',
  safety: {
    mm: 'ကလေးကို ထိုင်ခုံပေါ်တွင် တစ်ယောက်တည်း ထားခဲ့ခြင်း မပြုပါနှင့်။',
    en: 'Never leave the child sitting unattended on a raised surface.',
  },
};

const DIMENSIONS = [
  { id: 'native_myanmar', mm: 'မြန်မာဘာသာ', en: 'Native Myanmar', allowed: true },
  { id: 'english', mm: 'English', en: 'English', allowed: true },
  { id: 'evidence', mm: 'အထောက်အထား', en: 'Evidence', allowed: false },
  { id: 'safety', mm: 'ဘေးကင်းရေး', en: 'Safety', allowed: false },
  { id: 'clinical', mm: 'ဆေးဘက်', en: 'Clinical', allowed: false },
];

// Fixed-bar geometry as inline styles, not Tailwind classes: tailwind.config
// scans only src/, so a utility used solely here would never be generated —
// and adding tests/ to the content globs would put harness-only classes into
// the production stylesheet.
const BANNER_H = 36;
const CAPTION_H = 108;
const CONTENT_TOP = BANNER_H + CAPTION_H + 16;

function Highlight({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div className={on ? 'rounded-card ring-4 ring-sky ring-offset-4 transition' : 'transition'}>
      {children}
    </div>
  );
}

export function ReviewerGuideDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>(DEMO_DATA);
  const [revision, setRevision] = useState(1);
  const [saved, setSaved] = useState(false);
  const [decision, setDecision] = useState('changes_requested');
  const [note, setNote] = useState('');
  const [requested, setRequested] = useState<string[]>([]);
  const step = STEPS[stepIndex];

  const fields = useMemo<EditableField[]>(() => collectEditableFields(data), [data]);
  const show = (focus: Step['focus']) => step.focus === focus;

  const setFieldValue = (field: EditableField, next: string) => {
    setData((current) => {
      const clone: Record<string, unknown> = JSON.parse(JSON.stringify(current));
      let cursor: Record<string, unknown> = clone;
      for (let i = 0; i < field.path.length - 1; i += 1) {
        cursor = cursor[field.path[i]] as Record<string, unknown>;
      }
      cursor[field.path.at(-1)!] = next;
      return clone;
    });
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Permanent, unmissable, and STICKY: every frame of the recording must
          carry it, or a screenshot lifted from the middle of the video could
          pass as a real record being edited. */}
      <div
        data-testid="demo-banner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: BANNER_H,
          // Colour inline too, for the same purge reason as the geometry: a
          // Tailwind shade used only here is never generated, and a banner with
          // no background is white text on white — invisible, which defeats the
          // entire point of labelling the demo.
          background: '#b91c1c', color: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        className="px-4 text-center text-sm font-bold"
      >
        သင်ခန်းစာ နမူနာသာ — အစစ်အမှန် အကြောင်းအရာကို မပြင်ပါ / TRAINING DEMO — no real content is changed
      </div>

      {/* Caption bar: the whole instruction track for a silent video. */}
      <div
        data-testid="caption"
        style={{ position: 'fixed', top: BANNER_H, left: 0, right: 0, zIndex: 20 }}
        className="bg-sky-deep px-5 py-4 text-white shadow-card"
      >
        <p className="text-lg font-bold leading-8">{step.captionMm}</p>
        <p className="mt-1 text-sm leading-6 text-white/80">{step.captionEn}</p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {STEPS.map((entry, index) => (
            <span key={entry.id} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      {/* Step advance for the recorder. Transparent rather than sr-only: a
          screen-reader-hidden control has no box to click, and it must stay
          invisible in the video. */}
      <button
        type="button"
        data-testid="next-step"
        aria-hidden
        tabIndex={-1}
        onClick={() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))}
        style={{ position: 'fixed', bottom: 0, right: 0, width: 8, height: 8, opacity: 0, zIndex: 50 }}
      />

      {/* Clears the two fixed bars above. */}
      <div className="mx-auto max-w-4xl space-y-4 px-4 pb-24" style={{ paddingTop: CONTENT_TOP }}>
        {/* Step 1: the queue row a reviewer picks up. */}
        <Highlight on={show('queue')}>
          <div className="rounded-card border border-line bg-white p-4 shadow-card" data-testid="demo-queue">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-red-600 px-3 py-1 text-xs font-bold text-white">P0 — ချက်ချင်း ဘေးကင်းရေး ပြင်ဆင်ရန်</span>
              <span className="rounded-pill bg-canvas px-2 py-1 text-xs font-semibold text-ink">Class C</span>
              <span className="rounded-pill bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">မိဘမြင်နေရ</span>
            </div>
            <p className="mt-2 break-words font-semibold leading-7 text-ink">၅–၆ လ — ထိုင်ခြင်း စောင့်ကြည့်ချက် (နမူနာ)</p>
            <p className="break-words text-sm leading-6 text-ink-soft">5–6 months — sitting observation (demo)</p>
          </div>
        </Highlight>

        {/* Step 2: warnings a reviewer must read before touching anything. */}
        <Highlight on={show('warnings')}>
          <div className="space-y-2" data-testid="demo-warnings">
            <p className="break-words rounded-lg bg-pastel-yellow px-3 py-2 text-sm leading-6 text-ink">
              ⚠ မိဘများ ယခု မြင်နေရသည် — ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက် မရှိသေးပါ
            </p>
            <p className="break-words rounded-lg bg-pastel-yellow px-3 py-2 text-sm leading-6 text-ink">
              ⚠ ပညာရေးနယ်ပယ် စစ်ဆေးမှုကို ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက်အဖြစ် ဘယ်တော့မှ မယူဆရပါ
            </p>
          </div>
        </Highlight>

        {/* Steps 3–5: the real editor field set, from the real helpers. */}
        <Highlight on={show('sidebyside') || show('edit') || show('save')}>
          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-sky-deep">အကြောင်းအရာ အသေးစိတ် / Content details</h3>
              <span className="rounded-pill bg-canvas px-3 py-1 text-xs text-ink-soft" data-testid="demo-revision">
                မူကွဲ / revision {revision}
              </span>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {fields.map((field) => (
                <label key={field.path.join('.')} className="space-y-1 text-sm font-medium text-ink">
                  <span>{humanizeField(field, 'mm')}</span>
                  {field.multiline ? (
                    <textarea
                      data-testid={`field-${field.path.join('-')}`}
                      value={field.value}
                      onChange={(event) => setFieldValue(field, event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 leading-7"
                    />
                  ) : (
                    <input
                      data-testid={`field-${field.path.join('-')}`}
                      value={field.value}
                      onChange={(event) => setFieldValue(field, event.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="demo-save"
                onClick={() => { setRevision((r) => r + 1); setSaved(true); }}
                className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white"
              >
                ပြင်ဆင်ချက် သိမ်းမည် / Save revision
              </button>
              {saved && (
                <p role="status" data-testid="demo-saved" className="break-words text-sm text-ink-soft">
                  သိမ်းပြီးပါပြီ။ မူကွဲ {revision} အတွက် အတည်ပြုချက်များကို ပြန်လည်စစ်ဆေးရပါမည်။
                </p>
              )}
            </div>
          </section>
        </Highlight>

        {/* Step 6: the decision form, with other roles' areas locked. */}
        <Highlight on={show('decision')}>
          <section className="rounded-xl bg-mint-soft p-4" data-testid="demo-decision">
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-ink">
                <span>သုံးသပ်မှုအမျိုးအစား / Review area</span>
                <select className="w-full rounded-xl border border-line bg-white px-3 py-2" defaultValue="native_myanmar">
                  {DIMENSIONS.map((dimension) => (
                    <option key={dimension.id} value={dimension.id} disabled={!dimension.allowed}>
                      {dimension.mm}{dimension.allowed ? '' : ' — သင့်အခန်းက မရပါ'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium text-ink">
                <span>ဆုံးဖြတ်ချက် / Decision</span>
                <select
                  data-testid="demo-decision-select"
                  value={decision}
                  onChange={(event) => setDecision(event.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2"
                >
                  <option value="in_review">စစ်ဆေးဆဲ</option>
                  <option value="approved">ဤမူကွဲကို အတည်ပြုသည်</option>
                  <option value="changes_requested">ပြင်ဆင်ရန် လိုအပ်သည်</option>
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium text-ink lg:col-span-2">
                <span>သုံးသပ်မှတ်ချက် / Review note</span>
                <textarea
                  data-testid="demo-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2"
                />
              </label>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink">
              “ပြင်ဆင်ရန် လိုအပ်သည်” ရွေးလျှင် မှတ်ချက် မဖြစ်မနေ ရေးရပါမည်။
            </p>
          </section>
        </Highlight>

        {/* Step 7: requesting other reviews is not assigning anyone. */}
        <Highlight on={show('request')}>
          <section className="rounded-card border border-line bg-white p-4 shadow-card" data-testid="demo-request">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">စစ်ဆေးမှု တောင်းဆိုရန် / Request reviews</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIMENSIONS.map((dimension) => (
                <button
                  key={dimension.id}
                  type="button"
                  data-testid={`demo-request-${dimension.id}`}
                  onClick={() => setRequested((current) => [...new Set([...current, dimension.id])])}
                  className={`rounded-pill border px-3 py-1.5 text-xs font-medium ${
                    requested.includes(dimension.id) ? 'border-sky bg-mint-soft text-ink' : 'border-line text-ink'
                  }`}
                >
                  {dimension.mm} စစ်ဆေးရန်
                </button>
              ))}
            </div>
            {requested.length > 0 && (
              <p data-testid="demo-requested" className="mt-2 break-words text-sm text-ink-soft">
                တောင်းဆိုပြီးပါပြီ — တာဝန်ပေးမှု၊ ဖိတ်ခေါ်မှု မလုပ်ပါ။
              </p>
            )}
          </section>
        </Highlight>

        {/* Step 8: the rule that matters most. */}
        <Highlight on={show('done')}>
          <section className="rounded-card border-2 border-red-300 bg-red-50 p-4" data-testid="demo-rules">
            <p className="text-base font-bold leading-7 text-red-800">မသေချာလျှင် အတည်မပြုပါနှင့်။</p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
              <li>• သင့်တာဝန်ရှိသော အပိုင်းကိုသာ ဆုံးဖြတ်ပါ။</li>
              <li>• ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက်ကို ဆေးပညာရှင်သာ ပေးနိုင်သည်။</li>
              <li>• ပြင်ပြီးတိုင်း မူကွဲအသစ် ဖြစ်သွားပြီး ယခင်အတည်ပြုချက်များ ပြန်စစ်ရမည်။</li>
              <li>• မှတ်တမ်းအဟောင်းများကို ဘယ်တော့မှ မဖျက်ပါ။</li>
            </ul>
          </section>
        </Highlight>
      </div>
    </div>
  );
}
