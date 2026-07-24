// Data-access layer over Supabase. All reads/writes pass through RLS, so a
// parent can only ever touch their own rows (server-enforced).
//
// The row<->domain mappers are pure and unit-tested; the async CRUD requires a
// configured client and throws clearly otherwise (no fake success).
import { getSupabase } from './supabase';
import type { Child } from '../app/childStore';
import { toKg, toCm, type WeightUnit, type LengthUnit } from '../domain/growth/units';

export class BackendUnavailableError extends Error {
  constructor() {
    super('Data backend is not configured (no Supabase credentials).');
    this.name = 'BackendUnavailableError';
  }
}

function requireClient() {
  const c = getSupabase();
  if (!c) throw new BackendUnavailableError();
  return c;
}

// ---- children ----
export interface ChildRow {
  id: string;
  parent_id: string;
  nickname: string;
  birth_date: string;
  sex: 'female' | 'male' | 'unspecified' | null;
  gestational_weeks: number | null;
  use_corrected_age: boolean;
}

/** Pure: DB row → domain Child. */
export function rowToChild(row: ChildRow): Child {
  return {
    id: row.id,
    nickname: row.nickname,
    birthDate: row.birth_date,
    sex: row.sex ?? undefined,
    gestationalWeeks: row.gestational_weeks ?? undefined,
    useCorrectedAge: row.use_corrected_age,
  };
}

/** Pure: domain Child → insert payload (parent_id supplied by caller/session). */
export function childToInsert(child: Child, parentId: string) {
  return {
    id: child.id,
    parent_id: parentId,
    nickname: child.nickname,
    birth_date: child.birthDate,
    sex: child.sex ?? 'unspecified',
    gestational_weeks: child.gestationalWeeks ?? null,
    use_corrected_age: child.useCorrectedAge,
  };
}

export async function listChildren(): Promise<Child[]> {
  const { data, error } = await requireClient()
    .from('children')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ChildRow[]).map(rowToChild);
}

export async function insertChild(child: Child, parentId: string): Promise<void> {
  const { error } = await requireClient().from('children').insert(childToInsert(child, parentId));
  if (error) throw error;
}

// ---- growth ----
/** Pure: build a normalized growth insert (values converted to kg/cm). */
export function growthToInsert(input: {
  childId: string;
  parentId: string;
  measuredOn: string;
  weight?: { value: number; unit: WeightUnit };
  height?: { value: number; unit: LengthUnit };
  notes?: string;
}) {
  return {
    child_id: input.childId,
    parent_id: input.parentId,
    measured_on: input.measuredOn,
    weight_kg: input.weight ? toKg(input.weight.value, input.weight.unit) : null,
    height_cm: input.height ? toCm(input.height.value, input.height.unit) : null,
    input_weight_unit: input.weight?.unit ?? null,
    input_length_unit: input.height?.unit ?? null,
    notes: input.notes ?? null,
  };
}

export async function insertGrowthRecord(input: Parameters<typeof growthToInsert>[0]): Promise<void> {
  const { error } = await requireClient().from('growth_records').insert(growthToInsert(input));
  if (error) throw error;
}
