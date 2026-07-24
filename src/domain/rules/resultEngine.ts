// Rule-Based Result Engine (Phase 8).
//
// Transparent, configurable, deterministic scoring. NO generative AI.
// Output is a supportive, strengths-based result — never a diagnosis, score,
// percentage, or probability.
//
// State meaning (from spec):
//  GREEN  — skills broadly align with the review set; no urgent rule triggered.
//  YELLOW — some skills still emerging; suggest activities + repeat review.
//  ORANGE — multiple/repeated concerns; suggest professional consultation.
//  RED    — urgent symptoms / regression / skill loss; prompt action.

import type { MilestoneAnswer, ResultState, DevelopmentDomain } from '../types';
import { evaluateSafety, type SafetyInput, type SafetyOutcome } from '../safety/safety';

export interface MilestoneResponseInput {
  milestoneId: string;
  domain: DevelopmentDomain;
  answer: MilestoneAnswer;
  /** True if this milestone was also "not yet"/concerning in a previous session. */
  repeatedConcern?: boolean;
}

/** Tunable thresholds. Stored here as validated config (could be DB-backed). */
export interface ResultThresholds {
  /** Ratio of concern answers (of answered, non "not_sure") to enter YELLOW. */
  yellowConcernRatio: number;
  /** Ratio to enter ORANGE. */
  orangeConcernRatio: number;
  /** Number of repeated concerns that forces at least ORANGE. */
  repeatedConcernsForOrange: number;
}

export const DEFAULT_THRESHOLDS: ResultThresholds = {
  yellowConcernRatio: 0.2,
  orangeConcernRatio: 0.4,
  repeatedConcernsForOrange: 2,
};

export interface ResultBreakdown {
  answered: number;
  yes: number;
  sometimes: number;
  notYet: number;
  notSure: number;
  repeatedConcerns: number;
  /** concern weight = notYet*1 + sometimes*0.5, over answered-excluding-notSure. */
  concernRatio: number;
}

export interface MilestoneResult {
  state: ResultState;
  breakdown: ResultBreakdown;
  safety: SafetyOutcome;
  /** Always true — every result is explicitly non-diagnostic. */
  isDiagnostic: false;
  /** i18n keys the UI expands into content; keeps engine text-free. */
  guidanceKeys: {
    strengths: 'result.strengths';
    emerging: 'result.emerging';
    activities: 'result.activities';
    repeatReview: `result.repeat.${ResultState}`;
    consult: `result.consult.${ResultState}`;
    disclaimer: 'result.disclaimer.nonDiagnostic';
  };
  /** Suggested days until repeat review, by state. */
  repeatReviewDays: number;
}

const REPEAT_DAYS: Record<ResultState, number> = {
  green: 90,
  yellow: 30,
  orange: 14,
  red: 0, // act now; no "wait and repeat"
};

export function computeResult(
  responses: MilestoneResponseInput[],
  safetyInput: SafetyInput,
  thresholds: ResultThresholds = DEFAULT_THRESHOLDS,
): MilestoneResult {
  const safety = evaluateSafety(safetyInput);

  let yes = 0;
  let sometimes = 0;
  let notYet = 0;
  let notSure = 0;
  let repeatedConcerns = 0;

  for (const r of responses) {
    switch (r.answer) {
      case 'yes':
        yes += 1;
        break;
      case 'sometimes':
        sometimes += 1;
        break;
      case 'not_yet':
        notYet += 1;
        break;
      case 'not_sure':
        notSure += 1;
        break;
    }
    if (r.repeatedConcern && (r.answer === 'not_yet' || r.answer === 'sometimes')) {
      repeatedConcerns += 1;
    }
  }

  const answered = responses.length;
  const denom = answered - notSure; // "not sure" is neutral, excluded from ratio
  const concernWeight = notYet * 1 + sometimes * 0.5;
  const concernRatio = denom > 0 ? concernWeight / denom : 0;

  const breakdown: ResultBreakdown = {
    answered,
    yes,
    sometimes,
    notYet,
    notSure,
    repeatedConcerns,
    concernRatio,
  };

  // RED takes absolute precedence and comes ONLY from the deterministic safety engine.
  let state: ResultState;
  if (safety.urgent) {
    state = 'red';
  } else if (
    concernRatio >= thresholds.orangeConcernRatio ||
    repeatedConcerns >= thresholds.repeatedConcernsForOrange
  ) {
    state = 'orange';
  } else if (concernRatio >= thresholds.yellowConcernRatio) {
    state = 'yellow';
  } else {
    state = 'green';
  }

  return {
    state,
    breakdown,
    safety,
    isDiagnostic: false,
    guidanceKeys: {
      strengths: 'result.strengths',
      emerging: 'result.emerging',
      activities: 'result.activities',
      repeatReview: `result.repeat.${state}`,
      consult: `result.consult.${state}`,
      disclaimer: 'result.disclaimer.nonDiagnostic',
    },
    repeatReviewDays: REPEAT_DAYS[state],
  };
}
