import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { internalQuery, mutation, type MutationCtx, type QueryCtx } from './_generated/server';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_COUNT,
  CLINICAL_REVIEW_BATCH_EXPIRES_AT,
  CLINICAL_REVIEW_BATCH_FROZEN_AT,
  CLINICAL_REVIEW_BATCH_HASH,
  CLINICAL_REVIEW_BATCH_ID,
  CLINICAL_REVIEW_BATCH_ITEMS,
  CLINICAL_REVIEW_BATCH_MANIFEST,
  CLINICAL_REVIEW_BATCH_REVIEWER,
  type ClinicalReviewBatchItem,
} from './lib/clinicalReviewBatchData';
import {
  CLINICAL_REVIEW_BATCH_CONTRACT as CONTRACT,
  CLINICAL_REVIEW_BATCH_CONTRACT_VERSION as CONTRACT_VERSION,
  CLINICAL_REVIEW_BATCH_DIMENSION as DIMENSION,
  clinicalReviewBatchLoadResultValidator,
  clinicalReviewDecisionValidator as decisionValidator,
  clinicalReviewHandoffValidator as handoffValidator,
  clinicalReviewReceiptValidator as receiptValidator,
  type ClinicalReviewDecision as ReviewDecision,
} from './lib/clinicalReviewBatchContract';
import { todayIsoUtc } from './lib/evidenceFreshness';
import { evaluatePublicationEvidence } from './lib/evidencePublicationGate';
import { requireUser } from './lib/auth';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type SnapshotField = {
  path: string;
  labelMm: string;
  labelEn: string;
  valueMm: string | null;
  valueEn: string | null;
};
type SnapshotSource = {
  sourceId: string;
  org: string;
  title: string;
  year: number | null;
  url: string;
};

const MAX_RELATED_ROWS = 50;
const MAX_SNAPSHOT_FIELDS = 12;
const MAX_SNAPSHOT_FIELD_CHARACTERS = 12_000;

type DecisionReceipt = {
  decision: ReviewDecision;
  note: string | null;
  reviewedAt: number;
  receiptId: string;
};

async function assignedReviewerBlockers(ctx: DatabaseContext, userId: Id<'users'>): Promise<string[]> {
  const rows = await ctx.db.query('parentProfiles').withIndex('by_user', (q) => q.eq('userId', userId)).take(2);
  if (String(userId) !== CLINICAL_REVIEW_BATCH_REVIEWER.userId) return ['not_assigned_reviewer'];
  if (rows.length !== 1) return ['assigned_reviewer_profile_not_unique'];
  const profile = rows[0];
  const blockers: string[] = [];
  if (String(profile._id) !== CLINICAL_REVIEW_BATCH_REVIEWER.profileId) blockers.push('assigned_reviewer_profile_id_drift');
  if (profile.isStaff !== true) blockers.push('assigned_reviewer_not_staff');
  if (profile.staffRole !== CLINICAL_REVIEW_BATCH_REVIEWER.role) blockers.push('assigned_reviewer_role_drift');
  if ((profile.displayName ?? '').trim() !== CLINICAL_REVIEW_BATCH_REVIEWER.displayName) blockers.push('assigned_reviewer_name_drift');
  if ((profile.staffQualification ?? '').trim() !== CLINICAL_REVIEW_BATCH_REVIEWER.qualification) blockers.push('assigned_reviewer_qualification_drift');
  const stableIdentity = {
    profileId: String(profile._id), userId: String(profile.userId), isStaff: profile.isStaff === true,
    displayName: (profile.displayName ?? '').trim(), qualification: (profile.staffQualification ?? '').trim(),
    role: profile.staffRole ?? null,
  };
  if (await sha256Canonical(stableIdentity) !== CLINICAL_REVIEW_BATCH_REVIEWER.identityCanonicalSha256) {
    blockers.push('assigned_reviewer_identity_drift');
  }
  return blockers;
}

