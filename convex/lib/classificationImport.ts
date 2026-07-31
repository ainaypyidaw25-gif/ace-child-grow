/**
 * Classification import — PREVIEW/PLAN ONLY in this build.
 *
 * The owner's classification artefacts (CSV/JSON from the 2026-07-30 dry run)
 * are audit and migration-input documents; reviewers never work inside them.
 * This module turns that JSON plus the deployment's own rows into a
 * deterministic, idempotent PLAN of governance-field changes. Nothing here
 * writes: there is deliberately NO mutation that applies a plan in this build.
 * Applying is a future task behind an explicit owner confirmation.
 *
 * Invariants the plan enforces by construction (task Part 5):
 *   - matches by stable slug only
 *   - carries the reviewRevision observed at plan time; the future importer
 *     must re-read and REFUSE any row whose revision has moved (stale row)
 *   - proposes ONLY the additive governance fields — it can never contain
 *     clinicalStatus, reviewScope, publicationStatus, reviewer identity,
 *     approvals or assignments, so those cannot be written even by mistake
 *   - a row already carrying the proposed values produces NO change, so a
 *     second identical run proposes zero changes
 *   - it never touches contentReviews or auditLogs
 *
 * Pure by design — no Convex imports — so the browser preview screen and
 * Vitest exercise exactly the code a future importer would trust.
 */

import {
  computePriority,
  requiredDimensionsFor,
  isParentVisible,
  type OwnerPriority,
  type RiskClass,
} from './ownerPriority';

/** One record of the owner-supplied classification JSON (extra keys ignored). */
export interface ClassificationRecordInput {
  slug: string;
  proposedClassification: string;
  classificationReason?: string;
  triggersFired?: string;
  proposedReviewDimensions?: string;
  reviewRevision?: number | string;
}

export interface ClassificationFileInput {
  summary?: { generatedFrom?: string; totalRecords?: number };
  records: ClassificationRecordInput[];
}

/** The deployment row snapshot the plan is built against (read-only). */
export interface ServerRowSnapshot {
  slug: string;
  type: string;
  clinicalStatus: string;
  reviewRevision: number | null;
  riskClassification: RiskClass | null;
  ownerPriority: OwnerPriority | null;
  riskReasons: string[] | null;
  requiredReviewDimensions: string[] | null;
  classificationRunId: string | null;
  priorityStatus: string | null;
}

export interface ProposedGovernanceChange {
  slug: string;
  /** Revision the plan was built against; apply must re-verify and refuse on mismatch. */
  expectedReviewRevision: number;
  fields: {
    riskClassification: RiskClass;
    ownerPriority: OwnerPriority;
    riskReasons: string[];
    requiredReviewDimensions: string[];
    classificationSource: string;
    classificationRunId: string;
    /** Set only when the row has no priorityStatus yet — never downgraded. */
    priorityStatus?: 'unreviewed';
  };
}

export interface ImportPlan {
  runId: string;
  expectedRecords: number;
  matched: number;
  missingSlugs: string[];
  unknownSlugs: string[];
  duplicateSlugs: string[];
  revisionConflicts: Array<{ slug: string; fileRevision: string; serverRevision: number }>;
  changes: ProposedGovernanceChange[];
  unchanged: string[];
  classCounts: Record<RiskClass, number>;
  priorityCounts: Record<OwnerPriority, number>;
  parentVisibleNow: number;
  /** Import writes governance labels only — visibility can never change. */
  parentVisibleAfterImport: number;
  importEnabled: false;
}

const VALID_CLASSES = new Set<string>(['A', 'B', 'C', 'D', 'E']);

function normalizeDimensions(recordDims: string | undefined, riskClass: RiskClass): string[] {
  if (recordDims && !/manager|triage/i.test(recordDims)) {
    const mapped = recordDims
      .split('+')
      .map((dimension) => dimension.trim().toLowerCase())
      .map((dimension) => {
        if (dimension.startsWith('myanmar')) return 'native_myanmar';
        if (dimension.startsWith('english')) return 'english';
        if (dimension.startsWith('child')) return 'child_development';
        return dimension;
      })
      .filter((dimension) => dimension.length > 0);
    if (mapped.length > 0) return mapped;
  }
  return requiredDimensionsFor(riskClass);
}

