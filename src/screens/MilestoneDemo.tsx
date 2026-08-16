import { useMemo, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLibraryContent } from '../app/useOfflineLibrary';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { computeResult, type MilestoneResponseInput } from '../domain/rules/resultEngine';
import { SafetyBanner } from '../components/SafetyBanner';
import type { DevelopmentDomain, MilestoneAnswer } from '../domain/types';
import type { TranslationKey } from '../i18n';
import { developmentalAgeMonths } from '../domain/age/age';
import { resolveAgeGroup } from '../content/taxonomy';
import { milestoneIllustration } from '../content/milestoneIllustrations';
import { NoChild } from './Growth';
import {
  ACUTE_URGENT_SYMPTOMS,
  ACUTE_URGENT_SYMPTOM_LABELS,
  type AcuteUrgentSymptom,
} from '../domain/safety/safety';

const ANSWER_KEYS: Record<MilestoneAnswer, TranslationKey> = {
  yes: 'milestone.answer.yes',
  sometimes: 'milestone.answer.sometimes',
  not_yet: 'milestone.answer.not_yet',
  not_sure: 'milestone.answer.not_sure',
};

const STATE_COLOR: Record<string, string> = {
  green: 'border-state-green',
  yellow: 'border-state-yellow',
  orange: 'border-state-orange',
  red: 'border-state-red',
};

function normalizeDomain(domain: string | undefined): DevelopmentDomain {
  if (domain === 'speech' || domain === 'language' || domain === 'communication') return 'speech_language';
  if (domain === 'social' || domain === 'emotional') return 'social_emotional';
  const supported: DevelopmentDomain[] = [
    'gross_motor', 'fine_motor', 'cognitive', 'play', 'self_help',
    'growth_nutrition', 'sleep', 'safety_health',
  ];
  return supported.includes(domain as DevelopmentDomain) ? domain as DevelopmentDomain : 'cognitive';
}

function textFromData(data: unknown, key: 'observeMm' | 'observeEn'): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

