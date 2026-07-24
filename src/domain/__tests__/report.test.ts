import { describe, it, expect } from 'vitest';
import { buildReport, ReportError, type ReportSourceData } from '../reports/report';

const base: ReportSourceData = {
  childNickname: 'Little Star',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  chronologicalAgeLabel: '1 year 6 months',
  correctedAgeLabel: '1 year 4 months',
  strengths: ['Sits well', 'Smiles often'],
  emergingSkills: ['First words'],
  latestResultState: 'yellow',
  completedActivities: ['Shared reading'],
  parentNotes: ['Was a bit unwell last week'],
  savedConcerns: ['Not pointing yet'],
  growthSummary: 'Weight tracking steadily',
  sleepSummary: 'Avg 11h/night',
  questionsForProfessional: ['Should we watch speech?'],
  nextReviewDate: '2026-07-28',
};

describe('report builder', () => {
  it('includes sensitive notes in the doctor-visit report', () => {
    const r = buildReport('doctor_visit', base);
    expect(r.parentNotes.length).toBe(1);
    expect(r.savedConcerns.length).toBe(1);
    expect(r.containsSensitiveNotes).toBe(true);
  });

  it('strips sensitive notes from the share-safe report', () => {
    const r = buildReport('share_safe', base);
    expect(r.parentNotes).toEqual([]);
    expect(r.savedConcerns).toEqual([]);
    expect(r.containsSensitiveNotes).toBe(false);
  });

  it('always carries the non-diagnostic disclaimer', () => {
    for (const t of ['parent_monthly', 'doctor_visit', 'share_safe'] as const) {
      expect(buildReport(t, base).disclaimerKey).toBe('result.disclaimer.nonDiagnostic');
    }
  });

  it('preserves corrected age label when present', () => {
    expect(buildReport('parent_monthly', base).correctedAgeLabel).toBe('1 year 4 months');
  });

  it('rejects an inverted period', () => {
    expect(() =>
      buildReport('parent_monthly', { ...base, periodStart: '2026-07-01', periodEnd: '2026-06-01' }),
    ).toThrowError(ReportError);
  });
});
