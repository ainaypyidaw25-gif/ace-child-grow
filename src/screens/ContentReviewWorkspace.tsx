import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useLocale } from '../app/LocaleContext';

const DIMENSIONS = ['english', 'native_myanmar', 'development', 'evidence', 'safety', 'clinical'] as const;
const DECISIONS = ['in_review', 'approved', 'changes_requested', 'not_applicable', 'evidence_required', 'blocked', 'rejected'] as const;
type Dimension = (typeof DIMENSIONS)[number];
type Decision = (typeof DECISIONS)[number];
type StaffRole = 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'support' |
  'system_admin' | 'review_manager' | 'myanmar_language_reviewer' | 'child_development_reviewer' | 'publisher' | 'auditor';
type ReviewerRole = Extract<StaffRole, 'language_reviewer' | 'myanmar_language_reviewer' | 'child_development_reviewer' | 'evidence_reviewer' | 'clinical_reviewer'>;

const DIMENSION_LABELS: Record<Dimension, { mm: string; en: string }> = {
  english: { mm: 'အင်္ဂလိပ်စာနှင့် အကြောင်းအရာ', en: 'English copy and content' },
  native_myanmar: { mm: 'သဘာဝကျသော မြန်မာအသုံးအနှုန်း', en: 'Native Myanmar language' },
  development: { mm: 'ကလေးဖွံ့ဖြိုးမှုနှင့် အသက်အရွယ်ကိုက်ညီမှု', en: 'Child development and age appropriateness' },
  evidence: { mm: 'ကိုးကားအထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  clinical: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်မှု', en: 'Clinical review' },
};

