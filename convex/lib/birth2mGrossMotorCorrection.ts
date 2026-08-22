/**
 * Durable guardrails for the bounded birth-to-2-month gross-motor correction.
 *
 * Production currently carries an older published body and a broad evidence
 * edge for this slug. The corrected authored seed and exact source mapping are
 * proposals until an exact-state release moves the row back through human
 * review. Generic seed/source/link imports must therefore skip these exact
 * identities rather than applying part of the correction.
 */
export const BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET = {
  kind: 'milestone',
  slug: 'ms_birth_2m_gross_motor_1',
  exactSourceId: 'cdc-milestones-2m-2026',
} as const;

export function isBirth2mGrossMotorCorrectionSlug(slug: string): boolean {
  return slug === BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.slug;
}

export function isBirth2mGrossMotorCorrectionLink(
  kind: string,
  slug: string,
): boolean {
  return kind === BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.kind
    && slug === BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.slug;
}

export function isBirth2mGrossMotorCorrectionSource(sourceId: string): boolean {
  return sourceId === BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.exactSourceId;
}