export function buildImportPlan(
  file: ClassificationFileInput,
  serverRows: ServerRowSnapshot[],
  options: { runId: string; source?: string; expectedRecords?: number },
): ImportPlan {
  const source = options.source ?? 'classification-json-2026-07-30';
  const expectedRecords = options.expectedRecords ?? 383;
  const serverBySlug = new Map(serverRows.map((row) => [row.slug, row]));

  const seen = new Set<string>();
  const duplicateSlugs: string[] = [];
  const missingSlugs: string[] = [];
  const revisionConflicts: ImportPlan['revisionConflicts'] = [];
  const changes: ProposedGovernanceChange[] = [];
  const unchanged: string[] = [];
  const classCounts: Record<RiskClass, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const priorityCounts: Record<OwnerPriority, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };

  for (const record of file.records) {
    if (seen.has(record.slug)) {
      duplicateSlugs.push(record.slug);
      continue;
    }
    seen.add(record.slug);
    const server = serverBySlug.get(record.slug);
    if (!server) {
      missingSlugs.push(record.slug);
      continue;
    }
    if (!VALID_CLASSES.has(record.proposedClassification)) {
      revisionConflicts.push({
        slug: record.slug,
        fileRevision: `invalid class ${record.proposedClassification}`,
        serverRevision: server.reviewRevision ?? 1,
      });
      continue;
    }
    const riskClass = record.proposedClassification as RiskClass;
    const serverRevision = server.reviewRevision ?? 1;
    const fileRevision = record.reviewRevision;
    // The artefact recorded the revision it observed; 'ABSENT' matches a row
    // that still has none. Any other disagreement is a conflict the future
    // importer must refuse — the content moved since classification.
    if (fileRevision !== undefined) {
      const fileSaysAbsent = fileRevision === 'ABSENT';
      const rowIsAbsent = server.reviewRevision === null;
      const numericMatch = typeof fileRevision === 'number' && fileRevision === server.reviewRevision;
      if (!(fileSaysAbsent ? rowIsAbsent : numericMatch)) {
        revisionConflicts.push({ slug: record.slug, fileRevision: String(fileRevision), serverRevision });
        continue;
      }
    }

    const riskReasons = [record.classificationReason, record.triggersFired]
      .filter((reason): reason is string => !!reason && reason.length > 0);
    const priority = computePriority({
      slug: record.slug,
      type: server.type,
      titleMm: '',
      titleEn: '',
      data: {},
      clinicalStatus: server.clinicalStatus,
      riskClassification: riskClass,
      riskReasons,
    }).priority;
    const requiredReviewDimensions = normalizeDimensions(record.proposedReviewDimensions, riskClass);
    classCounts[riskClass] += 1;
    priorityCounts[priority] += 1;

    const already =
      server.riskClassification === riskClass &&
      server.ownerPriority === priority &&
      server.classificationRunId === options.runId &&
      JSON.stringify(server.riskReasons ?? []) === JSON.stringify(riskReasons) &&
      JSON.stringify(server.requiredReviewDimensions ?? []) === JSON.stringify(requiredReviewDimensions);
    if (already) {
      unchanged.push(record.slug);
      continue;
    }
    changes.push({
      slug: record.slug,
      expectedReviewRevision: serverRevision,
      fields: {
        riskClassification: riskClass,
        ownerPriority: priority,
        riskReasons,
        requiredReviewDimensions,
        classificationSource: source,
        classificationRunId: options.runId,
        ...(server.priorityStatus === null ? { priorityStatus: 'unreviewed' as const } : {}),
      },
    });
  }

  const unknownSlugs = serverRows.filter((row) => !seen.has(row.slug)).map((row) => row.slug).sort();
  const parentVisibleNow = serverRows.filter((row) => isParentVisible(row.clinicalStatus)).length;

  return {
    runId: options.runId,
    expectedRecords,
    // `seen` already holds each slug once, so duplicates must NOT be subtracted
    // again — a slug listed twice in the file is still one matched record.
    matched: seen.size - missingSlugs.length,
    missingSlugs: missingSlugs.sort(),
    unknownSlugs,
    duplicateSlugs: duplicateSlugs.sort(),
    revisionConflicts,
    changes,
    unchanged: unchanged.sort(),
    classCounts,
    priorityCounts,
    parentVisibleNow,
    parentVisibleAfterImport: parentVisibleNow,
    importEnabled: false,
  };
}

/**
 * What the FUTURE apply step must refuse, expressed as a pure check so it is
 * testable today. Given a planned change and the row as re-read at apply time,
 * returns a refusal reason or null. Stale rows are refused, never overwritten.
 */
export function applyRefusal(
  change: ProposedGovernanceChange,
  rowAtApplyTime: { reviewRevision: number | null } | null,
): string | null {
  if (!rowAtApplyTime) return 'row_missing';
  if ((rowAtApplyTime.reviewRevision ?? 1) !== change.expectedReviewRevision) return 'stale_revision';
  return null;
}
