// Report builder (Phase 15). Pure assembly from already-stored data only.
// Three report types. The share-safe report NEVER includes sensitive parent
// notes or saved concerns. Every report carries a non-diagnostic disclaimer.

import type { ResultState } from '../types';

export type ReportType = 'parent_monthly' | 'doctor_visit' | 'share_safe';

export interface ReportSourceData {
  childNickname: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  chronologicalAgeLabel: string;
  correctedAgeLabel?: string;
  strengths: string[];
  emergingSkills: string[];
  latestResultState?: ResultState;
  completedActivities: string[];
  parentNotes: string[]; // sensitive
  savedConcerns: string[]; // sensitive
  growthSummary?: string;
  sleepSummary?: string;
  questionsForProfessional: string[];
  nextReviewDate?: string;
}

export interface BuiltReport {
  type: ReportType;
  childNickname: string;
  period: { start: string; end: string };
  chronologicalAgeLabel: string;
  correctedAgeLabel?: string;
  strengths: string[];
  emergingSkills: string[];
  latestResultState?: ResultState;
  completedActivities: string[];
  parentNotes: string[]; // empty for share_safe
  savedConcerns: string[]; // empty for share_safe
  growthSummary?: string;
  sleepSummary?: string;
  questionsForProfessional: string[];
  nextReviewDate?: string;
  disclaimerKey: 'result.disclaimer.nonDiagnostic';
  containsSensitiveNotes: boolean;
}

export class ReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}

export function buildReport(type: ReportType, data: ReportSourceData): BuiltReport {
  if (new Date(data.periodStart) > new Date(data.periodEnd)) {
    throw new ReportError('periodStart must be on or before periodEnd');
  }
  const shareSafe = type === 'share_safe';
  return {
    type,
    childNickname: data.childNickname,
    period: { start: data.periodStart, end: data.periodEnd },
    chronologicalAgeLabel: data.chronologicalAgeLabel,
    correctedAgeLabel: data.correctedAgeLabel,
    strengths: data.strengths,
    emergingSkills: data.emergingSkills,
    latestResultState: data.latestResultState,
    completedActivities: data.completedActivities,
    // Sensitive fields are stripped from the share-safe report.
    parentNotes: shareSafe ? [] : data.parentNotes,
    savedConcerns: shareSafe ? [] : data.savedConcerns,
    growthSummary: data.growthSummary,
    sleepSummary: data.sleepSummary,
    questionsForProfessional: data.questionsForProfessional,
    nextReviewDate: data.nextReviewDate,
    disclaimerKey: 'result.disclaimer.nonDiagnostic',
    containsSensitiveNotes: !shareSafe && (data.parentNotes.length > 0 || data.savedConcerns.length > 0),
  };
}
