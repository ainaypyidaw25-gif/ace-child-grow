import { describe, expect, it } from 'vitest';
import {
  MYANMAR_VACCINATION_GROUPS,
  MYANMAR_VACCINATION_SCHEDULE,
  isMatchingVaccinationRecord,
  vaccinationDueDate,
} from '../health/myanmarVaccinationSchedule';

describe('Myanmar national EPI schedule', () => {
  it('contains the complete birth-to-18-month routine schedule without duplicate identities', () => {
    expect(MYANMAR_VACCINATION_SCHEDULE).toHaveLength(18);
    expect(MYANMAR_VACCINATION_GROUPS.map((group) => group.ageMonths)).toEqual([0, 2, 4, 6, 9, 18]);
    const identities = MYANMAR_VACCINATION_SCHEDULE.map((item) => `${item.vaccineName}:${item.doseLabel}`);
    expect(new Set(identities).size).toBe(identities.length);
  });

  it('includes the 18-month pentavalent fourth dose and second MR dose', () => {
    expect(MYANMAR_VACCINATION_SCHEDULE).toEqual(expect.arrayContaining([
      expect.objectContaining({ vaccineName: 'DTP-Hib-HepB', doseLabel: 'Dose 4', ageMonths: 18 }),
      expect.objectContaining({ vaccineName: 'MR', doseLabel: 'Dose 2', ageMonths: 18 }),
    ]));
  });

  it('calculates due dates using calendar months and clamps month-end dates', () => {
    expect(vaccinationDueDate('2026-01-31', 0)).toBe('2026-01-31');
    expect(vaccinationDueDate('2026-01-31', 2)).toBe('2026-03-31');
    expect(vaccinationDueDate('2025-12-31', 2)).toBe('2026-02-28');
  });

  it('matches saved records by canonical vaccine and dose identity', () => {
    const firstPenta = MYANMAR_VACCINATION_SCHEDULE.find((item) => item.id === 'penta-1')!;
    expect(isMatchingVaccinationRecord(firstPenta, { vaccineName: ' dtp-hib-hepb ', doseLabel: 'DOSE 1' })).toBe(true);
    expect(isMatchingVaccinationRecord(firstPenta, { vaccineName: 'DTP-Hib-HepB', doseLabel: 'Dose 2' })).toBe(false);
  });
});