async function decisionKeyFor(item: ClinicalReviewBatchItem): Promise<string> {
  return await sha256Canonical({
    batchId: CLINICAL_REVIEW_BATCH_ID, batchHash: CLINICAL_REVIEW_BATCH_HASH,
    ordinal: item.ordinal, kind: item.kind, slug: item.slug, reviewRevision: item.reviewRevision,
    dimension: DIMENSION, reviewerUserId: CLINICAL_REVIEW_BATCH_REVIEWER.userId,
  });
}

async function freezeReceiptDigest(): Promise<string> {
  return await sha256Canonical({
    contract: CONTRACT, contractVersion: CONTRACT_VERSION, batchId: CLINICAL_REVIEW_BATCH_ID,
    freezeDigest: CLINICAL_REVIEW_BATCH_HASH, frozenAt: CLINICAL_REVIEW_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_REVIEW_BATCH_EXPIRES_AT, reviewer: CLINICAL_REVIEW_BATCH_REVIEWER,
  });
}

function sortById<T extends { _id: unknown }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function bilingualObject(value: unknown): { mm: string | null; en: string | null } {
  const record = asRecord(value);
  return { mm: cleanString(record?.mm), en: cleanString(record?.en) };
}

function bilingualList(value: unknown): { mm: string | null; en: string | null } {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_RELATED_ROWS) return { mm: null, en: null };
  const rows = value.map((entry) => bilingualObject(entry));
  if (rows.some((row) => !row.mm || !row.en)) return { mm: null, en: null };
  return {
    mm: rows.map((row, index) => `${index + 1}. ${row.mm}`).join('\n'),
    en: rows.map((row, index) => `${index + 1}. ${row.en}`).join('\n'),
  };
}

function snapshotFields(content: Doc<'libraryContent'>): { fields: SnapshotField[]; blockers: string[] } {
  const data = asRecord(content.data);
  const fields: SnapshotField[] = [];
  const blockers: string[] = [];
  const add = (path: string, labelMm: string, labelEn: string, valueMm: string | null, valueEn: string | null) => {
    if (!valueMm || !valueEn) { blockers.push(`snapshot_field_missing:${path}`); return; }
    if (valueMm.length > MAX_SNAPSHOT_FIELD_CHARACTERS || valueEn.length > MAX_SNAPSHOT_FIELD_CHARACTERS) {
      blockers.push(`snapshot_field_bound_exceeded:${path}`); return;
    }
    fields.push({ path, labelMm, labelEn, valueMm, valueEn });
  };
  if (!data) return { fields, blockers: ['snapshot_data_invalid'] };
  if (content.type === 'milestone') {
    add('data.observe', 'လေ့လာရန်', 'What to observe', cleanString(data.observeMm), cleanString(data.observeEn));
    add('data.why', 'အရေးပါပုံ', 'Why it matters', cleanString(data.whyMm), cleanString(data.whyEn));
    add('data.red', 'ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ရန်', 'When to seek advice', cleanString(data.redMm), cleanString(data.redEn));
  } else if (content.type === 'activity') {
    const materials = bilingualObject(data.materials);
    const setup = bilingualObject(data.setup);
    const instructions = bilingualList(data.instructions);
    const safety = bilingualObject(data.safety);
    const outcomes = bilingualList(data.outcomes);
    add('data.materials', 'လိုအပ်သောပစ္စည်း', 'Materials', materials.mm, materials.en);
    add('data.setup', 'ပြင်ဆင်ပုံ', 'Setup', setup.mm, setup.en);
    add('data.instructions', 'လုပ်ဆောင်ပုံ', 'Instructions', instructions.mm, instructions.en);
    add('data.safety', 'ဘေးကင်းရေး', 'Safety', safety.mm, safety.en);
    add('data.outcomes', 'မျှော်မှန်းရလဒ်', 'Expected outcomes', outcomes.mm, outcomes.en);
  } else blockers.push('snapshot_type_not_supported');
  if (fields.length === 0 || fields.length > MAX_SNAPSHOT_FIELDS) blockers.push('snapshot_field_count_invalid');
  return { fields, blockers };
}

