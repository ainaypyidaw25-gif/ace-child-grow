import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { internalQuery, mutation, type MutationCtx, type QueryCtx } from './_generated/server';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
  type ClinicalReviewBatchReviewer,
  type ClinicalReviewBatchItem,
} from './lib/clinicalReviewBatchData';
import {
  CLINICAL_REVIEW_BATCH_CONTRACT as CONTRACT,
  CLINICAL_REVIEW_BATCH_CONTRACT_VERSION as CONTRACT_VERSION,
  clinicalReviewBatchLoadResultValidator,
  clinicalReviewDecisionValidator as decisionValidator,
  clinicalReviewHandoffValidator as handoffValidator,
  clinicalReviewReceiptValidator as receiptValidator,
  type ClinicalReviewDecision as ReviewDecision,
} from './lib/clinicalReviewBatchContract';
import { todayIsoUtc } from './lib/evidenceFreshness';
import { evaluatePublicationEvidence } from './lib/evidencePublicationGate';
import { requireUser } from './lib/auth';
import { roleMayReview } from './lib/reviewPolicy';
import {
  exactPersistedAssignment,
  exactPersistedBatchRegistration,
  frozenClinicalDecisionKey,
} from './lib/clinicalReviewBatchProvenance';

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
type SnapshotAdvisory = {
  mm: string;
  en: string;
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

async function assignedReviewerBlockers(
  ctx: DatabaseContext,
  userId: Id<'users'>,
  reviewer: ClinicalReviewBatchReviewer,
): Promise<string[]> {
  const rows = await ctx.db.query('parentProfiles').withIndex('by_user', (q) => q.eq('userId', userId)).take(2);
  if (String(userId) !== reviewer.userId) return ['not_assigned_reviewer'];
  if (rows.length !== 1) return ['assigned_reviewer_profile_not_unique'];
  const profile = rows[0];
  const blockers: string[] = [];
  if (String(profile._id) !== reviewer.profileId) blockers.push('assigned_reviewer_profile_id_drift');
  if (profile.isStaff !== true) blockers.push('assigned_reviewer_not_staff');
  if (profile.staffRole !== reviewer.role) blockers.push('assigned_reviewer_role_drift');
  if ((profile.displayName ?? '').trim() !== reviewer.displayName) blockers.push('assigned_reviewer_name_drift');
  if ((profile.staffQualification ?? '').trim() !== reviewer.qualification) blockers.push('assigned_reviewer_qualification_drift');
  const stableIdentity = {
    profileId: String(profile._id), userId: String(profile.userId), isStaff: profile.isStaff === true,
    displayName: (profile.displayName ?? '').trim(), qualification: (profile.staffQualification ?? '').trim(),
    role: profile.staffRole ?? null,
  };
  if (await sha256Canonical(stableIdentity) !== reviewer.identityCanonicalSha256) {
    blockers.push('assigned_reviewer_identity_drift');
  }
  return blockers;
}

async function decisionKeyFor(
  registration: ClinicalReviewBatchRegistration,
  item: ClinicalReviewBatchItem,
): Promise<string> {
  return await frozenClinicalDecisionKey(registration, item);
}

async function freezeReceiptDigest(registration: ClinicalReviewBatchRegistration): Promise<string> {
  return await sha256Canonical({
    contract: CONTRACT, contractVersion: CONTRACT_VERSION, batchId: registration.manifest.batchId,
    freezeDigest: registration.freezeDigest, frozenAt: registration.frozenAt,
    expiresAt: registration.expiresAt, reviewer: registration.manifest.reviewer,
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

function bilingualFaq(value: unknown): { mm: string | null; en: string | null } {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_RELATED_ROWS) {
    return { mm: null, en: null };
  }
  const rows = value.map((entry) => {
    const record = asRecord(entry);
    return { question: bilingualObject(record?.q), answer: bilingualObject(record?.a) };
  });
  if (rows.some((row) => !row.question.mm || !row.question.en || !row.answer.mm || !row.answer.en)) {
    return { mm: null, en: null };
  }
  return {
    mm: rows.map((row, index) => `${index + 1}. ${row.question.mm}\n   ${row.answer.mm}`).join('\n'),
    en: rows.map((row, index) => `${index + 1}. ${row.question.en}\n   ${row.answer.en}`).join('\n'),
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
  } else if (content.type === 'guide') {
    const why = bilingualObject(data.why);
    const materials = bilingualObject(data.materials);
    const observations = bilingualList(data.observationQuestions);
    const dailyActivities = bilingualList(data.dailyActivities);
    const settings = bilingualList([
      ...(Array.isArray(data.indoor) ? data.indoor : []),
      ...(Array.isArray(data.lowCost) ? data.lowCost : []),
    ]);
    const safety = bilingualObject(data.safety);
    const commonMistakes = bilingualList(data.commonMistakes);
    const parentTips = bilingualList(data.parentTips);
    const faq = bilingualFaq(data.faq);
    const redFlags = bilingualList(data.redFlags);
    const referral = bilingualObject(data.referral);
    const encouragement = bilingualObject(data.encouragement);
    add('data.why', 'အရေးပါပုံ', 'Why it matters', why.mm, why.en);
    add('data.materials', 'လိုအပ်သောပစ္စည်း', 'Materials', materials.mm, materials.en);
    add('data.observationQuestions', 'စောင့်ကြည့်ရန်', 'What to observe', observations.mm, observations.en);
    add('data.dailyActivities', 'နေ့စဉ်လုပ်ဆောင်ရန်', 'Daily activities', dailyActivities.mm, dailyActivities.en);
    add('data.indoor+lowCost', 'အိမ်တွင်းနှင့် ကုန်ကျစရိတ်နည်း အကြံပြုချက်များ', 'Indoor and low-cost suggestions', settings.mm, settings.en);
    add('data.safety', 'ဘေးကင်းရေး', 'Safety', safety.mm, safety.en);
    add('data.commonMistakes', 'ရှောင်ရန်အမှားများ', 'Common mistakes', commonMistakes.mm, commonMistakes.en);
    add('data.parentTips', 'မိဘအတွက်အကြံပြုချက်', 'Parent tips', parentTips.mm, parentTips.en);
    add('data.faq', 'မေးလေ့ရှိသောမေးခွန်း', 'Frequently asked question', faq.mm, faq.en);
    add('data.redFlags', 'အရေးပေါ်သတိပေးလက္ခဏာများ', 'Urgent warning signs', redFlags.mm, redFlags.en);
    add('data.referral', 'အရေးပေါ်လုပ်ဆောင်ရန်', 'Urgent action', referral.mm, referral.en);
    add('data.encouragement', 'အားပေးစကား', 'Encouragement', encouragement.mm, encouragement.en);
  } else blockers.push('snapshot_type_not_supported');
  if (fields.length === 0 || fields.length > MAX_SNAPSHOT_FIELDS) blockers.push('snapshot_field_count_invalid');
  return { fields, blockers };
}

async function buildSnapshot(
  content: Doc<'libraryContent'>,
  sourceRows: Doc<'evidenceSources'>[],
  reviewerAdvisory?: SnapshotAdvisory,
) {
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
  const advisory = reviewerAdvisory
    ? { mm: reviewerAdvisory.mm.trim(), en: reviewerAdvisory.en.trim() }
    : null;
  if (reviewerAdvisory && (!advisory?.mm || !advisory.en
    || advisory.mm.length > MAX_SNAPSHOT_FIELD_CHARACTERS
    || advisory.en.length > MAX_SNAPSHOT_FIELD_CHARACTERS)) {
    extracted.blockers.push('snapshot_reviewer_advisory_invalid');
  }
  const body = {
    titleMm: content.titleMm, titleEn: content.titleEn,
    summaryMm: content.summaryMm ?? null, summaryEn: content.summaryEn ?? null,
    reviewerAdvisory: advisory,
    sources, fields: extracted.fields,
  };
  return { snapshot: { digest: await sha256Canonical(body), ...body }, blockers: extracted.blockers };
}

function receiptFor(row: Doc<'contentReviews'>): DecisionReceipt | null {
  if (row.decision !== 'approved' && row.decision !== 'changes_requested' && row.decision !== 'not_applicable') return null;
  return { decision: row.decision, note: row.note?.trim() || null, reviewedAt: row.reviewedAt, receiptId: String(row._id) };
}

async function inspectItem(
  ctx: DatabaseContext,
  registration: ClinicalReviewBatchRegistration,
  item: ClinicalReviewBatchItem,
  todayIso: string,
) {
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

  const decisionKey = await decisionKeyFor(registration, item);
  const existingByKey = await ctx.db.query('contentReviews').withIndex('by_decision_key', (q) => q.eq('decisionKey', decisionKey)).take(2);
  if (existingByKey.length > 1) blockers.push('duplicate_decision_key');
  const currentClinical = await ctx.db.query('contentReviews').withIndex('by_content_dimension_version', (q) =>
    q.eq('contentSlug', item.slug).eq('dimension', registration.dimension).eq('contentVersion', item.reviewRevision),
  ).order('desc').take(MAX_RELATED_ROWS + 1);
  if (currentClinical.length > MAX_RELATED_ROWS) blockers.push('clinical_history_bound_exceeded');
  const allClinicalPage = await ctx.db.query('contentReviews')
    .withIndex('by_content', (q) => q.eq('contentSlug', item.slug)).take(MAX_RELATED_ROWS + 1);
  const allClinical = sortById(allClinicalPage
    .slice(0, MAX_RELATED_ROWS)
    .filter((row) => row.dimension === 'clinical'
      && row.clinicalReviewBatchId !== registration.manifest.batchId));
  const currentClinicalPreimage = allClinical.filter(
    (row) => row.contentVersion === item.reviewRevision || row.reviewRevision === item.reviewRevision,
  );
  if (allClinicalPage.length > MAX_RELATED_ROWS) blockers.push('all_clinical_history_bound_exceeded');
  if (registration.authority === 'release') {
    if (currentClinicalPreimage.length !== item.currentClinicalReviewCount
      || await sha256Canonical(currentClinicalPreimage) !== item.currentClinicalReviewsCanonicalSha256) {
      blockers.push('current_clinical_review_preimage_drift');
    }
    if (await sha256Canonical(allClinical) !== item.allClinicalReviewHistoryCanonicalSha256) {
      blockers.push('all_clinical_review_history_preimage_drift');
    }
  }
  if (currentClinical.some((row) => row.decisionKey !== decisionKey)) blockers.push('unfrozen_clinical_decision_exists');
  const existing = existingByKey[0] ?? null;
  if (existing && (
    existing.clinicalReviewBatchId !== registration.manifest.batchId || existing.contentSlug !== item.slug
    || existing.contentVersion !== item.reviewRevision || existing.reviewRevision !== item.reviewRevision
    || existing.dimension !== registration.dimension || String(existing.reviewerId) !== registration.manifest.reviewer.userId
    || !receiptFor(existing)
  )) blockers.push('existing_decision_preimage_drift');

  const built = content ? await buildSnapshot(content, sourceRows, item.reviewerAdvisory) : null;
  if (!built) blockers.push('snapshot_content_missing'); else blockers.push(...built.blockers);
  return {
    item, assignmentId: decisionKey, liveReviewRevision: content?.reviewRevision ?? content?.version ?? 0,
    snapshot: built?.snapshot ?? null, decision: existing ? receiptFor(existing) : null, blockers,
  };
}

type InspectedItem = Awaited<ReturnType<typeof inspectItem>>;

async function inspectBatch(
  ctx: DatabaseContext,
  registration: ClinicalReviewBatchRegistration,
  todayIso: string,
): Promise<InspectedItem[]> {
  const states: InspectedItem[] = [];
  for (const item of registration.manifest.items) {
    states.push(await inspectItem(ctx, registration, item, todayIso));
  }
  return states;
}

/** Read-only exact live preflight reused by the owner activation CAS. */
export async function registeredBatchActivationBlockers(
  ctx: DatabaseContext,
  registration: ClinicalReviewBatchRegistration,
  todayIso: string,
): Promise<string[]> {
  const blockers = await assignedReviewerBlockers(
    ctx,
    registration.manifest.reviewer.userId as Id<'users'>,
    registration.manifest.reviewer,
  );
  const states = await inspectBatch(ctx, registration, todayIso);
  for (const state of states) {
    blockers.push(...state.blockers.map((blocker) => `${state.item.slug}:${blocker}`));
    if (!state.snapshot) blockers.push(`${state.item.slug}:snapshot_missing`);
    if (state.decision) blockers.push(`${state.item.slug}:preexisting_decision`);
  }
  return [...new Set(blockers)];
}

async function completionHandoff(
  registration: ClinicalReviewBatchRegistration,
  states: InspectedItem[],
  freezeReceipt: string,
) {
  // A server-issued integrity receipt authorizes the workflow to leave the clinical lane. A
  // recorded request for changes (or N/A) is still a clinical follow-up, not a
  // completed clearance, so only unanimous exact-revision approvals qualify.
  if (
    states.length !== registration.manifest.count ||
    states.some((state) => state.decision?.decision !== 'approved')
  ) return null;
  const decisions = states.map((state) => ({
    assignmentId: state.assignmentId, slug: state.item.slug, reviewRevision: state.item.reviewRevision,
    receipt: state.decision as DecisionReceipt,
  }));
  const completedAt = Math.max(...decisions.map((entry) => entry.receipt.reviewedAt));
  const digest = await sha256Canonical({
    contract: `${CONTRACT}.handoff`, contractVersion: CONTRACT_VERSION, batchId: registration.manifest.batchId,
    freezeDigest: registration.freezeDigest, decisionCount: decisions.length, completedAt, decisions,
  });
  return {
    batchId: registration.manifest.batchId, decisionCount: decisions.length, completedAt, digest,
    receiptDigest: await sha256Canonical({
      digest,
      freezeReceiptDigest: freezeReceipt,
      reviewerUserId: registration.manifest.reviewer.userId,
    }),
  };
}

function statesAreVerified(
  states: InspectedItem[],
): states is Array<InspectedItem & { snapshot: NonNullable<InspectedItem['snapshot']> }> {
  return states.every((state) => state.blockers.length === 0 && state.snapshot !== null);
}

const MAX_REGISTERED_BATCHES = 32;
const MAX_ITEMS_PER_BATCH = 25;

async function registryBlockers(): Promise<string[]> {
  const blockers: string[] = [];
  const registrations: readonly ClinicalReviewBatchRegistration[] = CLINICAL_REVIEW_BATCH_REGISTRY;
  if (registrations.length === 0 || registrations.length > MAX_REGISTERED_BATCHES) {
    return ['registry_batch_count_invalid'];
  }
  const batchIds = new Set<string>();
  const globalExactTargets = new Set<string>();
  let previousRelease: ClinicalReviewBatchRegistration | null = null;
  for (let index = 0; index < registrations.length; index += 1) {
    const registration = registrations[index];
    const { manifest } = registration;
    if (!manifest.batchId.trim() || batchIds.has(manifest.batchId)) blockers.push('registry_batch_id_invalid');
    batchIds.add(manifest.batchId);
    if (registration.sequence !== index + 1) blockers.push(`registry_sequence_invalid:${manifest.batchId}`);
    if (registration.authority === 'pilot') {
      if (registration.activation.kind !== 'initial' || previousRelease) {
        blockers.push(`registry_pilot_history_invalid:${manifest.batchId}`);
      }
    } else if (!previousRelease) {
      if (registration.activation.kind !== 'initial') {
        blockers.push(`registry_release_root_invalid:${manifest.batchId}`);
      }
      previousRelease = registration;
    } else {
      if (registration.activation.kind === 'initial'
        || registration.activation.previousBatchId !== previousRelease.manifest.batchId) {
        blockers.push(`registry_predecessor_invalid:${manifest.batchId}`);
      }
      previousRelease = registration;
    }
    if (!Number.isFinite(registration.frozenAt) || !Number.isFinite(registration.expiresAt)
      || registration.frozenAt >= registration.expiresAt) {
      blockers.push(`registry_time_window_invalid:${manifest.batchId}`);
    }
    if (manifest.count !== manifest.items.length || manifest.count < 1
      || manifest.count > MAX_ITEMS_PER_BATCH) {
      blockers.push(`registry_item_count_invalid:${manifest.batchId}`);
    }
    if (!roleMayReview(manifest.reviewer.role, registration.dimension)
      || (registration.dimension !== 'evidence' && manifest.reviewer.role !== 'clinical_reviewer')) {
      blockers.push(`registry_reviewer_role_invalid:${manifest.batchId}`);
    }
    const ordinals = new Set<number>();
    const exactTargets = new Set<string>();
    for (const item of manifest.items) {
      if (registration.authority === 'release'
        && (!Number.isInteger(item.currentClinicalReviewCount)
          || item.currentClinicalReviewCount! < 0
          || !/^[a-f0-9]{64}$/.test(item.currentClinicalReviewsCanonicalSha256 ?? '')
          || !/^[a-f0-9]{64}$/.test(item.allClinicalReviewHistoryCanonicalSha256 ?? ''))) {
        blockers.push(`registry_review_preimage_invalid:${manifest.batchId}`);
      }
      const target = `${item.kind}:${item.slug}:r${item.reviewRevision}`;
      const globalTarget = `${registration.dimension}:${target}`;
      if (!Number.isInteger(item.ordinal) || item.ordinal < 1 || ordinals.has(item.ordinal)) {
        blockers.push(`registry_ordinal_invalid:${manifest.batchId}`);
      }
      ordinals.add(item.ordinal);
      if (!item.kind.trim() || !item.slug.trim() || !Number.isInteger(item.reviewRevision)
        || item.reviewRevision < 1 || exactTargets.has(target)) {
        blockers.push(`registry_target_invalid:${manifest.batchId}`);
      }
      exactTargets.add(target);
      if (globalExactTargets.has(globalTarget)) {
        blockers.push(`registry_global_target_collision:${manifest.batchId}`);
      }
      globalExactTargets.add(globalTarget);
    }
    if (manifest.items.some((item, itemIndex) => item.ordinal !== itemIndex + 1)) {
      blockers.push(`registry_ordinal_order_invalid:${manifest.batchId}`);
    }
    if (await sha256Canonical(manifest) !== registration.freezeDigest) {
      blockers.push(`registry_freeze_digest_invalid:${manifest.batchId}`);
    }
    if (await sha256Canonical(clinicalReviewBatchRoutingPayload(registration))
      !== registration.routingCanonicalSha256) {
      blockers.push(`registry_routing_digest_invalid:${manifest.batchId}`);
    }
    if (registration.activation.kind === 'after_handoff'
      && !/^[a-f0-9]{64}$/.test(registration.activation.expectedPreviousFreezeDigest)) {
      blockers.push(`registry_handoff_gate_invalid:${manifest.batchId}`);
    }
    if (registration.activation.kind === 'after_changes_requested_refreeze'
      && !/^[a-f0-9]{64}$/.test(registration.activation.expectedDecisionSetDigest)) {
      blockers.push(`registry_refreeze_gate_invalid:${manifest.batchId}`);
    }
  }
  return blockers;
}

async function storedHandoffReceipt(
  ctx: DatabaseContext,
  registration: ClinicalReviewBatchRegistration,
) {
  const rows = await ctx.db
    .query('clinicalReviewBatchReceipts')
    .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId))
    .take(2);
  if (rows.length === 0) return { receipt: null, blockers: [] as string[] };
  if (rows.length !== 1) return { receipt: null, blockers: ['duplicate_handoff_receipt'] };
  const receipt = rows[0];
  if (receipt.freezeDigest !== registration.freezeDigest
    || receipt.authority !== registration.authority
    || receipt.decisionCount !== registration.manifest.count
    || String(receipt.reviewerId) !== registration.manifest.reviewer.userId
    || !/^[a-f0-9]{64}$/.test(receipt.digest)
    || !/^[a-f0-9]{64}$/.test(receipt.receiptDigest)) {
    return { receipt: null, blockers: ['handoff_receipt_preimage_drift'] };
  }
  return { receipt, blockers: [] as string[] };
}

async function exactPersistedRegistrationSelection(
  ctx: DatabaseContext,
  row: Doc<'clinicalReviewBatches'>,
) {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (candidate) => candidate.manifest.batchId === row.batchId,
  ) as ClinicalReviewBatchRegistration | undefined;
  if (!registration || registration.authority !== 'release'
    || !exactPersistedBatchRegistration(row, registration)) {
    return {
      active: registration ?? CLINICAL_REVIEW_BATCH_REGISTRY[0] as ClinicalReviewBatchRegistration,
      persistedStatus: row.status,
      blockers: ['persisted_batch_preimage_drift'],
    };
  }
  const assignmentBlockers: string[] = [];
  const persistedAssignments = await ctx.db
    .query('clinicalReviewAssignments')
    .withIndex('by_batch_id_and_ordinal', (q) => q.eq('batchId', registration.manifest.batchId))
    .take(MAX_ITEMS_PER_BATCH + 1);
  if (persistedAssignments.length !== registration.manifest.count) {
    assignmentBlockers.push('persisted_assignment_count_mismatch');
  }
  for (const item of registration.manifest.items) {
    const assignmentId = await decisionKeyFor(registration, item);
    const matches = persistedAssignments.filter((assignment) => assignment.assignmentId === assignmentId);
    if (matches.length !== 1
      || !exactPersistedAssignment(matches[0], registration, item, assignmentId)) {
      assignmentBlockers.push(`persisted_assignment_preimage_drift:${item.slug}`);
    }
  }
  return { active: registration, persistedStatus: row.status, blockers: assignmentBlockers };
}

