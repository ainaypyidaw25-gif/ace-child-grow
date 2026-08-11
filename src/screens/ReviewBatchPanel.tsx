import { useMemo, useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { buildReviewBatch, REVIEWER_CHECKLIST, type BatchItem } from '../evidence/reviewBatch';

// Evidence and safety review batch — ages 0–12 months.
//
// This panel is a WORK QUEUE, not an approval control. There is deliberately no
// button here that changes a review status: a reviewer signs items off in the
// registry, one reference at a time, with their name and qualification attached.
// What this screen does is tell the assigned reviewers what is in front of them,
// how it is grouped, what is blocked and why, and how much is left — so a batch
// can be planned and handed over rather than guessed at.
//
// The numbers are computed from the local content seed and reference registry,
// so they describe what SHOULD be reviewed. They are not a claim about what a
// deployed backend currently holds; that is what `npm run evidence:live` is for.

type Grouping = 'age' | 'domain' | 'type' | 'org' | 'status';

export function ReviewBatchPanel({ todayIso }: { todayIso: string }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);

  const batch = useMemo(() => buildReviewBatch(todayIso), [todayIso]);
  const [grouping, setGrouping] = useState<Grouping>('age');
  const [selected, setSelected] = useState<string | null>(null);

  const p = batch.progress;

  const groups = {
    age: batch.groups.byAgeGroup,
    domain: batch.groups.byDomain,
    type: batch.groups.byType,
    org: batch.groups.byOrganization,
    status: batch.groups.byReviewStatus,
  }[grouping];

  const groupOf = (item: BatchItem): string[] => {
    switch (grouping) {
      case 'age':
        return [item.ageGroupKey];
      case 'domain':
        return [item.domainKey ?? 'not_domain_scoped'];
      case 'type':
        return [item.type];
      case 'org':
        return item.orgKeys;
      case 'status':
        return [item.clinicalStatus];
    }
  };

  return (
    <div className="space-y-4">
      {/* Nothing on this screen publishes or approves. Say so where a reviewer
          will read it, not only in the code. */}
      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {L(
          'ဤစာမျက်နှာသည် အထောက်အထားနှင့် ဘေးကင်းရေး သုံးသပ်ရန် စာရင်းသာ ဖြစ်သည်။ ဤနေရာမှ မည်သည့် အကြောင်းအရာကိုမျှ အလိုအလျောက် ထုတ်ဝေခြင်း သို့မဟုတ် အတည်ပြုခြင်း မပြုပါ။ သာမန်ပညာပေးအကြောင်းအရာအတွက် အထူးကျွမ်းကျင်သူ သုံးသပ်မှု မလိုအပ်ပါ။',
          'This page is an evidence-and-safety work queue only. Nothing here publishes or approves content automatically. Ordinary education does not require specialist review.',
        )}
      </p>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">
            {L('အထောက်အထားနှင့် ဘေးကင်းရေး သုံးသပ်ရန် အစု — ၀–၁၂ လ', 'Evidence and safety review batch — 0–12 months')}
          </h2>
          <span className="text-xs text-ink-soft">
            {batch.batchId} · {batch.generatedOn}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={L('စုစုပေါင်း', 'Items in batch')} value={p.total} />
          <Stat label={L('ယခု သုံးသပ်နိုင်', 'Reviewable now')} value={p.reviewableNow} tone="good" />
          <Stat label={L('ပိတ်ဆို့ထား', 'Blocked')} value={p.blocked} tone={p.blocked > 0 ? 'warn' : 'good'} />
          <Stat label={L('သတိပြုရန် ရှိ', 'With advisories')} value={p.withAdvisories} tone="note" />
          <Stat label={L('ထုတ်ဝေပြီး', 'Published')} value={p.published} />
          <Stat label={L('သုံးသပ်ဆဲ', 'In review')} value={p.inClinicalReview} />
          <Stat label={L('ကိုးကားချက် အရေအတွက်', 'Distinct references')} value={p.distinctReferences} />
          <Stat
            label={L('ဖြေဆိုရမည့် စစ်ဆေးချက်', 'Checklist answers required')}
            value={p.checklistAnswers}
          />
        </div>

        {/* Review progress is the honest metric: how many of the required
            checklist answers exist. None of them do yet, so the bar reads 0%
            rather than borrowing credit from the content already drafted. */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>{L('သုံးသပ်မှု တိုးတက်မှု', 'Review progress')}</span>
            <span>
              0 / {p.checklistAnswers} ({L('လူ သုံးသပ်ချက် မစတင်ရသေး', 'no human review recorded yet')})
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-pill bg-canvas">
            <div className="h-full w-0 bg-mint" />
          </div>
        </div>

        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          <Pair label={L('အတည်ပြုပြီး ကိုးကားချက်', 'References approved')} value={p.referencesApproved} />
          <Pair label={L('သုံးသပ်ရန် စောင့်', 'Awaiting review')} value={p.referencesAwaiting} />
          <Pair label={L('အထောက်အထား လိုအပ်', 'Evidence required')} value={p.referencesEvidenceRequired} />
          <Pair label={L('သက်တမ်းကုန်', 'Expired')} value={p.expiredReferences} />
          <Pair label={L('ခေတ်မမီ', 'Outdated')} value={p.outdatedReferences} />
        </dl>
      </section>

      {/* Grouping. The evidence policy asks for five groupings of the batch; a
          reviewer uses different ones for different sittings (a whole domain in
          one pass, or everything citing one organisation). */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['age', L('အသက်အုပ်စု', 'Age group')],
              ['domain', L('ဖွံ့ဖြိုးမှု နယ်ပယ်', 'Development domain')],
              ['type', L('အကြောင်းအရာ အမျိုးအစား', 'Content type')],
              ['org', L('အရင်းအမြစ် အဖွဲ့အစည်း', 'Source organisation')],
              ['status', L('သုံးသပ်မှု အခြေအနေ', 'Review status')],
            ] as [Grouping, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setGrouping(key)}
              className={`min-h-touch rounded-pill px-3 py-1 text-xs font-semibold ${
                grouping === key ? 'bg-sky text-white' : 'bg-canvas text-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-3">
          {groups.map((g) => {
            const rows = batch.items.filter((i) => groupOf(i).includes(g.key));
            return (
              <li key={g.key}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {L(g.labelMm, g.label)}
                  <span className="rounded-pill bg-lavender/40 px-2 py-0.5 text-xs font-normal text-ink-soft">
                    {g.count}
                  </span>
                </h3>
                <ul className="mt-1 space-y-1">
                  {rows.map((item) => (
                    <li key={`${g.key}:${item.slug}`}>
                      <button
                        type="button"
                        onClick={() => setSelected(selected === item.slug ? null : item.slug)}
                        className="w-full rounded-xl border border-line px-3 py-2 text-left"
                      >
                        <span className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                          <span className="rounded-pill bg-canvas px-2 py-0.5">{item.type}</span>
                          <span className="rounded-pill bg-canvas px-2 py-0.5">
                            {L(item.ageGroupLabelMm, item.ageGroupLabelEn)}
                          </span>
                          {item.domainLabelEn && (
                            <span className="rounded-pill bg-canvas px-2 py-0.5">
                              {L(item.domainLabelMm ?? item.domainLabelEn, item.domainLabelEn)}
                            </span>
                          )}
                          {item.blockers.length > 0 && (
                            <span className="rounded-pill bg-pastel-orange px-2 py-0.5 font-semibold text-ink">
                              {L('ပိတ်ဆို့', 'BLOCKED')}
                            </span>
                          )}
                          {item.advisories.length > 0 && (
                            <span className="rounded-pill bg-pastel-yellow px-2 py-0.5 font-semibold text-ink">
                              {L('သတိပြုရန်', 'ADVISORY')}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm font-medium text-ink">
                          {L(item.titleMm, item.titleEn)}
                        </span>
                      </button>

                      {selected === item.slug && <ItemDetail item={item} L={L} />}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Age-agnostic content is excluded from the batch on purpose. Saying so
          out loud stops a finished 0–12m batch from being read as "everything an
          infant's parent can see has been reviewed". */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="font-semibold text-ink">
          {L('ဤအစုတွင် မပါဝင်သော အကြောင်းအရာ', 'Deliberately outside this batch')}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {L(
            'အောက်ပါ အကြောင်းအရာများသည် အသက်အုပ်စု သတ်မှတ်ချက် မရှိသဖြင့် ၀–၁၂ လ အစုတွင် မပါဝင်ပါ။ ၀–၁၂ လ ကလေးမိဘများ မြင်နိုင်သော်လည်း သီးခြား အစုဖြင့် သုံးသပ်ရမည်။',
            'These carry no age scope, so they are not in the 0–12 month batch. A parent of an infant can still see them, so they need their own review batch.',
          )}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs text-ink-soft">
          {batch.outOfScopeAgeAgnostic.map((g) => (
            <li key={g.type} className="rounded-pill bg-canvas px-3 py-0.5">
              {g.type} · {g.count}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="font-semibold text-ink">{L('သုံးသပ်သူ စစ်ဆေးရန် စာရင်း', 'Reviewer checklist')}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {L(
            'အကြောင်းအရာ တစ်ခုစီအတွက် အောက်ပါ အချက် ၈ ချက်ကို ဖြေဆိုရမည်။',
            'Every item in the batch must be answered against all eight dimensions.',
          )}
        </p>
        <ol className="mt-2 space-y-2">
          {REVIEWER_CHECKLIST.map((d, i) => (
            <li key={d.key} className="rounded-xl border border-line px-3 py-2">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                <span className="text-ink-soft">{i + 1}.</span>
                {L(d.labelMm, d.labelEn)}
                <span
                  className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${
                    d.blocking ? 'bg-pastel-orange text-ink' : 'bg-canvas text-ink-soft'
                  }`}
                >
                  {d.blocking ? L('ဖြေရှင်းမှ ခွင့်ပြု', 'Blocking') : L('မှတ်ချက်သာ', 'Advisory')}
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-soft">{L(d.promptMm, d.promptEn)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ItemDetail({ item, L }: { item: BatchItem; L: (mm: string, en: string) => string }) {
  return (
    <div className="mt-1 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-soft">
      <p className="font-mono">{item.slug}</p>

      {item.blockers.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold text-ink">{L('ပိတ်ဆို့နေသည့် အကြောင်းရင်း', 'Blockers')}</p>
          <ul className="list-inside list-disc">
            {item.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {item.advisories.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold text-ink">{L('သတိပြုရန်', 'Advisories')}</p>
          <ul className="list-inside list-disc">
            {item.advisories.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-2 font-semibold text-ink">
        {L('ကိုးကားချက်', 'References')} ({item.references.length})
      </p>
      <ul className="mt-1 space-y-1">
        {item.references.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-white px-2 py-0.5">{r.orgKey}</span>
            <span>{r.year ?? '—'}</span>
            <span className="flex-1 break-words">{r.title}</span>
            <span className="rounded-pill bg-white px-2 py-0.5">{r.reviewStatus}</span>
            {r.expired && (
              <span className="rounded-pill bg-pastel-orange px-2 py-0.5 font-semibold text-ink">
                {L('သက်တမ်းကုန်', 'EXPIRED')}
              </span>
            )}
            {r.outdated && (
              <span className="rounded-pill bg-pastel-yellow px-2 py-0.5 font-semibold text-ink">
                {L('ခေတ်မမီ', 'OUTDATED')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'warn' | 'note' }) {
  const bg =
    tone === 'good' ? 'bg-mint-soft' : tone === 'warn' ? 'bg-pastel-orange/60' : tone === 'note' ? 'bg-pastel-yellow/60' : 'bg-canvas';
  return (
    <div className={`rounded-xl px-3 py-2 ${bg}`}>
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex gap-1">
      <dt>{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