async function buildSnapshot(content: Doc<'libraryContent'>, sourceRows: Doc<'evidenceSources'>[]) {
  const extracted = snapshotFields(content);
  const sources: SnapshotSource[] = sourceRows.map((source) => ({
    sourceId: source.sourceId,
    org: source.org,
    title: source.title,
    year: source.year,
    url: source.url,
  }));
  if (sources.some((source) => {
    if (!source.sourceId.trim() || !source.org.trim() || !source.title.trim()) return true;
    try {
      const url = new URL(source.url);
      return url.protocol !== 'https:' && url.protocol !== 'http:';
    } catch {
      return true;
    }
  })) extracted.blockers.push('snapshot_source_invalid');
  const body = {
    titleMm: content.titleMm, titleEn: content.titleEn,
    summaryMm: content.summaryMm ?? null, summaryEn: content.summaryEn ?? null,
    sources, fields: extracted.fields,
  };
  return { snapshot: { digest: await sha256Canonical(body), ...body }, blockers: extracted.blockers };
}

function receiptFor(row: Doc<'contentReviews'>): DecisionReceipt | null {
  if (row.decision !== 'approved' && row.decision !== 'changes_requested' && row.decision !== 'not_applicable') return null;
  return { decision: row.decision, note: row.note?.trim() || null, reviewedAt: row.reviewedAt, receiptId: String(row._id) };
}