async function activeRegistration(ctx: DatabaseContext, requestedBatchId?: string) {
  if (requestedBatchId) {
    const requested = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', requestedBatchId)).take(2);
    if (requested.length > 1) {
      return {
        active: CLINICAL_REVIEW_BATCH_REGISTRY[0] as ClinicalReviewBatchRegistration,
        persistedStatus: undefined,
        blockers: ['duplicate_requested_batch'],
      };
    }
    if (requested.length === 1) return await exactPersistedRegistrationSelection(ctx, requested[0]);
  }
  const persistedActive = await ctx.db
    .query('clinicalReviewBatches')
    .withIndex('by_status', (q) => q.eq('status', 'active'))
    .take(2);
  if (persistedActive.length > 1) {
    return {
      active: CLINICAL_REVIEW_BATCH_REGISTRY[0] as ClinicalReviewBatchRegistration,
      persistedStatus: undefined,
      blockers: ['multiple_active_batches'],
    };
  }
  if (persistedActive.length === 1) {
    return await exactPersistedRegistrationSelection(ctx, persistedActive[0]);
  }

  const closed = [
    ...await ctx.db.query('clinicalReviewBatches').withIndex('by_status', (q) => q.eq('status', 'completed')).take(MAX_REGISTERED_BATCHES),
    ...await ctx.db.query('clinicalReviewBatches').withIndex('by_status', (q) => q.eq('status', 'stopped_changes_requested')).take(MAX_REGISTERED_BATCHES),
  ].sort((left, right) => right.sequence - left.sequence);
  if (closed.length > 0) return await exactPersistedRegistrationSelection(ctx, closed[0]);

  // Backward-compatible pilot lane. Registered release batches never become
  // active merely because a receipt exists; only the persisted owner CAS
  // transition in clinicalReviewRegistry may select one.
  return {
    active: CLINICAL_REVIEW_BATCH_REGISTRY[0] as ClinicalReviewBatchRegistration,
    persistedStatus: undefined,
    blockers: [] as string[],
  };
}

