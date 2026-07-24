import { describe, it, expect } from 'vitest';
import { rowToChild, childToInsert, growthToInsert, type ChildRow } from '../../lib/repository';
import type { Child } from '../../app/childStore';

const row: ChildRow = {
  id: 'c1',
  parent_id: 'p1',
  nickname: 'Star',
  birth_date: '2024-02-01',
  sex: 'female',
  gestational_weeks: 32,
  use_corrected_age: true,
};

describe('repository mappers (pure)', () => {
  it('maps a DB row to a domain child', () => {
    const child = rowToChild(row);
    expect(child).toEqual({
      id: 'c1',
      nickname: 'Star',
      birthDate: '2024-02-01',
      sex: 'female',
      gestationalWeeks: 32,
      useCorrectedAge: true,
    });
  });

  it('maps null DB fields to undefined', () => {
    const child = rowToChild({ ...row, sex: null, gestational_weeks: null });
    expect(child.sex).toBeUndefined();
    expect(child.gestationalWeeks).toBeUndefined();
  });

  it('builds an insert payload with the session parent id', () => {
    const child: Child = {
      id: 'c2', nickname: 'Sky', birthDate: '2025-01-01', useCorrectedAge: false,
    };
    const ins = childToInsert(child, 'parent-99');
    expect(ins.parent_id).toBe('parent-99');
    expect(ins.sex).toBe('unspecified');
    expect(ins.gestational_weeks).toBeNull();
  });

  it('normalizes growth values to kg/cm on insert', () => {
    const ins = growthToInsert({
      childId: 'c1', parentId: 'p1', measuredOn: '2026-07-01',
      weight: { value: 22.0462, unit: 'lb' },
      height: { value: 39.3701, unit: 'in' },
    });
    expect(Math.round((ins.weight_kg as number) * 100) / 100).toBe(10);
    expect(Math.round((ins.height_cm as number) * 100) / 100).toBe(100);
    expect(ins.input_weight_unit).toBe('lb');
  });
});