async function inspectItem(ctx: DatabaseContext, item: ClinicalReviewBatchItem, todayIso: string) {
  const blockers: string[] = [];
  const contentRows = await ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', item.slug)).take(2);
  const linkRows = await ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q.eq('kind', item.kind).eq('slug', item.slug)).take(2);
  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  if (contentRows.length !== 1) blockers.push('content_preimage_not_unique');
  if (linkRows.length !== 1) blockers.push('evidence_link_preimage_not_unique');
  if (content) {
    if (String(content._id) !== item.contentId || content._creationTime !== item.contentCreationTime) blockers.push('content_identity_drift');
    if (content.type !== item.kind || (content.reviewRevision ?? 1) !== item.reviewRevision) blockers.push('stale_revision');
    if (content.updatedAt !== item.contentUpdatedAt) blockers.push('content_updated_at_drift');
    if (await sha256Canonical(content) !== item.contentCanonicalSha256) blockers.push('content_preimage_drift');
  }
  if (link) {
    if (String(link._id) !== item.linkId || link._creationTime !== item.linkCreationTime) blockers.push('evidence_link_identity_drift');
    if (link.updatedAt !== item.linkUpdatedAt) blockers.push('evidence_link_updated_at_drift');
    if (await sha256Canonical(link) !== item.linkCanonicalSha256) blockers.push('evidence_link_preimage_drift');
    if (link.sourceIds.length !== item.sourceIds.length || !link.sourceIds.every((id, index) => id === item.sourceIds[index])) blockers.push('evidence_link_membership_drift');
  }
  const sourceRows: Doc<'evidenceSources'>[] = [];
  for (const sourceId of item.sourceIds) {
    const rows = await ctx.db.query('evidenceSources').withIndex('by_source_id', (q) => q.eq('sourceId', sourceId)).take(2);
    if (rows.length !== 1) blockers.push(`source_not_unique:${sourceId}`); else sourceRows.push(rows[0]);
  }
  if (sourceRows.length !== item.sourceCount || await sha256Canonical(sourceRows) !== item.sourcesCanonicalSha256) blockers.push('source_preimage_drift');
  if (link && !evaluatePublicationEvidence(link.sourceIds, sourceRows, todayIso).allowed) blockers.push('citation_eligibility_drift');

  const mediaPage = await ctx.db.query('libraryMedia').withIndex('by_content', (q) => q.eq('contentSlug', item.slug)).take(MAX_RELATED_ROWS + 1);
  if (mediaPage.length > MAX_RELATED_ROWS) blockers.push('media_bound_exceeded');
  const mediaRows = sortById(mediaPage.slice(0, MAX_RELATED_ROWS));
  if (mediaRows.length !== item.mediaCount || await sha256Canonical(mediaRows) !== item.mediaCanonicalSha256) blockers.push('media_preimage_drift');

  const contentAudits = content
    ? await ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) =>
        q.eq('contentSlug', item.slug).eq('reviewRevision', item.reviewRevision).eq('contentUpdatedAt', item.contentUpdatedAt),
      ).take(MAX_RELATED_ROWS + 1)
    : [];
  const evidenceAudits: Doc<'aiEvidenceAudits'>[] = [];
  for (const source of sourceRows) {
    const rows = await ctx.db.query('aiEvidenceAudits').withIndex('by_source_and_updated_at', (q) =>
      q.eq('sourceId', source.sourceId).eq('sourceUpdatedAt', source.updatedAt),
    ).take(MAX_RELATED_ROWS + 1);
    evidenceAudits.push(...rows);
  }
  const releases = await ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
    q.eq('targetKey', `${item.kind}:${item.slug}`),
  ).take(MAX_RELATED_ROWS + 1);
  if (contentAudits.length > MAX_RELATED_ROWS || evidenceAudits.length > MAX_RELATED_ROWS || releases.length > MAX_RELATED_ROWS) blockers.push('ai_snapshot_bound_exceeded');
  const aiSnapshot = {
    contentAudits: sortById(contentAudits.slice(0, MAX_RELATED_ROWS)),
    evidenceAudits: sortById(evidenceAudits.slice(0, MAX_RELATED_ROWS)),
    releases: sortById(releases.slice(0, MAX_RELATED_ROWS)), runs: [],
  };
  if (await sha256Canonical(aiSnapshot) !== item.aiCanonicalSha256) blockers.push('ai_snapshot_drift');

  const decisionKey = await decisionKeyFor(item);
  const existingByKey = await ctx.db.query('contentReviews').withIndex('by_decision_key', (q) => q.eq('decisionKey', decisionKey)).take(2);
  if (existingByKey.length > 1) blockers.push('duplicate_decision_key');
  const currentClinical = await ctx.db.query('contentReviews').withIndex('by_content_dimension_version', (q) =>
    q.eq('contentSlug', item.slug).eq('dimension', DIMENSION).eq('contentVersion', item.reviewRevision),
  ).order('desc').take(MAX_RELATED_ROWS + 1);
  if (currentClinical.length > MAX_RELATED_ROWS) blockers.push('clinical_history_bound_exceeded');
  if (currentClinical.some((row) => row.decisionKey !== decisionKey)) blockers.push('unfrozen_clinical_decision_exists');
  const existing = existingByKey[0] ?? null;
  if (existing && (
    existing.clinicalReviewBatchId !== CLINICAL_REVIEW_BATCH_ID || existing.contentSlug !== item.slug
    || existing.contentVersion !== item.reviewRevision || existing.reviewRevision !== item.reviewRevision
    || existing.dimension !== DIMENSION || String(existing.reviewerId) !== CLINICAL_REVIEW_BATCH_REVIEWER.userId
    || !receiptFor(existing)
  )) blockers.push('existing_decision_preimage_drift');

  const built = content ? await buildSnapshot(content, sourceRows) : null;
  if (!built) blockers.push('snapshot_content_missing'); else blockers.push(...built.blockers);
  return {
    item, assignmentId: decisionKey, liveReviewRevision: content?.reviewRevision ?? content?.version ?? 0,
    snapshot: built?.snapshot ?? null, decision: existing ? receiptFor(existing) : null, blockers,
  };
}

type InspectedItem = Awaited<ReturnType<typeof inspectItem>>;

async function inspectBatch(ctx: DatabaseContext, todayIso: string): Promise<InspectedItem[]> {
  const states: InspectedItem[] = [];
  for (const item of CLINICAL_REVIEW_BATCH_ITEMS) states.push(await inspectItem(ctx, item, todayIso));
  return states;
}