async function persistHandoffReceipt(
  ctx: MutationCtx,
  registration: ClinicalReviewBatchRegistration,
  handoff: Awaited<ReturnType<typeof completionHandoff>>,
) {
  if (!handoff) return;
  const stored = await storedHandoffReceipt(ctx, registration);
  if (stored.blockers.length > 0) {
    throw new Error(`Handoff receipt preimage failed: ${stored.blockers.join(',')}`);
  }
  if (stored.receipt) {
    const identical = stored.receipt.completedAt === handoff.completedAt
      && stored.receipt.digest === handoff.digest
      && stored.receipt.receiptDigest === handoff.receiptDigest;
    if (!identical) throw new Error('Handoff receipt conflict');
    return;
  }
  await ctx.db.insert('clinicalReviewBatchReceipts', {
    batchId: registration.manifest.batchId,
    freezeDigest: registration.freezeDigest,
    reviewerId: registration.manifest.reviewer.userId as Id<'users'>,
    decisionCount: handoff.decisionCount,
    completedAt: handoff.completedAt,
    digest: handoff.digest,
    receiptDigest: handoff.receiptDigest,
    authority: registration.authority,
    createdAt: handoff.completedAt,
  });
}

async function closePersistedReleaseBatch(
  ctx: MutationCtx,
  registration: ClinicalReviewBatchRegistration,
  decision: DecisionReceipt['decision'],
  handoff: Awaited<ReturnType<typeof completionHandoff>>,
) {
  if (registration.authority !== 'release') return;
  const rows = await ctx.db
    .query('clinicalReviewBatches')
    .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId))
    .take(2);
  if (rows.length !== 1 || !exactPersistedBatchRegistration(rows[0], registration)) {
    // Throwing rolls the whole Convex mutation back, including the decision and
    // receipt inserts. Returning a refusal here would commit a partial release.
    throw new Error('Active release batch lifecycle preimage failed');
  }
  if (rows[0].status === 'completed' && handoff) return;
  if (rows[0].status === 'stopped_changes_requested' && decision === 'changes_requested') return;
  if (rows[0].status !== 'active') throw new Error('Release batch lifecycle is closed');
  if (decision === 'changes_requested') {
    await ctx.db.patch(rows[0]._id, {
      status: 'stopped_changes_requested',
      completedAt: undefined,
    });
    return;
  }
  if (handoff) {
    await ctx.db.patch(rows[0]._id, {
      status: 'completed',
      completedAt: handoff.completedAt,
    });
  }
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
    const staticBlockers = await registryBlockers();
    const selected = staticBlockers.length === 0
      ? await activeRegistration(ctx)
      : { active: CLINICAL_REVIEW_BATCH_REGISTRY[0] as ClinicalReviewBatchRegistration, blockers: staticBlockers };
    if (selected.blockers.length > 0) {
      return {
        status: 'refused' as const,
        code: 'batch_preflight_failed' as const,
        message: 'The frozen clinical-review registry failed verification.',
      };
    }
    const registration = selected.active;
    const reviewer = registration.manifest.reviewer;
    const identityBlockers = await assignedReviewerBlockers(ctx, userId, reviewer);
    if (identityBlockers.length > 0) {
      return {
        status: 'refused' as const,
        code: 'not_assigned_reviewer' as const,
        message: 'Use the assigned frozen-batch reviewer account.',
      };
    }
    if (!Number.isFinite(args.nowMs) || args.nowMs < registration.frozenAt
      || new Date(args.nowMs).toISOString().slice(0, 10) !== args.todayIso
    ) {
      return {
        status: 'refused' as const,
        code: 'batch_preflight_failed' as const,
        message: 'The frozen clinical-review batch failed verification.',
      };
    }
    if (args.nowMs >= registration.expiresAt) {
      return {
        status: 'refused' as const,
        code: 'assignment_expired' as const,
        message: 'The frozen clinical-review batch has expired and must be refrozen.',
      };
    }
    const states = await inspectBatch(ctx, registration, args.todayIso);
    if (!statesAreVerified(states)) {
      return {
        status: 'refused' as const,
        code: 'batch_preflight_failed' as const,
        message: 'The frozen clinical-review batch failed live preflight.',
      };
    }
    const freezeReceipt = await freezeReceiptDigest(registration);
    const computedHandoff = await completionHandoff(registration, states, freezeReceipt);
    const storedHandoff = await storedHandoffReceipt(ctx, registration);
    if (storedHandoff.blockers.length > 0
      || (computedHandoff && (!storedHandoff.receipt
        || storedHandoff.receipt.digest !== computedHandoff.digest
        || storedHandoff.receipt.receiptDigest !== computedHandoff.receiptDigest))) {
      return {
        status: 'refused' as const,
        code: 'batch_preflight_failed' as const,
        message: 'The frozen clinical-review handoff failed verification.',
      };
    }
    return {
      contract: CONTRACT, contractVersion: CONTRACT_VERSION, scope: 'authenticated_assignee' as const,
      batchId: registration.manifest.batchId, lane: registration.dimension, assignedRole: reviewer.role,
      frozenAt: registration.frozenAt, freezeDigest: registration.freezeDigest,
      freezeReceiptDigest: freezeReceipt,
      reviewer: {
        profileId: reviewer.profileId, userId: reviewer.userId,
        displayName: reviewer.displayName, qualification: reviewer.qualification,
        role: reviewer.role,
      },
      items: states.map((state) => ({
        assignmentId: state.assignmentId, slug: state.item.slug, type: state.item.kind,
        dimension: registration.dimension,
        reviewRevision: state.item.reviewRevision, liveReviewRevision: state.liveReviewRevision,
        snapshot: state.snapshot, decision: state.decision,
      })),
      handoff: computedHandoff,
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
    dimension: v.union(
      v.literal('clinical'), v.literal('child_development'), v.literal('evidence'), v.literal('safety'),
    ),
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
    const requestedSlug = args.contentSlug;
    const staticBlockers = await registryBlockers();
    if (staticBlockers.length > 0) {
      return await refuse(ctx, userId, 'assignment_expired', `${requestedSlug} · refused: ${staticBlockers.join(',')}`);
    }
    const selected = await activeRegistration(ctx, args.batchId);
    if (selected.blockers.length > 0) {
      return await refuse(ctx, userId, 'assignment_expired', `${requestedSlug} · refused: ${selected.blockers.join(',')}`);
    }
    const registration = selected.active;
    const reviewer = registration.manifest.reviewer;
    const identityBlockers = await assignedReviewerBlockers(ctx, userId, reviewer);
    if (identityBlockers.length > 0) return await refuse(ctx, userId, identityRefusalCode(identityBlockers), `${requestedSlug} · refused: ${identityBlockers.join(',')}`);
    if (Date.now() >= registration.expiresAt) return await refuse(ctx, userId, 'assignment_expired', `${requestedSlug} · refused: assignment expired`);
    if (args.batchId !== registration.manifest.batchId
      || args.expectedFreezeDigest !== registration.freezeDigest) {
      return await refuse(ctx, userId, 'assignment_expired', `${requestedSlug} · refused: frozen batch mismatch`);
    }

    let item: ClinicalReviewBatchItem | undefined;
    for (const candidate of registration.manifest.items) {
      if (await decisionKeyFor(registration, candidate) === args.assignmentId) { item = candidate; break; }
    }
    if (!item) return await refuse(ctx, userId, 'assignment_not_found', `${requestedSlug} · refused: assignment not found`);
    if (args.contentSlug !== item.slug || args.dimension !== registration.dimension) {
      return await refuse(ctx, userId, 'assignment_not_found', `${requestedSlug} · refused: assignment tuple mismatch`, item.contentId);
    }
    if (args.expectedReviewRevision !== item.reviewRevision) {
      return await refuse(ctx, userId, 'stale_revision', `${item.slug} · refused: expected revision ${args.expectedReviewRevision}`, item.contentId, item.reviewRevision);
    }
    const note = args.note?.trim();
    if (args.decision === 'changes_requested' && !note) return await refuse(ctx, userId, 'note_required', `${item.slug} · refused: changes_requested requires note`, item.contentId);

    const batchStates = await inspectBatch(ctx, registration, todayIsoUtc());
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
      const handoff = await completionHandoff(
        registration,
        batchStates,
        await freezeReceiptDigest(registration),
      );
      await persistHandoffReceipt(ctx, registration, handoff);
      await closePersistedReleaseBatch(ctx, registration, state.decision.decision, handoff);
      return { ok: true as const, decisionKey: state.assignmentId, duplicate: true, receipt: state.decision, ...(handoff ? { handoff } : {}) };
    }

    if (selected.persistedStatus && selected.persistedStatus !== 'active') {
      return await refuse(ctx, userId, 'assignment_expired', `${item.slug} · refused: release batch is closed`, item.contentId);
    }

    const now = Date.now();
    const reviewId = await ctx.db.insert('contentReviews', {
      contentSlug: item.slug, contentVersion: item.reviewRevision, reviewRevision: item.reviewRevision,
      dimension: registration.dimension, decision: args.decision, note: note || undefined, reviewerId: userId,
      reviewerDisplayName: reviewer.displayName,
      reviewerQualification: reviewer.qualification, reviewerRole: reviewer.role,
      reviewedAt: now, decisionKey: state.assignmentId, clinicalReviewBatchId: registration.manifest.batchId,
      createdAt: now, updatedAt: now,
    });
    const receipt: DecisionReceipt = { decision: args.decision, note: note || null, reviewedAt: now, receiptId: String(reviewId) };
    await logAudit(ctx, userId, 'clinicalReviewBatch.decision', 'libraryContent', item.contentId,
      `${item.kind}:${item.slug} · revision ${item.reviewRevision} · ${args.decision} · ${state.assignmentId}`,
      {
        result: 'ok',
        before: JSON.stringify({ batchId: registration.manifest.batchId, freezeDigest: registration.freezeDigest, assignmentId: state.assignmentId, snapshotDigest: snapshot.digest }),
        after: JSON.stringify(receipt),
      },
    );
    const completedStates = batchStates.map((candidate) => candidate.item.slug === item.slug
      ? { ...candidate, decision: receipt }
      : candidate);
    const handoff = await completionHandoff(
      registration,
      completedStates,
      await freezeReceiptDigest(registration),
    );
    await persistHandoffReceipt(ctx, registration, handoff);
    await closePersistedReleaseBatch(ctx, registration, receipt.decision, handoff);
    return { ok: true as const, decisionKey: state.assignmentId, duplicate: false, receipt, ...(handoff ? { handoff } : {}) };
  },
});