const DECISION_LABELS: Record<Decision, { mm: string; en: string }> = {
  in_review: { mm: 'စစ်ဆေးဆဲ', en: 'In review' },
  approved: { mm: 'ဤမူကွဲကို အတည်ပြုသည်', en: 'Approve this revision' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် လိုအပ်သည်', en: 'Changes requested' },
  not_applicable: { mm: 'မသက်ဆိုင်ပါ', en: 'Not applicable' },
  evidence_required: { mm: 'အထောက်အထား ထပ်မံလိုအပ်သည်', en: 'Evidence required' },
  blocked: { mm: 'ဆက်လက်လုပ်ဆောင်၍ မရသေးပါ', en: 'Blocked' },
  rejected: { mm: 'ပယ်ချသည်', en: 'Reject' },
};

const CHECKLIST_LABELS: Record<string, { mm: string; en: string }> = {
  meaning_matches_source: { mm: 'မူရင်းအဓိပ္ပာယ်နှင့် ကိုက်ညီသည်', en: 'Meaning matches the source' },
  plain_language: { mm: 'မိဘများ နားလည်လွယ်သည်', en: 'Parents can understand it easily' },
  concise: { mm: 'စာကြောင်းများ တိုတောင်းရှင်းလင်းသည်', en: 'Sentences are concise' },
  non_judgmental: { mm: 'အပြစ်တင်သည့် အသုံးအနှုန်း မပါ', en: 'Tone is non-judgmental' },
  age_clear: { mm: 'အသက်အရွယ်ကို ရှင်းလင်းစွာ ဖော်ပြထားသည်', en: 'Age group is clearly stated' },
  spelling: { mm: 'စာလုံးပေါင်း မှန်ကန်သည်', en: 'Spelling is correct' },
  grammar: { mm: 'သဒ္ဒါနှင့် ဝါကျဖွဲ့စည်းပုံ မှန်ကန်သည်', en: 'Grammar is correct' },
  natural_wording: { mm: 'မြန်မာအသုံးအနှုန်း သဘာဝကျသည်', en: 'Wording is natural' },
  parent_friendly: { mm: 'မိဘများအတွက် ဖတ်ရလွယ်သည်', en: 'Wording is parent-friendly' },
  glossary: { mm: 'သတ်မှတ်ဝေါဟာရများနှင့် ကိုက်ညီသည်', en: 'Terminology matches the glossary' },
  safety_clear: { mm: 'ဘေးကင်းရေးစာသား နားလည်လွယ်သည်', en: 'Safety wording is understandable' },
  age_appropriate: { mm: 'အသက်အရွယ်နှင့် ကိုက်ညီသည်', en: 'Activity is age appropriate' },
  practical: { mm: 'လက်တွေ့လုပ်ဆောင်နိုင်သည်', en: 'Instructions are practical' },
  realistic_materials: { mm: 'လိုအပ်ပစ္စည်းများ အလွယ်တကူ ရနိုင်သည်', en: 'Materials are realistic' },
  benefit_accurate: { mm: 'ဖွံ့ဖြိုးမှုအကျိုးကျေးဇူးကို မှန်ကန်စွာ ဖော်ပြထားသည်', en: 'Developmental benefit is accurate' },
  normal_variation: { mm: 'ကလေးတစ်ဦးနှင့်တစ်ဦး ကွာခြားနိုင်မှုကို ထည့်သွင်းထားသည်', en: 'Normal variation is acknowledged' },
  no_guarantee: { mm: 'အာမခံချက်ပေးသည့် စာသား မပါ', en: 'No guaranteed outcome is promised' },
  culturally_appropriate: { mm: 'မြန်မာ့ယဉ်ကျေးမှုနှင့် သင့်လျော်သည်', en: 'Cultural context is appropriate' },
  clinical_flag_correct: { mm: 'ဆေးဘက်ဆိုင်ရာ စစ်ဆေးမှုလိုအပ်ချက်ကို မှန်ကန်စွာ သတ်မှတ်ထားသည်', en: 'Clinical review need is correctly flagged' },
  evidence_sufficient: { mm: 'ကိုးကားအထောက်အထား လုံလောက်သည်', en: 'Evidence is sufficient' },
  claim_mapping: { mm: 'အဆိုပြုချက်နှင့် ရင်းမြစ် ဆက်စပ်မှု ရှင်းလင်းသည်', en: 'Claims map clearly to sources' },
  source_current: { mm: 'ရင်းမြစ်အခြေအနေကို စစ်ဆေးထားသည်', en: 'Source status is current' },
  age_applicable: { mm: 'ရင်းမြစ်သည် သက်ဆိုင်ရာ အသက်အရွယ်နှင့် ကိုက်ညီသည်', en: 'Evidence applies to this age range' },
  scope_recorded: { mm: 'သုံးသပ်ထားသည့် နယ်ပယ်ကို မှတ်တမ်းတင်ထားသည်', en: 'Review scope is recorded' },
  no_unsafe_advice: { mm: 'ဘေးမကင်းသည့် အကြံပြုချက် မပါ', en: 'No unsafe advice' },
  warning_signs_clear: { mm: 'သတိပြုရမည့် လက္ခဏာများ ရှင်းလင်းသည်', en: 'Warning signs are clear' },
  escalation_appropriate: { mm: 'အရေးပေါ်အကူအညီ ရယူရန် လမ်းညွှန်ချက် သင့်လျော်သည်', en: 'Emergency escalation is appropriate' },
  safe_sleep: { mm: 'လုံခြုံစွာ အိပ်စက်ရေး လမ်းညွှန်ချက် သင့်လျော်သည်', en: 'Safe sleep guidance is appropriate' },
  feeding_choking: { mm: 'အစားအစာနှင့် ဆို့နင်မှုဘေးကင်းရေး မှန်ကန်သည်', en: 'Feeding and choking safety are appropriate' },
  rereview_date: { mm: 'ပြန်လည်သုံးသပ်ရမည့် ရက်ကို မှတ်တမ်းတင်ထားသည်', en: 'Re-review date is recorded' },
  no_diagnosis: { mm: 'ရောဂါအမည် တပ်သည့် အဆို မပါ', en: 'No diagnosis claim' },
  no_unsafe_medicine: { mm: 'ဘေးမကင်းသည့် ဆေးဝါးအကြံပြုချက် မပါ', en: 'No unsafe medicine advice' },
  no_unsupported_dosage: { mm: 'အထောက်အထားမရှိသည့် ဆေးပမာဏ မပါ', en: 'No unsupported dosage' },
  no_delayed_care: { mm: 'ကုသမှုနှောင့်နှေးစေနိုင်သည့် လမ်းညွှန်ချက် မပါ', en: 'No delayed-care instruction' },
};

function mayReview(roles: StaffRole[] | null | undefined, dimension: Dimension): boolean {
  if (!roles?.length) return false;
  if (dimension === 'clinical' || dimension === 'safety') return roles.includes('clinical_reviewer');
  if (dimension === 'development') return roles.includes('child_development_reviewer');
  if (dimension === 'evidence') return roles.some((role) => ['evidence_reviewer', 'clinical_reviewer'].includes(role));
  return roles.some((role) => ['language_reviewer', 'myanmar_language_reviewer'].includes(role));
}

function ContentEditor({ item }: { item: {
  slug: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  data: unknown;
  reviewRevision?: number;
} }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const updateDraft = useMutation(api.library.updateDraft);
  const [titleMm, setTitleMm] = useState(item.titleMm);
  const [titleEn, setTitleEn] = useState(item.titleEn);
  const [summaryMm, setSummaryMm] = useState(item.summaryMm ?? '');
  const [summaryEn, setSummaryEn] = useState(item.summaryEn ?? '');
  const [dataText, setDataText] = useState(() => JSON.stringify(item.data, null, 2));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    let data: unknown;
    try {
      data = JSON.parse(dataText);
    } catch {
      setMessage(L('အဆင့်မြင့်အကြောင်းအရာ JSON ပုံစံ မမှန်ပါ။', 'Advanced content JSON is invalid.'));
      return;
    }
    setBusy(true);
    try {
      const result = await updateDraft({
        slug: item.slug,
        titleMm,
        titleEn,
        summaryMm: summaryMm || undefined,
        summaryEn: summaryEn || undefined,
        data,
      });
      setMessage(L(
        `ပြင်ဆင်ချက် သိမ်းပြီးပါပြီ။ သုံးသပ်မူကွဲ ${result.reviewRevision} ကို ပြန်လည်စစ်ဆေးရပါမည်။`,
        `Saved. Review revision ${result.reviewRevision} now requires fresh decisions.`,
      ));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('သိမ်း၍ မရပါ။', 'Unable to save.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{L('အကြောင်းအရာ တည်းဖြတ်ရန်', 'Edit content')}</p>
          <p className="text-sm text-ink-soft">{item.slug} · {L('မူကွဲ', 'revision')} {item.reviewRevision ?? 1}</p>
        </div>
        <span className="rounded-pill bg-pastel-yellow px-3 py-1 text-xs text-ink">
          {L('ပြင်လျှင် ပြန်လည်သုံးသပ်ရမည်', 'Edits reset active review')}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာခေါင်းစဉ်</span>
          <input value={titleMm} onChange={(event) => setTitleMm(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English title</span>
          <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာအနှစ်ချုပ်</span>
          <textarea value={summaryMm} onChange={(event) => setSummaryMm(event.target.value)} rows={4} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English summary</span>
          <textarea value={summaryEn} onChange={(event) => setSummaryEn(event.target.value)} rows={4} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
      </div>
      <details className="rounded-xl border border-line bg-canvas p-3">
        <summary className="cursor-pointer text-sm font-semibold text-sky-deep">
          {L('အဆင့်မြင့် အကြောင်းအရာဖွဲ့စည်းပုံ', 'Advanced structured content')}
        </summary>
        <p className="mt-2 text-xs text-ink-soft">
          {L('အစီအစဉ်၊ အဆင့်များနှင့် လုံခြုံရေးစာသားများကို JSON ပုံစံဖြင့် ပြင်နိုင်ပါသည်။', 'Edit steps, sections, and safety copy as structured JSON.')}
        </p>
        <textarea value={dataText} onChange={(event) => setDataText(event.target.value)} rows={18} spellCheck={false} className="mt-2 w-full rounded-xl border border-line bg-white p-3 font-mono text-xs leading-5 text-ink" />
      </details>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? L('သိမ်းနေသည်…', 'Saving…') : L('ပြင်ဆင်ချက် သိမ်းမည်', 'Save revision')}
        </button>
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      </div>
    </form>
  );
}

export function ContentReviewWorkspace() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const access = useQuery(api.admin.myAccess);
  const [selectedSlug, setSelectedSlug] = useState('');
  const managerView = Boolean(access?.roles.some((role) => ['owner', 'system_admin', 'review_manager'].includes(role)));
  const allAssignmentsView = Boolean(access?.roles.some((role) => ['owner', 'system_admin', 'review_manager', 'auditor'].includes(role)));
  const publisherView = Boolean(access?.roles.includes('publisher'));
  const myAssignments = useQuery(api.reviewAssignments.listMine, allAssignmentsView ? 'skip' : {});
  const managedAssignments = useQuery(api.reviewAssignments.listManaged, allAssignmentsView ? {} : 'skip');
  const assignments = allAssignmentsView ? managedAssignments : myAssignments;
  const publishable = useQuery(api.library.listPublishable, publisherView ? {} : 'skip');
  const summary = useQuery(api.reviewAssignments.summary, {});
  const team = useQuery(api.admin.listTeam, managerView ? {} : 'skip');
  const createAssignment = useMutation(api.reviewAssignments.create);
  const [dimension, setDimension] = useState<Dimension>('native_myanmar');
  const [decision, setDecision] = useState<Decision>('in_review');
  const detail = useQuery(api.library.getBySlug, selectedSlug ? { slug: selectedSlug } : 'skip');
  const reviews = useQuery(api.contentReviews.listForContent, selectedSlug ? { contentSlug: selectedSlug } : 'skip');
  const evidence = useQuery(api.evidence.forContent, selectedSlug ? { slug: selectedSlug } : 'skip');
  const saveDecision = useMutation(api.contentReviews.saveDecision);
  const publishContent = useMutation(api.library.setReview);
  const selectedAssignment = assignments?.find((row) => row.assignment.contentSlug === selectedSlug)?.assignment;
  const checklist = useQuery(api.reviewChecklists.getMine,
    selectedAssignment && !allAssignmentsView
      ? { assignmentId: selectedAssignment._id, dimension }
      : 'skip');
  const saveChecklist = useMutation(api.reviewChecklists.saveMine);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [assignSlug, setAssignSlug] = useState('');
  const [assignReviewerId, setAssignReviewerId] = useState('');
  const [assignRole, setAssignRole] = useState<ReviewerRole>('myanmar_language_reviewer');
  const [assignDue, setAssignDue] = useState('');
  const [assignScope, setAssignScope] = useState('မြန်မာဘာသာစကားနှင့် ဖတ်ရှုနားလည်လွယ်မှု');

  useEffect(() => {
    if (publisherView && publishable?.length && !publishable.some((row) => row.slug === selectedSlug)) {
      setSelectedSlug(publishable[0].slug);
    } else if (!publisherView && assignments?.length && !assignments.some((row) => row.assignment.contentSlug === selectedSlug)) {
      setSelectedSlug(assignments[0].assignment.contentSlug);
    }
  }, [assignments, publishable, publisherView, selectedSlug]);

  useEffect(() => {
    if (!mayReview(access?.roles as StaffRole[] | undefined, dimension)) {
      const firstAllowed = DIMENSIONS.find((value) => mayReview(access?.roles as StaffRole[] | undefined, value));
      if (firstAllowed) setDimension(firstAllowed);
    }
  }, [access?.roles, dimension]);

  useEffect(() => {
    if (!checklist) return;
    setChecklistState(Object.fromEntries(checklist.requiredKeys.map((key) => [
      key,
      checklist.responses.find((response) => response.key === key)?.checked === true,
    ])));
  }, [checklist]);

  const currentByDimension = useMemo(() => new Map(
    reviews?.current.map((review) => [review.dimension, review]) ?? [],
  ), [reviews]);

  const submitDecision = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSlug) return;
    setBusy(true); setMessage('');
    try {
      await saveDecision({ contentSlug: selectedSlug, dimension, decision, note: note || undefined });
      setNote('');
      setMessage(L('သုံးသပ်ဆုံးဖြတ်ချက်ကို မှတ်တမ်းတင်ပြီးပါပြီ။', 'Review decision recorded.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('မှတ်တမ်းတင်၍ မရပါ။', 'Unable to record decision.'));
    } finally {
      setBusy(false);
    }
  };

  const persistChecklist = async () => {
    if (!selectedAssignment) return;
    setBusy(true); setMessage('');
    try {
      await saveChecklist({
        assignmentId: selectedAssignment._id,
        dimension,
        responses: (checklist?.requiredKeys ?? []).map((key) => ({ key, checked: checklistState[key] === true })),
      });
      setMessage(L('စစ်ဆေးစာရင်းကို သိမ်းပြီးပါပြီ။', 'Checklist saved.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('စစ်ဆေးစာရင်းကို သိမ်း၍ မရပါ။', 'Unable to save checklist.'));
    } finally { setBusy(false); }
  };

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault();
    if (!assignSlug.trim() || !assignReviewerId) return;
    setBusy(true); setMessage('');
    try {
      await createAssignment({
        contentSlug: assignSlug.trim(),
        reviewerId: assignReviewerId as Id<'users'>,
        reviewerType: assignRole,
        dueAt: assignDue ? new Date(`${assignDue}T23:59:59`).getTime() : undefined,
        priority: 'normal',
        reviewScope: assignScope.trim(),
      });
      setAssignSlug('');
      setMessage(L('သုံးသပ်တာဝန်ကို ပေးအပ်ပြီး အကြောင်းကြားချက် ပို့ပြီးပါပြီ။', 'Assignment created and the reviewer was notified.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('တာဝန်ပေး၍ မရပါ။', 'Unable to create assignment.'));
    } finally { setBusy(false); }
  };

  const publishSelected = async () => {
    if (!selectedSlug) return;
    setBusy(true); setMessage('');
    try {
      await publishContent({ slug: selectedSlug, clinicalStatus: 'published' });
      setMessage(L('အကြောင်းအရာကို ထုတ်ဝေပြီး audit မှတ်တမ်းတင်ထားပါသည်။', 'Content published and recorded in the audit log.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('ထုတ်ဝေ၍ မရပါ။', 'Unable to publish.'));
    } finally { setBusy(false); }
  };

  if (access === undefined) return <p className="text-ink-soft">…</p>;
  if (!access?.isStaff || !access.roles.some((role) => ['language_reviewer', 'myanmar_language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer', 'review_manager', 'owner', 'system_admin', 'publisher', 'auditor'].includes(role))) {
    return <p className="rounded-card border border-line bg-white p-5 text-ink">{L('ဤသုံးသပ်ရေးနေရာသို့ ဝင်ခွင့် မရှိပါ။', 'You do not have access to this review workspace.')}</p>;
  }

  const item = detail && 'item' in detail ? detail.item : null;
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">ACE Review Workspace</p>
        <h1 className="text-2xl font-bold text-sky-deep">{L('အကြောင်းအရာ သုံးသပ်ရေးနေရာ', 'Content review workspace')}</h1>
        <p className="max-w-3xl text-sm text-ink-soft">
          {L(
            'အကြောင်းအရာကို ပြင်ဆင်ပြီး ဘာသာစကား၊ ကိုးကားချက်၊ ဘေးကင်းရေးနှင့် ဆေးဘက်ဆိုင်ရာ သုံးသပ်ချက်များကို သီးခြားမှတ်တမ်းတင်နိုင်ပါသည်။ မည်သည့်ဆုံးဖြတ်ချက်ကိုမျှ အလိုအလျောက် မဖြည့်ပါ။',
            'Edit content and record language, evidence, safety, and clinical decisions separately. No decision is filled automatically.',
          )}
        </p>
      </header>

      {summary && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label={L('သုံးသပ်မှုအကျဉ်းချုပ်', 'Review summary')}>
          {[
            [L('တာဝန်စုစုပေါင်း', 'Assigned'), summary.total],
            [L('စစ်ဆေးဆဲ', 'In review'), summary.inReview],
            [L('ပြင်ဆင်ရန်', 'Changes requested'), summary.changesRequested],
            [L('ပိတ်ဆို့နေသည်', 'Blocked'), summary.blocked],
            [L('ပြီးစီးမှု', 'Completion'), `${summary.completionPercent}%`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-card border border-line bg-white p-4 shadow-card">
              <p className="text-xs text-ink-soft">{label}</p><p className="mt-1 text-2xl font-bold text-sky-deep">{value}</p>
            </div>
          ))}
        </section>
      )}

      {managerView && team?.allowed && (
        <details className="rounded-card border border-line bg-white p-4 shadow-card">
          <summary className="cursor-pointer font-bold text-sky-deep">{L('သုံးသပ်တာဝန်အသစ် ပေးမည်', 'Create a review assignment')}</summary>
          <form onSubmit={submitAssignment} className="mt-4 grid gap-3 lg:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('အကြောင်းအရာ ID (slug)', 'Content ID (slug)')}</span>
              <input value={assignSlug} onChange={(event) => setAssignSlug(event.target.value)} required className="w-full rounded-xl border border-line px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('သုံးသပ်သူ', 'Reviewer')}</span>
              <select value={assignReviewerId} onChange={(event) => setAssignReviewerId(event.target.value)} required className="w-full rounded-xl border border-line bg-white px-3 py-2">
                <option value="">{L('သုံးသပ်သူ ရွေးပါ', 'Select reviewer')}</option>
                {team.members.filter((member) => ['language_reviewer', 'myanmar_language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer'].includes(member.role)).map((member) => (
                  <option key={member.userId} value={member.userId}>{member.displayName || member.email || member.userId} · {member.role}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('သုံးသပ်မှုအမျိုးအစား', 'Reviewer type')}</span>
              <select value={assignRole} onChange={(event) => setAssignRole(event.target.value as ReviewerRole)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {(['myanmar_language_reviewer', 'language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer'] as ReviewerRole[]).map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('ပြီးစီးရမည့်ရက်', 'Due date')}</span>
              <input type="date" value={assignDue} onChange={(event) => setAssignDue(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm font-medium text-ink lg:col-span-2">
              <span>{L('သုံးသပ်ရမည့် နယ်ပယ်', 'Review scope')}</span>
              <input value={assignScope} onChange={(event) => setAssignScope(event.target.value)} required className="w-full rounded-xl border border-line px-3 py-2" />
            </label>
            <button type="submit" disabled={busy} className="w-fit rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{L('တာဝန်ပေးမည်', 'Assign')}</button>
          </form>
        </details>
      )}

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('မိမိအား တာဝန်ပေးထားသော အကြောင်းအရာ', 'Assigned to me')}</span>
          <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="">{L('တာဝန်တစ်ခု ရွေးပါ', 'Select an assignment')}</option>
            {publisherView && publishable?.map((row) => (
              <option key={row.slug} value={row.slug}>{locale === 'mm' ? row.titleMm : row.titleEn} · {L('ထုတ်ဝေရန် အသင့်', 'Ready to publish')}</option>
            ))}
            {!publisherView && assignments?.map((row) => (
              <option key={row.assignment._id} value={row.assignment.contentSlug}>{locale === 'mm' ? row.titleMm : row.titleEn} · {row.assignment.status}</option>
            ))}
          </select>
        </label>
        {!publisherView && assignments?.length === 0 && <p className="mt-3 text-sm text-ink-soft">{L('မိမိအား တာဝန်ပေးထားသော အကြောင်းအရာ မရှိသေးပါ။', 'No review assignments have been assigned to you.')}</p>}
        {publisherView && publishable?.length === 0 && <p className="mt-3 text-sm text-ink-soft">{L('သုံးသပ်မှုအဆင့်အားလုံး ပြီးစီးထားသည့် အကြောင်းအရာ မရှိသေးပါ။', 'No content has completed every required review gate.')}</p>}
      </section>

      {item && access.roles.some((role) => ['owner', 'content_editor'].includes(role)) && <ContentEditor key={`${item.slug}-${item.updatedAt}`} item={item} />}

      {item && reviews?.allowed && (
        <section className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card">
          <div className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">English</p>
              <h2 className="mt-2 font-bold text-ink">{item.titleEn}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{item.summaryEn || L('အင်္ဂလိပ်အနှစ်ချုပ် မရှိပါ။', 'No English summary.')}</p>
            </article>
            <article className="rounded-xl border border-line bg-canvas p-4" lang="my">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">မြန်မာ</p>
              <h2 className="mt-2 font-bold text-ink">{item.titleMm}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{item.summaryMm || 'မြန်မာအနှစ်ချုပ် မရှိပါ။'}</p>
            </article>
          </div>
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="font-bold text-ink">{L('ကိုးကားအထောက်အထားများ', 'Evidence and sources')}</h2>
            {evidence?.sources.length ? (
              <ul className="mt-3 space-y-3">
                {evidence.sources.map((source) => (
                  <li key={source.sourceId} className="rounded-xl bg-canvas p-3 text-sm text-ink-soft">
                    <p className="font-semibold text-ink">{source.title}</p>
                    <p>{source.org}{source.year ? ` · ${source.year}` : ''}{source.evidenceLevel ? ` · ${source.evidenceLevel}` : ''}</p>
                    <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-sky-deep underline">{L('မူရင်းရင်းမြစ် ဖွင့်ကြည့်မည်', 'Open original source')}</a>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-ink-soft">{L('ချိတ်ဆက်ထားသည့် အတည်ပြုရင်းမြစ် မတွေ့ပါ။', 'No approved linked source was found.')}</p>}
          </section>
          <div>
            <h2 className="font-bold text-ink">{L('လက်ရှိမူကွဲ၏ သုံးသပ်မှုအခြေအနေ', 'Current revision review status')}</h2>
            <p className="text-sm text-ink-soft">{L('သုံးသပ်မူကွဲ', 'Review revision')} {reviews.contentVersion ?? 1}</p>
          </div>
          {publisherView && (
            <div className="rounded-xl border border-mint bg-mint-soft p-4">
              <p className="text-sm text-ink">{L('ဤလုပ်ဆောင်ချက်သည် သုံးသပ်အတည်ပြုချက်များကို မပြင်ဘဲ သီးခြားထုတ်ဝေမှုမှတ်တမ်း ဖန်တီးပါမည်။', 'This action creates a separate publication record without altering reviewer sign-offs.')}</p>
              <button type="button" onClick={publishSelected} disabled={busy} className="mt-3 rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{L('မိဘများအတွက် ထုတ်ဝေမည်', 'Publish for parents')}</button>
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-5">
            {DIMENSIONS.map((value) => {
              const review = currentByDimension.get(value);
              return (
                <div key={value} className="rounded-xl border border-line bg-canvas p-3">
                  <p className="text-sm font-semibold text-ink">{DIMENSION_LABELS[value][locale]}</p>
                  <p className="mt-1 text-xs text-ink-soft">{review ? DECISION_LABELS[review.decision][locale] : L('မစစ်ဆေးရသေး', 'Not reviewed')}</p>
                  {review && <p className="mt-2 text-[11px] text-ink-soft">{review.reviewerDisplayName}</p>}
                </div>
              );
            })}
          </div>

          {!publisherView && <form onSubmit={submitDecision} className="grid gap-3 rounded-xl bg-mint-soft p-4 lg:grid-cols-2">
            {checklist && (
              <fieldset className="space-y-2 rounded-xl border border-line bg-white p-4 lg:col-span-2">
                <legend className="px-2 text-sm font-bold text-ink">{L('မဖြစ်မနေ စစ်ဆေးရမည့်စာရင်း', 'Required reviewer checklist')}</legend>
                {checklist.requiredKeys.map((key) => (
                  <label key={key} className="flex items-start gap-3 text-sm text-ink">
                    <input type="checkbox" checked={checklistState[key] === true} onChange={(event) => setChecklistState((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4" />
                    <span>{(CHECKLIST_LABELS[key] ?? { mm: key, en: key })[locale]}</span>
                  </label>
                ))}
                <button type="button" onClick={persistChecklist} disabled={busy} className="mt-2 rounded-pill border border-sky px-4 py-2 text-sm font-semibold text-sky-deep disabled:opacity-50">
                  {L('စစ်ဆေးစာရင်း သိမ်းမည်', 'Save checklist')}
                </button>
              </fieldset>
            )}
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('သုံးသပ်မှုအမျိုးအစား', 'Review area')}</span>
              <select value={dimension} onChange={(event) => setDimension(event.target.value as Dimension)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {DIMENSIONS.map((value) => (
                  <option key={value} value={value} disabled={!mayReview(access.roles as StaffRole[], value)}>{DIMENSION_LABELS[value][locale]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('ဆုံးဖြတ်ချက်', 'Decision')}</span>
              <select value={decision} onChange={(event) => setDecision(event.target.value as Decision)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {DECISIONS.map((value) => <option key={value} value={value}>{DECISION_LABELS[value][locale]}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink lg:col-span-2">
              <span>{L('သုံးသပ်မှတ်ချက်', 'Review note')}</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder={decision === 'changes_requested' ? L('ပြင်ဆင်ရမည့်အချက်ကို ရှင်းလင်းစွာ ရေးပါ။', 'Describe the required change clearly.') : undefined} className="w-full rounded-xl border border-line bg-white px-3 py-2" />
            </label>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <button type="submit" disabled={busy || !mayReview(access.roles as StaffRole[], dimension) || (decision === 'approved' && checklist?.complete !== true)} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? L('မှတ်တမ်းတင်နေသည်…', 'Recording…') : L('ဆုံးဖြတ်ချက် မှတ်တမ်းတင်မည်', 'Record decision')}
              </button>
              {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
            </div>
          </form>}

          {reviews.history.length > 0 && (
            <details className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-semibold text-sky-deep">{L('ယခင်သုံးသပ်မှတ်တမ်းများ', 'Review history')}</summary>
              <ul className="mt-3 space-y-2">
                {reviews.history.map((review) => (
                  <li key={review._id} className="rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
                    <b className="text-ink">{DIMENSION_LABELS[review.dimension][locale]}</b> · {DECISION_LABELS[review.decision][locale]} · {review.reviewerDisplayName} · {new Date(review.reviewedAt).toLocaleDateString()}
                    <span className="ml-2">({L('မူကွဲ', 'revision')} {review.contentVersion})</span>
                    {review.note && <p className="mt-1">{review.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