export function MilestoneDemo() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const ageMonths = activeChild
    ? developmentalAgeMonths(new Date(activeChild.birthDate), new Date(), {
        useCorrectedAge: activeChild.useCorrectedAge,
        gestationalWeeks: activeChild.gestationalWeeks,
      })
    : 0;
  const ageGroupKey = resolveAgeGroup(ageMonths)?.key;
  const data = useLibraryContent({
    type: 'milestone',
    ageGroupKey,
  });
  const recordSession = useMutation(api.milestones.recordSession);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, MilestoneAnswer>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [confirmedSymptoms, setConfirmedSymptoms] = useState<AcuteUrgentSymptom[]>([]);
  const [urgentSymptomsAnswered, setUrgentSymptomsAnswered] = useState(false);
  const [urgentSymptomsExpanded, setUrgentSymptomsExpanded] = useState(false);
  const [lostSkill, setLostSkill] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');

  const items = useMemo(() => {
    const rows = data?.items ?? [];
    // Staff library queries intentionally include every workflow status, but
    // the parent journey must remain a published-only experience even when a
    // staff member previews it with their own child profile.
    return data?.staff
      ? rows.filter((item) => item.clinicalStatus === 'published')
      : rows;
  }, [data]);
  const current = items[step];
  const answered = Object.keys(answers).length;
  const result = useMemo(() => {
    if (!submitted) return null;
    const responses: MilestoneResponseInput[] = items.map((item, index) => ({
      milestoneId: item.slug,
      domain: normalizeDomain(item.domainKey),
      answer: answers[index] ?? 'not_sure',
    }));
    return computeResult(responses, { confirmedSymptoms, lostSkill: lostSkill === true });
  }, [submitted, answers, confirmedSymptoms, lostSkill, items]);

  if (!activeChild) return <NoChild />;
  if (data === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (!ageGroupKey || items.length === 0) {
    return (
      <section className="rounded-[28px] border border-line bg-white p-6 text-center shadow-card">
        <div className="text-4xl" aria-hidden>🌱</div>
        <h1 className="mt-3 text-xl font-bold text-ink">
          {locale === 'mm' ? 'ဤအသက်အရွယ်အတွက် စစ်ဆေးစာရင်း ပြင်ဆင်ဆဲဖြစ်သည်' : 'The checklist for this age is being prepared'}
        </h1>
        <p className="mt-2 text-sm leading-7 text-ink-soft">
          {locale === 'mm'
            ? 'ဤအသက်အုပ်စုအတွက် အတည်ပြုထုတ်ဝေထားသော ဖွံ့ဖြိုးမှုမှတ်တိုင် မရှိသေးပါ။'
            : 'There are no approved published milestones for this age group yet.'}
        </p>
      </section>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {result.safety.urgent && <SafetyBanner />}
        <section className={`rounded-[28px] border-2 ${STATE_COLOR[result.state]} bg-white p-6 shadow-card`}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">{activeChild.nickname}</p>
          <h1 className="mt-2 text-xl font-bold">{t('report.title')}</h1>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            {t(result.guidanceKeys.consult)} · {t(result.guidanceKeys.repeatReview)}
          </p>
          <p className="mt-4 rounded-xl bg-canvas p-3 text-sm text-ink-soft">{t('result.disclaimer.nonDiagnostic')}</p>
        </section>
        <button type="button" className="rounded-pill bg-sky px-5 py-3 font-semibold text-white" onClick={() => {
          setSubmitted(false);
          setStep(0);
          setAnswers({});
          setNotes({});
          setConfirmedSymptoms([]);
          setUrgentSymptomsAnswered(false);
          setUrgentSymptomsExpanded(false);
          setLostSkill(null);
        }}>
          {locale === 'mm' ? 'စစ်ဆေးစာရင်း အသစ်စမည်' : 'Start a new checklist'}
        </button>
      </div>
    );
  }

  const question = locale === 'mm'
    ? textFromData(current.data, 'observeMm') ?? current.summaryMm ?? current.titleMm
    : textFromData(current.data, 'observeEn') ?? current.summaryEn ?? current.titleEn;
  const illustration = milestoneIllustration(current.slug);

  async function save() {
    if (!activeChild || lostSkill === null || !urgentSymptomsAnswered) return;
    setBusy(true);
    setSaveError('');
    const responses = items.map((item, index) => ({
      milestoneKey: item.slug,
      titleMm: item.titleMm,
      titleEn: item.titleEn,
      domain: normalizeDomain(item.domainKey),
      answer: answers[index] ?? 'not_sure' as MilestoneAnswer,
      note: notes[index]?.trim() || undefined,
    }));
    const computed = computeResult(
      responses.map((response, index) => ({
        milestoneId: items[index].slug,
        domain: response.domain,
        answer: response.answer,
      })),
      { confirmedSymptoms, lostSkill },
    );
    try {
      await recordSession({
        childId: activeChild.id as never,
        ageGroupKey,
        resultState: computed.state,
        lostSkill,
        urgentSymptoms: confirmedSymptoms,
        resultSnapshot: {
          state: computed.state,
          answeredCount: answered,
          urgentSymptoms: computed.safety.triggers,
          completedAt: Date.now(),
        },
        responses,
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error); setSaveError((locale === 'mm' ? 'သိမ်း၍ မရပါ။' : 'Could not save.'));
    } finally {
      setBusy(false);
    }
  }

  function toggleUrgentSymptom(symptom: AcuteUrgentSymptom) {
    const removing = confirmedSymptoms.includes(symptom);
    // Removing the last selected symptom is not the same as explicitly
    // confirming "none". Keep Save disabled until the parent chooses one.
    setUrgentSymptomsAnswered(!removing || confirmedSymptoms.length > 1);
    setConfirmedSymptoms((previous) => removing
      ? previous.filter((value) => value !== symptom)
      : [...previous, symptom]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">{activeChild.nickname}</p>
          <h1 className="mt-1 text-xl font-bold text-ink">{locale === 'mm' ? 'ဖွံ့ဖြိုးမှု စစ်ဆေးစာရင်း' : 'Milestone checklist'}</h1>
        </div>
        <span className="rounded-pill bg-mint-soft px-3 py-1 text-sm font-semibold text-sky-deep">{step + 1} / {items.length}</span>
      </header>

      <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-sky transition-all" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
      </div>

      <section className="rounded-[30px] border border-line bg-white p-6 shadow-card">
        {illustration && (
          <img
            key={current.slug}
            src={illustration}
            alt={locale === 'mm' ? current.titleMm : current.titleEn}
            width={1200}
            height={900}
            loading="eager"
            decoding="async"
            data-testid="milestone-illustration"
            className="mb-5 aspect-[4/3] w-full rounded-2xl bg-canvas object-cover"
          />
        )}
        <p className="text-xs font-semibold text-ink-soft">{locale === 'mm' ? current.titleMm : current.titleEn}</p>
        <h2 className="mt-3 text-xl font-bold leading-9 text-ink">{question}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(Object.keys(ANSWER_KEYS) as MilestoneAnswer[]).map((answer) => (
            <button
              key={answer}
              type="button"
              aria-pressed={answers[step] === answer}
              onClick={() => setAnswers((previous) => ({ ...previous, [step]: answer }))}
              className={`min-h-touch rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                answers[step] === answer ? 'border-sky bg-mint-soft text-sky-deep' : 'border-line bg-white text-ink'
              }`}
            >
              {t(ANSWER_KEYS[answer])}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium text-ink-soft">
          {locale === 'mm' ? 'မှတ်ချက် (မဖြည့်လည်း ရပါသည်)' : 'Note (optional)'}
          <textarea value={notes[step] ?? ''} onChange={(event) => setNotes((previous) => ({ ...previous, [step]: event.target.value }))} rows={2} className="mt-1 block w-full rounded-xl border border-line px-3 py-2 text-ink" />
        </label>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="min-h-touch self-start rounded-pill border border-line bg-white px-5 py-2 disabled:opacity-40">
          {t('milestone.prev')}
        </button>
        {step < items.length - 1 ? (
          <button type="button" disabled={!answers[step]} onClick={() => setStep((value) => Math.min(items.length - 1, value + 1))} className="min-h-touch rounded-pill bg-sky px-6 py-2 font-semibold text-white disabled:opacity-40">
            {t('milestone.next')}
          </button>
        ) : (
          <div className="flex w-full flex-col items-stretch gap-2 sm:max-w-lg sm:items-end">
            <fieldset className="w-full rounded-2xl border border-line bg-white p-3 text-sm">
              <legend className="px-1 font-medium text-ink">
                {locale === 'mm'
                  ? 'မသိမ်းမီ ကလေး၏ လက်ရှိအခြေအနေကို တစ်ချက်စစ်ပါ။'
                  : 'Before saving, briefly check how your child is now.'}
              </legend>
              {!urgentSymptomsExpanded ? (
                <div className="mt-2 space-y-2">
                  {urgentSymptomsAnswered && confirmedSymptoms.length === 0 ? (
                    <p role="status" className="rounded-xl bg-mint-soft px-3 py-3 text-ink">
                      {locale === 'mm'
                        ? 'အရေးပေါ်လက္ခဏာများ မရှိပါဟု မှတ်သားထားသည်။'
                        : 'You confirmed that none of the urgent signs are present.'}
                    </p>
                  ) : (
                    <p className="leading-6 text-ink-soft">
                      {locale === 'mm'
                        ? 'လက်ရှိ ရှိ/မရှိကို သေချာဖြေရန် ကျန်းမာရေးလက္ခဏာစာရင်းကို တစ်ချက်ကြည့်ပါ။'
                        : 'Review the short health-sign list, then confirm whether any are present now.'}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setUrgentSymptomsExpanded(true)}
                    className="min-h-touch w-full rounded-xl border border-sky bg-white px-3 py-2 font-semibold text-sky-deep"
                  >
                    {locale === 'mm'
                      ? urgentSymptomsAnswered ? 'လက္ခဏာစာရင်းကို ပြန်စစ်မည်' : 'လက္ခဏာစာရင်းကို ကြည့်မည်'
                      : urgentSymptomsAnswered ? 'Review the signs again' : 'Review the health signs'}
                  </button>
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  <p className="mb-1 leading-6 text-ink-soft">
                    {locale === 'mm'
                      ? 'ယခုတွေ့ရသည့် အရေးပေါ်လက္ခဏာရှိသမျှကို ရွေးပါ။ မရှိပါက အောက်ဆုံးအဖြေကို ရွေးပါ။'
                      : 'Select every urgent sign present now. If there are none, choose the last answer.'}
                  </p>
                  {ACUTE_URGENT_SYMPTOMS.map((symptom) => {
                    const selected = confirmedSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleUrgentSymptom(symptom)}
                        className={`min-h-touch rounded-xl border px-3 py-2 text-left ${
                          selected ? 'border-state-red bg-pink font-semibold text-state-red-deep' : 'border-line text-ink'
                        }`}
                      >
                        {ACUTE_URGENT_SYMPTOM_LABELS[symptom][locale]}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    aria-pressed={urgentSymptomsAnswered && confirmedSymptoms.length === 0}
                    onClick={() => {
                      setConfirmedSymptoms([]);
                      setUrgentSymptomsAnswered(true);
                      setUrgentSymptomsExpanded(false);
                    }}
                    className={`min-h-touch rounded-xl border px-3 py-2 text-left ${
                      urgentSymptomsAnswered && confirmedSymptoms.length === 0
                        ? 'border-sky bg-mint-soft font-semibold text-sky-deep'
                        : 'border-line text-ink'
                    }`}
                  >
                    {locale === 'mm' ? 'ဤလက္ခဏာများ မရှိပါ' : 'None of these'}
                  </button>
                </div>
              )}
            </fieldset>
            {confirmedSymptoms.length > 0 || lostSkill === true
              ? <div className="w-full"><SafetyBanner /></div>
              : null}
            <fieldset className="rounded-2xl border border-line bg-white p-3 text-sm">
              <legend className="px-1 text-ink-soft">{t('safety.skillLoss.question')}</legend>
              <div className="mt-1 flex gap-2">
                <button type="button" aria-pressed={lostSkill === true} onClick={() => setLostSkill(true)} className={`min-h-touch rounded-pill px-4 py-2 ${lostSkill === true ? 'bg-state-red text-white' : 'border border-line'}`}>{locale === 'mm' ? 'ရှိပါသည်' : 'Yes'}</button>
                <button type="button" aria-pressed={lostSkill === false} onClick={() => setLostSkill(false)} className={`min-h-touch rounded-pill px-4 py-2 ${lostSkill === false ? 'bg-mint text-white' : 'border border-line'}`}>{locale === 'mm' ? 'မရှိပါ' : 'No'}</button>
              </div>
            </fieldset>
            <button type="button" disabled={busy || answered !== items.length || !urgentSymptomsAnswered || lostSkill === null} onClick={() => void save()} className="min-h-touch self-end rounded-pill bg-sky-deep px-6 py-2 font-semibold text-white disabled:opacity-40">
              {busy ? '…' : t('milestone.save')}
            </button>
          </div>
        )}
      </div>
      {saveError && <p className="text-sm text-state-red-deep" role="alert">{saveError}</p>}
    </div>
  );
}
