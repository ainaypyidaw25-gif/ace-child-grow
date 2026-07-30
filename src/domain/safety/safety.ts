// Urgent Safety Engine (Phase 9).
//
// CRITICAL SAFETY CONTRACT:
//  - This engine is 100% deterministic and rule-based. It must NEVER call, wait
//    for, or depend on any generative AI. Urgent guidance must be computable
//    offline and instantly.
//  - It never fabricates emergency phone numbers or facilities.
//  - A triggered urgent flag INTERRUPTS any reassuring milestone result.

export const URGENT_SYMPTOMS = [
  'severe_breathing_difficulty',
  'blue_lips',
  'breathing_pauses',
  'seizure',
  'unresponsiveness',
  'sudden_weakness',
  'serious_injury',
  'severe_dehydration',
] as const;
export type UrgentSymptom = (typeof URGENT_SYMPTOMS)[number];

export const DEVELOPMENTAL_CONCERNS = ['loss_of_acquired_skills'] as const;
export type DevelopmentalConcern = (typeof DEVELOPMENTAL_CONCERNS)[number];

/** Fixed emergency message. Text only — no fabricated numbers. */
export const EMERGENCY_MESSAGE = {
  mm: 'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ သို့မဟုတ် သင့်ဒေသရှိ အရေးပေါ်နံပါတ်ကို ဆက်သွယ်ပါ။',
  en: 'Go to the nearest emergency health service immediately, or call your local emergency number.',
} as const;

/**
 * Skill loss needs prompt professional assessment, but is not by itself an
 * instruction to use emergency services. Acute emergency signs are evaluated
 * separately and still take precedence when they are present.
 */
export const SKILL_LOSS_ASSESSMENT_MESSAGE = {
  mm: 'ကလေးက အရင်လုပ်နိုင်ခဲ့သော ကျွမ်းကျင်မှုတစ်ခုခုကို မလုပ်နိုင်တော့ပါက ကလေးကျန်းမာရေး သို့မဟုတ် ကလေးဖွံ့ဖြိုးရေးဆိုင်ရာ ကျွမ်းကျင်ပညာရှင်ကို အမြန်ဆုံး ဆက်သွယ်ပြီး အကဲဖြတ်မှု ခံယူပါ။ အရေးပေါ်လက္ခဏာများလည်း ရှိပါက အရေးပေါ်စောင့်ရှောက်မှု ရယူပါ။',
  en: 'Contact a qualified child health or developmental professional promptly for an assessment if your child has lost a previously acquired skill. If emergency signs are also present, seek emergency care immediately.',
} as const;

/** The mandatory skill-loss question. A "yes" always saves a concern and elevates. */
export const SKILL_LOSS_QUESTION = {
  mm: 'ကလေးက အရင်လုပ်နိုင်ခဲ့သော စကားပြောခြင်း၊ လှုပ်ရှားခြင်း သို့မဟုတ် လူမှုဆက်ဆံရေးကျွမ်းကျင်မှု တစ်ခုခုကို မလုပ်နိုင်တော့ပါသလား။',
  en: 'Has your child lost any skill they could previously do?',
} as const;

export interface SafetyInput {
  /** Symptoms the parent has affirmatively confirmed. */
  confirmedSymptoms: UrgentSymptom[];
  /** Answer to the mandatory skill-loss question. */
  lostSkill: boolean;
}

export interface SafetyOutcome {
  /** True only when at least one confirmed acute emergency sign is present. */
  urgent: boolean;
  /** When urgent, the fixed message to show. Undefined otherwise. */
  message?: { mm: string; en: string };
  /** Confirmed acute emergency triggers (for audit + display). */
  triggers: UrgentSymptom[];
  /** True when developmental regression needs prompt professional assessment. */
  professionalAssessmentRecommended: boolean;
  /** Fixed, non-diagnostic assessment guidance for developmental regression. */
  professionalAssessmentMessage?: { mm: string; en: string };
  /** Developmental concerns kept separate from acute emergency triggers. */
  developmentalConcerns: DevelopmentalConcern[];
  /** True when the skill-loss concern must be saved to the child's record. */
  saveSkillLossConcern: boolean;
}

/**
 * Evaluate urgent safety. Deterministic; safe to run before/without any result.
 * Developmental regression is intentionally kept separate from acute emergency
 * triggers. Regression alone recommends prompt professional assessment; it
 * never produces the emergency message unless an acute sign is also present.
 */
export function evaluateSafety(input: SafetyInput): SafetyOutcome {
  const triggers = new Set<UrgentSymptom>(
    (input.confirmedSymptoms ?? []).filter((s): s is UrgentSymptom =>
      (URGENT_SYMPTOMS as readonly string[]).includes(s),
    ),
  );

  const urgent = triggers.size > 0;
  const professionalAssessmentRecommended = input.lostSkill === true;
  return {
    urgent,
    message: urgent ? EMERGENCY_MESSAGE : undefined,
    triggers: Array.from(triggers),
    professionalAssessmentRecommended,
    professionalAssessmentMessage: professionalAssessmentRecommended
      ? SKILL_LOSS_ASSESSMENT_MESSAGE
      : undefined,
    developmentalConcerns: professionalAssessmentRecommended
      ? ['loss_of_acquired_skills']
      : [],
    saveSkillLossConcern: professionalAssessmentRecommended,
  };
}