async function completionHandoff(states: InspectedItem[], freezeReceipt: string) {
  // A server-issued integrity receipt authorizes the workflow to leave the clinical lane. A
  // recorded request for changes (or N/A) is still a clinical follow-up, not a
  // completed clearance, so only unanimous exact-revision approvals qualify.
  if (
    states.length !== CLINICAL_REVIEW_BATCH_COUNT ||
    states.some((state) => state.decision?.decision !== 'approved')
  ) return null;
  const decisions = states.map((state) => ({
    assignmentId: state.assignmentId, slug: state.item.slug, reviewRevision: state.item.reviewRevision,
    receipt: state.decision as DecisionReceipt,
  }));
  const completedAt = Math.max(...decisions.map((entry) => entry.receipt.reviewedAt));
  const digest = await sha256Canonical({
    contract: `${CONTRACT}.handoff`, contractVersion: CONTRACT_VERSION, batchId: CLINICAL_REVIEW_BATCH_ID,
    freezeDigest: CLINICAL_REVIEW_BATCH_HASH, decisionCount: decisions.length, completedAt, decisions,
  });
  return {
    batchId: CLINICAL_REVIEW_BATCH_ID, decisionCount: decisions.length, completedAt, digest,
    receiptDigest: await sha256Canonical({ digest, freezeReceiptDigest: freezeReceipt, reviewerUserId: CLINICAL_REVIEW_BATCH_REVIEWER.userId }),
  };
}

function statesAreVerified(
  states: InspectedItem[],
): states is Array<InspectedItem & { snapshot: NonNullable<InspectedItem['snapshot']> }> {
  return states.every((state) => state.blockers.length === 0 && state.snapshot !== null);
}

/**
 * Deterministic database half of the assigned-batch read. The public action
 * supplies its server clock as arguments, so Convex never caches a query whose
 * result silently depends on Date.now(). The action is also the only public
 * caller; browser-provided timestamps are never accepted.
 */
export const readAssignedBatchState = internalQuery({
  args: { nowMs: v.number(), todayIso: v.string() },
  returns: clinicalReviewBatchLoadResultValidator,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const identityBlockers = await assignedReviewerBlockers(ctx, userId);
    if (identityBlockers.length > 0) {
      return {
        status: 'refused' as const,
        code: 'not_assigned_reviewer' as const,
        message: 'Use the assigned clinical reviewer account.',
      };
    }
    if (!Number.isFinite(args.nowMs) || args.nowMs < CLINICAL_REVIEW_BATCH_FROZEN_AT
      || new Date(args.nowMs).toISOString().slice(0, 10) !== args.todayIso
      || await sha256Canonical(CLINICAL_REVIEW_BATCH_MANIFEST) !== CLINICAL_REVIEW_BATCH_HASH
    ) {
      return {
        status: 'refused' as const,
        code: 'batch_preflight_failed' as const,
        message: 'The frozen clinical-review batch failed verification.',
      };
    }
    if (args.nowMs >= CLINICAL_REVIEW_BATCH_EXPIRES_AT) {
      return {
        status: 'refused' as const,
        code: 'assignment_expired' as const,
        message: 'The frozen clinical-review batch has expired and must be refrozen.',
      };
    }
    const states = await inspectBatch(ctx, args.todayIso);
    if (!statesAreVerified(states)) {
      return {
        status: 'refused' as const,
        code: 'batch_preflight_failed' as const,
        message: 'The frozen clinical-review batch failed live preflight.',
      };
    }
    const freezeReceipt = await freezeReceiptDigest();
    return {
      contract: CONTRACT, contractVersion: CONTRACT_VERSION, scope: 'authenticated_assignee' as const,
      batchId: CLINICAL_REVIEW_BATCH_ID, lane: 'clinical' as const, assignedRole: 'clinical_reviewer' as const,
      frozenAt: CLINICAL_REVIEW_BATCH_FROZEN_AT, freezeDigest: CLINICAL_REVIEW_BATCH_HASH,
      freezeReceiptDigest: freezeReceipt,
      reviewer: {
        profileId: CLINICAL_REVIEW_BATCH_REVIEWER.profileId, userId: CLINICAL_REVIEW_BATCH_REVIEWER.userId,
        displayName: CLINICAL_REVIEW_BATCH_REVIEWER.displayName, qualification: CLINICAL_REVIEW_BATCH_REVIEWER.qualification,
        role: CLINICAL_REVIEW_BATCH_REVIEWER.role,
      },
      items: states.map((state) => ({
        assignmentId: state.assignmentId, slug: state.item.slug, type: state.item.kind, dimension: DIMENSION,
        reviewRevision: state.item.reviewRevision, liveReviewRevision: state.liveReviewRevision,
        snapshot: state.snapshot, decision: state.decision,
      })),
      handoff: await completionHandoff(states, freezeReceipt),
    };
  },
});

