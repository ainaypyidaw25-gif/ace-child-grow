import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { computeResult, type MilestoneResponseInput } from '../domain/rules/resultEngine';
import { SafetyBanner } from '../components/SafetyBanner';
import type { DevelopmentDomain, MilestoneAnswer } from '../domain/types';
import type { TranslationKey } from '../i18n';
import { chronologicalAge } from '../domain/age/age';
import { resolveAgeGroup } from '../content/taxonomy';
import { NoChild } from './Growth';

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
    ? chronologicalAge(new Date(activeChild.birthDate), new Date()).totalMonths
    : 0;
  const ageGroupKey = resolveAgeGroup(ageMonths)?.key;
  const data = useQuery(api.library.listByType, {
    type: 'milestone',
    ageGroupKey,
  });
  const recordSession = useMutation(api.milestones.recordSession);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, MilestoneAnswer>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [lostSkill, setLostSkill] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');

  const items = useMemo(() => data?.items ?? [], [data]);
  const current = items[step];
  const answered = Object.keys(answers).length;
  const result = useMemo(() => {
    if (!submitted) return null;
    const responses: MilestoneResponseInput[] = items.map((item, index) => ({
      milestoneId: item.slug,
      domain: normalizeDomain(item.domainKey),
      answer: answers[index] ?? 'not_sure',
    }));
    return computeResult(responses, { confirmedSymptoms: [], lostSkill: lostSkill === true });
  }, [submitted, answers, lostSkill, items]);

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
            ? 'လက်ရှိအပြည့်အစုံ သုံးနိုင်သော အသက်အပိုင်းအခြားမှာ မွေးကင်းမှ ၁၂ လအထိ ဖြစ်ပါသည်။'
            : 'The currently complete age range is birth through 12 months.'}
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

  async function save() {
    if (!activeChild || lostSkill === null) return;
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
      { confirmedSymptoms: [], lostSkill },
    );
    try {
      await recordSession({
        childId: activeChild.id as never,
        ageGroupKey,
        resultState: computed.state,
        lostSkill,
        resultSnapshot: {
          state: computed.state,
          answeredCount: answered,
          completedAt: Date.now(),
        },
        responses,
      });
      setSubmitted(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : (locale === 'mm' ? 'သိမ်း၍ မရပါ။' : 'Could not save.'));
    } finally {
      setBusy(false);
    }
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

      <div className="flex justify-between gap-2">
        <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="min-h-touch rounded-pill border border-line bg-white px-5 py-2 disabled:opacity-40">
          {t('milestone.prev')}
        </button>
        {step < items.length - 1 ? (
          <button type="button" disabled={!answers[step]} onClick={() => setStep((value) => Math.min(items.length - 1, value + 1))} className="min-h-touch rounded-pill bg-sky px-6 py-2 font-semibold text-white disabled:opacity-40">
            {t('milestone.next')}
          </button>
        ) : (
          <div className="flex max-w-sm flex-col items-end gap-2">
            <fieldset className="rounded-2xl border border-line bg-white p-3 text-sm">
              <legend className="px-1 text-ink-soft">{t('safety.skillLoss.question')}</legend>
              <div className="mt-1 flex gap-2">
                <button type="button" aria-pressed={lostSkill === true} onClick={() => setLostSkill(true)} className={`min-h-touch rounded-pill px-4 py-2 ${lostSkill === true ? 'bg-state-red text-white' : 'border border-line'}`}>{t('milestone.answer.yes')}</button>
                <button type="button" aria-pressed={lostSkill === false} onClick={() => setLostSkill(false)} className={`min-h-touch rounded-pill px-4 py-2 ${lostSkill === false ? 'bg-mint text-white' : 'border border-line'}`}>{locale === 'mm' ? 'မရှိပါ' : 'No'}</button>
              </div>
            </fieldset>
            <button type="button" disabled={busy || answered !== items.length || lostSkill === null} onClick={() => void save()} className="min-h-touch rounded-pill bg-sky-deep px-6 py-2 font-semibold text-white disabled:opacity-40">
              {busy ? '…' : t('milestone.save')}
            </button>
          </div>
        )}
      </div>
      {saveError && <p className="text-sm text-state-red" role="alert">{saveError}</p>}
    </div>
  );
}
