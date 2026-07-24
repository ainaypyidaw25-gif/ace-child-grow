import { useMemo, useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { SAMPLE_MILESTONES, isApprovedForParents } from '../data/seed/content';
import { computeResult, type MilestoneResponseInput } from '../domain/rules/resultEngine';
import { SafetyBanner } from '../components/SafetyBanner';
import { ReviewBadge } from '../components/ReviewBadge';
import type { MilestoneAnswer } from '../domain/types';
import type { TranslationKey } from '../i18n';

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

/**
 * Milestone checklist demo — one milestone per step (mobile friendly), wired to the
 * REAL rule engine + safety engine. All content shows a Clinical Review badge.
 */
export function MilestoneDemo() {
  const { t, locale } = useLocale();
  const items = SAMPLE_MILESTONES;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, MilestoneAnswer>>({});
  const [lostSkill, setLostSkill] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const current = items[step];
  const answered = Object.keys(answers).length;

  const result = useMemo(() => {
    if (!submitted) return null;
    const responses: MilestoneResponseInput[] = items.map((m, i) => ({
      milestoneId: String(i),
      domain: m.domain,
      answer: answers[i] ?? 'not_sure',
    }));
    return computeResult(responses, { confirmedSymptoms: [], lostSkill: lostSkill === true });
  }, [submitted, answers, lostSkill, items]);

  if (result) {
    return (
      <div className="space-y-4">
        {result.safety.urgent && <SafetyBanner />}
        <section className={`rounded-card border-2 ${STATE_COLOR[result.state]} bg-white p-5`}>
          <h1 className="text-lg font-bold">{t('report.title')}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {t(result.guidanceKeys.consult)} · {t(result.guidanceKeys.repeatReview)}
          </p>
          <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-ink-soft">
            {t('result.disclaimer.nonDiagnostic')}
          </p>
        </section>
        <button
          type="button"
          className="rounded-pill bg-sky px-5 py-3 font-semibold text-white"
          onClick={() => {
            setSubmitted(false);
            setStep(0);
          }}
        >
          {t('milestone.resume')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft">
          {step + 1} / {items.length}
        </span>
        <ReviewBadge published={isApprovedForParents(current.reviewStatus)} />
      </div>

      <section className="rounded-card border border-line bg-white p-5 shadow-card">
        <h1 className="text-lg font-semibold">
          {locale === 'mm' ? current.titleMm : current.titleEn}
        </h1>
        <p className="mt-2 text-ink-soft">
          {locale === 'mm' ? current.questionMm : current.questionEn}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(Object.keys(ANSWER_KEYS) as MilestoneAnswer[]).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={answers[step] === a}
              onClick={() => setAnswers((prev) => ({ ...prev, [step]: a }))}
              className={`min-h-touch rounded-xl border px-3 py-3 text-sm font-medium
                ${answers[step] === a ? 'border-sky bg-mint-soft text-sky-deep' : 'border-line bg-white text-ink'}`}
            >
              {t(ANSWER_KEYS[a])}
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-between gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="min-h-touch rounded-pill border border-line bg-white px-5 py-2 disabled:opacity-40"
        >
          {t('milestone.prev')}
        </button>
        {step < items.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(items.length - 1, s + 1))}
            className="min-h-touch rounded-pill bg-sky px-5 py-2 font-semibold text-white"
          >
            {t('milestone.next')}
          </button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <fieldset className="rounded-xl border border-line bg-white p-3 text-sm">
              <legend className="px-1 text-ink-soft">{t('safety.skillLoss.question')}</legend>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  aria-pressed={lostSkill === true}
                  onClick={() => setLostSkill(true)}
                  className={`min-h-touch rounded-pill px-4 py-1 ${lostSkill === true ? 'bg-state-red text-white' : 'border border-line'}`}
                >
                  {t('milestone.answer.yes')}
                </button>
                <button
                  type="button"
                  aria-pressed={lostSkill === false}
                  onClick={() => setLostSkill(false)}
                  className={`min-h-touch rounded-pill px-4 py-1 ${lostSkill === false ? 'bg-mint text-white' : 'border border-line'}`}
                >
                  {t('milestone.answer.not_yet')}
                </button>
              </div>
            </fieldset>
            <button
              type="button"
              disabled={answered === 0 || lostSkill === null}
              onClick={() => setSubmitted(true)}
              className="min-h-touch rounded-pill bg-sky-deep px-6 py-2 font-semibold text-white disabled:opacity-40"
            >
              {t('milestone.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