type RefusalCode = 'stale_revision' | 'assignment_expired' | 'assignment_not_found'
  | 'role_may_not_review_area' | 'qualification_required' | 'display_name_required' | 'note_required' | 'unknown';

async function refuse(
  ctx: MutationCtx, userId: Id<'users'>, code: RefusalCode, summary: string,
  entityId?: string, currentReviewRevision?: number,
) {
  await logAudit(ctx, userId, 'clinicalReviewBatch.decision', 'libraryContent', entityId, summary, { result: 'rejected' });
  return { ok: false as const, code, message: 'The frozen clinical-review batch refused this decision.', currentReviewRevision };
}

function identityRefusalCode(blockers: string[]): RefusalCode {
  if (blockers.some((blocker) => blocker.includes('qualification'))) return 'qualification_required';
  if (blockers.some((blocker) => blocker.includes('name'))) return 'display_name_required';
  if (blockers.some((blocker) => blocker.includes('role') || blocker.includes('staff'))) return 'role_may_not_review_area';
  return 'assignment_not_found';
}

export const saveAssignedDecision = mutation({
  args: {
    batchId: v.string(), assignmentId: v.string(), contentSlug: v.string(),
    dimension: v.union(v.literal('clinical'), v.literal('child_development'), v.literal('safety')),
    expectedSnapshotDigest: v.string(),
    expectedFreezeDigest: v.string(), expectedReviewRevision: v.number(),
    decision: decisionValidator, note: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      ok: v.literal(true), decisionKey: v.string(), duplicate: v.boolean(), receipt: receiptValidator,
      handoff: v.optional(handoffValidator),
    }),
    v.object({
      ok: v.literal(false), code: v.string(), message: v.string(), currentReviewRevision: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const identityBlockers = await assignedReviewerBlockers(ctx, userId);
    const requestedSlug = args.contentSlug;
    if (identityBlockers.length > 0) return await refuse(ctx, userId, identityRefusalCode(identityBlockers), `${requestedSlug} · refused: ${identityBlockers.join(',')}`);
    if (Date.now() >= CLINICAL_REVIEW_BATCH_EXPIRES_AT) return await refuse(ctx, userId, 'assignment_expired', `${requestedSlug} · refused: assignment expired`);
    if (args.batchId !== CLINICAL_REVIEW_BATCH_ID
      || args.expectedFreezeDigest !== CLINICAL_REVIEW_BATCH_HASH) {
      return await refuse(ctx, userId, 'assignment_expired', `${requestedSlug} · refused: frozen batch mismatch`);
    }
    if (await sha256Canonical(CLINICAL_REVIEW_BATCH_MANIFEST) !== CLINICAL_REVIEW_BATCH_HASH) return await refuse(ctx, userId, 'assignment_expired', `${requestedSlug} · refused: manifest hash mismatch`);

    let item: ClinicalReviewBatchItem | undefined;
    for (const candidate of CLINICAL_REVIEW_BATCH_ITEMS) {
      if (await decisionKeyFor(candidate) === args.assignmentId) { item = candidate; break; }
    }
    if (!item) return await refuse(ctx, userId, 'assignment_not_found', `${requestedSlug} · refused: assignment not found`);
    if (args.contentSlug !== item.slug || args.dimension !== DIMENSION) {
      return await refuse(ctx, userId, 'assignment_not_found', `${requestedSlug} · refused: assignment tuple mismatch`, item.contentId);
    }
    if (args.expectedReviewRevision !== item.reviewRevision) {
      return await refuse(ctx, userId, 'stale_revision', `${item.slug} · refused: expected revision ${args.expectedReviewRevision}`, item.contentId, item.reviewRevision);
    }
    const note = args.note?.trim();
    if (args.decision === 'changes_requested' && !note) return await refuse(ctx, userId, 'note_required', `${item.slug} · refused: changes_requested requires note`, item.contentId);

    const batchStates = await inspectBatch(ctx, todayIsoUtc());
    const state = batchStates.find((candidate) => candidate.item.slug === item.slug);
    if (!state) return await refuse(ctx, userId, 'assignment_not_found', `${item.slug} · refused: assignment state missing`, item.contentId);
    const blockedState = batchStates.find((candidate) => candidate.blockers.length > 0 || !candidate.snapshot);
    if (blockedState) {
      const stale = blockedState.blockers.includes('stale_revision');
      const blockedRevision = blockedState.liveReviewRevision || blockedState.item.reviewRevision;
      return await refuse(ctx, userId, stale ? 'stale_revision' : 'assignment_expired', `${item.slug} · refused: ${blockedState.item.slug}:${blockedState.blockers.join(',')}`, item.contentId, stale ? blockedRevision : undefined);
    }
    if (!state.snapshot) return await refuse(ctx, userId, 'assignment_expired', `${item.slug} · refused: snapshot missing`, item.contentId);
    const snapshot = state.snapshot;
    if (args.expectedSnapshotDigest !== snapshot.digest) return await refuse(ctx, userId, 'assignment_expired', `${item.slug} · refused: snapshot digest mismatch`, item.contentId);
    if (state.decision) {
      const identical = state.decision.decision === args.decision && (state.decision.note ?? '') === (note ?? '');
      if (!identical) return await refuse(ctx, userId, 'assignment_expired', `${item.slug} · refused: decision receipt conflict`, item.contentId);
      const handoff = await completionHandoff(batchStates, await freezeReceiptDigest());
      return { ok: true as const, decisionKey: state.assignmentId, duplicate: true, receipt: state.decision, ...(handoff ? { handoff } : {}) };
    }

    const now = Date.now();
    const reviewId = await ctx.db.insert('contentReviews', {
      contentSlug: item.slug, contentVersion: item.reviewRevision, reviewRevision: item.reviewRevision,
      dimension: DIMENSION, decision: args.decision, note: note || undefined, reviewerId: userId,
      reviewerDisplayName: CLINICAL_REVIEW_BATCH_REVIEWER.displayName,
      reviewerQualification: CLINICAL_REVIEW_BATCH_REVIEWER.qualification, reviewerRole: 'clinical_reviewer',
      reviewedAt: now, decisionKey: state.assignmentId, clinicalReviewBatchId: CLINICAL_REVIEW_BATCH_ID,
      createdAt: now, updatedAt: now,
    });
    const receipt: DecisionReceipt = { decision: args.decision, note: note || null, reviewedAt: now, receiptId: String(reviewId) };
    await logAudit(ctx, userId, 'clinicalReviewBatch.decision', 'libraryContent', item.contentId,
      `${item.kind}:${item.slug} · revision ${item.reviewRevision} · ${args.decision} · ${state.assignmentId}`,
      {
        result: 'ok',
        before: JSON.stringify({ batchId: CLINICAL_REVIEW_BATCH_ID, freezeDigest: CLINICAL_REVIEW_BATCH_HASH, assignmentId: state.assignmentId, snapshotDigest: snapshot.digest }),
        after: JSON.stringify(receipt),
      },
    );
    const completedStates = batchStates.map((candidate) => candidate.item.slug === item.slug
      ? { ...candidate, decision: receipt }
      : candidate);
    const handoff = await completionHandoff(completedStates, await freezeReceiptDigest());
    return { ok: true as const, decisionKey: state.assignmentId, duplicate: false, receipt, ...(handoff ? { handoff } : {}) };
  },
});
