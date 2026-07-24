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
  'loss_of_acquired_skills',
] as const;
export type UrgentSymptom = (typeof URGENT_SYMPTOMS)[number];

/** Fixed emergency message. Text only — no fabricated numbers. */
export const EMERGENCY_MESSAGE = {
  mm: 'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ သို့မဟုတ် သင့်ဒေသရှိ အရေးပေါ်နံပါတ်ကို ဆက်သွယ်ပါ။',
  en: 'Go to the nearest emergency health service immediately, or call your local emergency number.',
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
  urgent: boolean;
  /** When urgent, the fixed message to show. Undefined otherwise. */
  message?: { mm: string; en: string };
  /** All triggers that fired (for audit + display). */
  triggers: UrgentSymptom[];
  /** True when the skill-loss concern must be saved to the child's record. */
  saveSkillLossConcern: boolean;
}

/**
 * Evaluate urgent safety. Deterministic; safe to run before/without any result.
 * Skill loss is folded into the trigger list so downstream code has a single
 * source of truth.
 */
export function evaluateSafety(input: SafetyInput): SafetyOutcome {
  const triggers = new Set<UrgentSymptom>(
    (input.confirmedSymptoms ?? []).filter((s): s is UrgentSymptom =>
      (URGENT_SYMPTOMS as readonly string[]).includes(s),
    ),
  );
  if (input.lostSkill) triggers.add('loss_of_acquired_skills');

  const urgent = triggers.size > 0;
  return {
    urgent,
    message: urgent ? EMERGENCY_MESSAGE : undefined,
    triggers: Array.from(triggers),
    saveSkillLossConcern: input.lostSkill === true,
  };
}
