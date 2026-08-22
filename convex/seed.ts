// One-shot admin seeding of the content library from a JSON snapshot generated
// from src/content/seed. This is an INTERNAL mutation — it can only be invoked
// by the Convex CLI/admin (`npx convex run seed:run`), never by app clients, so
// it safely skips the staff auth gate that guards the public importSeed. It is
// idempotent (upsert by slug) and never overrides an existing review decision.
import { internalMutation, internalQuery, type QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { v } from 'convex/values';
import { logAudit } from './audit';
import seedData from './seedData.json';
import {
  publishedErrataSlugs,
  seedAuditSummary,
  seedMayUpdateExisting,
  seedMediaIsProtected,
} from './lib/seedPolicy';
import {
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET,
  DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
  DUPLICATE_MILESTONE_SLUGS,
  SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
  SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS,
  isRetiredContentSlug,
  type BrightFuturesDuplicateMilestoneRetirementSlug,
  type DuplicateMilestoneSlug,
  type SocialEmotionalMilestoneRetirementSlug,
} from './lib/contentRetirements';
import {
  EVIDENCE_REVIEWED_EDUCATION_SOURCE,
  FOCUSED_SPECIALIST_REVIEW_SLUGS,
  isFocusedSpecialistReviewSlug,
  isPublishedContentCorrectionSlug,
  LEGACY_PENDING_REVIEW_SOURCE,
  PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
} from './lib/evidenceSafetyRelease';
import {
  PLACEHOLDER_PRINTABLE_SLUGS,
  PRINTABLE_PAYLOAD_RELEASE_ID,
} from './lib/printablePayloadRelease';
import {
  BURMESE_COPY_AUDIT_HELD_SLUGS,
  BURMESE_COPY_AUDIT_PAYLOAD_SHA256,
  BURMESE_COPY_AUDIT_RELEASE_ID,
  BURMESE_COPY_AUDIT_SUPERSEDED_SLUGS,
  BURMESE_COPY_AUDIT_TARGETS,
  type BurmeseCopyAuditTarget,
} from './lib/burmeseCopyAuditRelease';
import {
  CLINICAL_REVIEW_COPY_PAYLOAD_SHA256,
  CLINICAL_REVIEW_COPY_RELEASE_ID,
  CLINICAL_REVIEW_COPY_TARGETS,
  type ClinicalReviewCopyTarget,
} from './lib/clinicalReviewCopyRelease';
import { isManualReviewContentCasTargetSlug } from './lib/manualReviewContentCasData';
import { isBirth2mNutritionCasTargetSlug } from './lib/birth2mNutritionCasData';

const GRANTABLE_ROLES = [
  'owner',
  'content_editor',
  'language_reviewer',
  'evidence_reviewer',
  'clinical_reviewer',
  'review_manager',
  'support',
] as const;

// Grant staff access to an account by email. INTERNAL — CLI/admin only
// (`npx convex run seed:grantStaffByEmail '{"email":"you@example.com"}'`), never
// callable from the app. Bootstraps the first owner and recovers a locked-out one.
//
// Convex Auth mints a SEPARATE `users` row per sign-in method, so one person who
// has used both Google and email+password has two user ids under the same email.
// The previous version REFUSED when it saw more than one — which left the owner
// permanently locked out, because there was then no path to grant either row.
// This is exactly the "even the owner can't get in" failure. So every user row
// for the email is granted, not a silently-picked one: whichever way the owner
// signs in, that identity is staff. Email-scoped and owner-run, so this cannot
// escalate anyone else.
export const grantStaffByEmail = internalMutation({
  args: {
    email: v.string(),
    role: v.optional(v.union(...GRANTABLE_ROLES.map((r) => v.literal(r)))),
  },
  handler: async (ctx, { email, role }) => {
    const norm = email.trim().toLowerCase();
    const grantRole = role ?? 'owner';
    const users = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', norm))
      .take(20);
    if (users.length === 0) return { ok: false, reason: 'no account has that email', granted: 0, accounts: [] };

    const accounts: { userId: string; action: 'patched' | 'created' }[] = [];
    for (const user of users) {
      const profile = await ctx.db
        .query('parentProfiles')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, { isStaff: true, staffRole: grantRole });
        accounts.push({ userId: user._id, action: 'patched' });
      } else {
        await ctx.db.insert('parentProfiles', {
          userId: user._id,
          preferredLocale: 'mm',
          isStaff: true,
          staffRole: grantRole,
        });
        accounts.push({ userId: user._id, action: 'created' });
      }
      await logAudit(ctx, user._id, 'staff.grant', 'parentProfiles', user._id, `${norm} -> ${grantRole}`);
    }
    return { ok: true, granted: accounts.length, role: grantRole, accounts };
  },
});

// Read-only diagnosis of staff access. INTERNAL — CLI/admin only
// (`npx convex run seed:staffDiagnostics '{"email":"you@example.com"}'`).
// Answers "why can't I get into /admin?" without guessing: it lists every
// account row for the email with its staff status, and every current staff
// account, so a split Google-vs-password identity is visible at a glance.
export const staffDiagnostics = internalQuery({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, { email }) => {
    const norm = email?.trim().toLowerCase();

    const accountsForEmail: Array<{
      userId: string;
      email: string | null;
      hasProfile: boolean;
      isStaff: boolean;
      staffRole: string | null;
    }> = [];
    if (norm) {
      const users = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', norm))
        .take(20);
      for (const user of users) {
        const profile = await ctx.db
          .query('parentProfiles')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .unique();
        accountsForEmail.push({
          userId: user._id,
          email: (user as { email?: string }).email ?? null,
          hasProfile: profile !== null,
          isStaff: profile?.isStaff === true,
          staffRole: profile?.staffRole ?? null,
        });
      }
    }

    const staffProfiles = await ctx.db
      .query('parentProfiles')
      .withIndex('by_is_staff', (q) => q.eq('isStaff', true))
      .take(100);
    const allStaff = await Promise.all(
      staffProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          userId: profile.userId,
          email: (user as { email?: string } | null)?.email ?? null,
          staffRole: profile.staffRole ?? '(legacy isStaff → owner)',
          displayName: profile.displayName?.trim() || null,
        };
      }),
    );

    return {
      queriedEmail: norm ?? null,
      accountsForEmail,
      accountsForEmailCount: accountsForEmail.length,
      staffCount: allStaff.length,
      allStaff,
    };
  },
});

type Media = { kind: string; placeholder?: boolean; offline?: boolean; note?: string };
type Item = {
  type: string; slug: string; ageGroupKey?: string; domainKey?: string; category?: string;
  titleMm: string; titleEn: string; summaryMm?: string; summaryEn?: string; tags: string[];
  difficulty?: string; durationMinutes?: number; offline?: boolean; source: string;
  version: number; clinicalStatus: string; data: unknown; media: Media[]; searchText: string;
};

/** Server-side fail-closed guard for stale or hand-built CLI seed artifacts. */
export function seedRunSkipsItem(item: Pick<Item, 'type' | 'slug'>): boolean {
  return isRetiredContentSlug(item.slug)
    || isManualReviewContentCasTargetSlug(item.slug)
    || isBirth2mNutritionCasTargetSlug(item.slug);
}

const PUBLISHED_RELEASE_LIMIT = 5_000;

const publishedReleaseTargetValidator = v.object({
  slug: v.string(),
  expectedReviewRevision: v.number(),
});

const specialistReleaseTargetValidator = v.object({
  slug: v.string(),
  expectedClinicalStatus: v.string(),
  expectedReviewRevision: v.number(),
});

const publishedReleaseRowValidator = v.object({
  slug: v.string(),
  reviewRevision: v.number(),
  sourceState: v.union(v.literal('legacy'), v.literal('reviewed'), v.literal('unexpected')),
  action: v.union(
    v.literal('metadata_only'),
    v.literal('correction_to_review'),
    v.literal('specialist_to_review'),
  ),
});

const specialistReleaseRowValidator = v.object({
  slug: v.string(),
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
});

function sourceState(source: string): 'legacy' | 'reviewed' | 'unexpected' {
  if (source === LEGACY_PENDING_REVIEW_SOURCE) return 'legacy';
  if (source === EVIDENCE_REVIEWED_EDUCATION_SOURCE) return 'reviewed';
  return 'unexpected';
}

function publishedReleaseAction(slug: string) {
  if (isPublishedContentCorrectionSlug(slug)) return 'correction_to_review' as const;
  if (isFocusedSpecialistReviewSlug(slug)) return 'specialist_to_review' as const;
  return 'metadata_only' as const;
}

function desiredLibraryPatch(desired: Item) {
  return {
    type: desired.type,
    slug: desired.slug,
    ageGroupKey: desired.ageGroupKey,
    domainKey: desired.domainKey,
    category: desired.category,
    titleMm: desired.titleMm,
    titleEn: desired.titleEn,
    summaryMm: desired.summaryMm,
    summaryEn: desired.summaryEn,
    tags: desired.tags,
    difficulty: desired.difficulty,
    durationMinutes: desired.durationMinutes,
    offline: desired.offline,
    data: desired.data,
    source: desired.source,
    version: desired.version,
    searchText: desired.searchText,
  };
}

const burmeseCopyAuditActionValidator = v.union(
  v.literal('ready'),
  v.literal('already_current'),
  v.literal('already_applied'),
  v.literal('seed_mismatch'),
  v.literal('missing_seed'),
  v.literal('missing_row'),
  v.literal('not_published'),
  v.literal('stale_state'),
);

const burmeseCopyAuditRowValidator = v.object({
  slug: v.string(),
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  expectedReviewRevision: v.number(),
  expectedUpdatedAt: v.number(),
  seedMatchesRelease: v.boolean(),
  desiredMatches: v.boolean(),
  action: burmeseCopyAuditActionValidator,
});

function releasePathValue(value: unknown, path: string): unknown {
  let current = value;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0) return undefined;
      current = current[index];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  return current;
}

type CopyPatchTarget = {
  slug: string;
  patches: readonly { path: string; value: string }[];
};

function seedMatchesBurmeseCopyRelease(target: CopyPatchTarget, desired: Item): boolean {
  return target.patches.every((patch) =>
    releasePathValue(desired, patch.path) === patch.value);
}

function rowPatchValuesMatchBurmeseCopyRelease(
  target: CopyPatchTarget,
  row: Doc<'libraryContent'>,
): boolean {
  return target.patches.every((patch) =>
    releasePathValue(row, patch.path) === patch.value);
}

function setNestedString(root: unknown, path: string[], value: string) {
  let current = root;
  for (const part of path.slice(0, -1)) {
    if (!current || typeof current !== 'object') {
      throw new Error(`Burmese copy patch path is not traversable: ${path.join('.')}`);
    }
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        throw new Error(`Burmese copy patch array index is invalid: ${path.join('.')}`);
      }
      current = current[index];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  const leaf = path.at(-1);
  if (!leaf) throw new Error('Burmese copy patch path is empty');
  if (!current || typeof current !== 'object') {
    throw new Error(`Burmese copy patch parent is not traversable: ${path.join('.')}`);
  }
  if (Array.isArray(current)) {
    const index = Number(leaf);
    if (!Number.isInteger(index) || index < 0 || index >= current.length) {
      throw new Error(`Burmese copy patch array index is invalid: ${path.join('.')}`);
    }
    current[index] = value;
  } else {
    (current as Record<string, unknown>)[leaf] = value;
  }
}

function collectSearchStrings(value: unknown, out: string[]): void {
  if (value == null) return;
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSearchStrings(entry, out));
    return;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => collectSearchStrings(entry, out));
  }
}

function searchTextForLibraryRow(row: {
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  tags: string[];
  data: unknown;
}) {
  const parts = [
    row.titleMm,
    row.titleEn,
    row.summaryMm ?? '',
    row.summaryEn ?? '',
    ...row.tags,
  ];
  collectSearchStrings(row.data, parts);
  return parts.join(' ').toLowerCase();
}

function burmeseCopyPatchForRow(
  target: CopyPatchTarget,
  row: Doc<'libraryContent'>,
) {
  let titleMm = row.titleMm;
  let summaryMm = row.summaryMm;
  let data = row.data;
  let dataChanged = false;
  let titleChanged = false;
  let summaryChanged = false;

  for (const patch of target.patches) {
    if (patch.path === 'titleMm') {
      titleMm = patch.value;
      titleChanged = true;
      continue;
    }
    if (patch.path === 'summaryMm') {
      summaryMm = patch.value;
      summaryChanged = true;
      continue;
    }
    if (!dataChanged) {
      data = JSON.parse(JSON.stringify(row.data)) as unknown;
      dataChanged = true;
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`Burmese copy data is not patchable: ${target.slug}`);
    }
    setNestedString(data, patch.path.slice('data.'.length).split('.'), patch.value);
  }

  const update: Record<string, unknown> = {};
  if (titleChanged) update.titleMm = titleMm;
  if (summaryChanged) update.summaryMm = summaryMm;
  if (dataChanged) update.data = data;
  update.searchText = searchTextForLibraryRow({
    titleMm,
    titleEn: row.titleEn,
    summaryMm,
    summaryEn: row.summaryEn,
    tags: row.tags,
    data,
  });
  return update;
}

function rowMatchesBurmeseCopyRelease(
  target: CopyPatchTarget,
  row: Doc<'libraryContent'>,
): boolean {
  if (!rowPatchValuesMatchBurmeseCopyRelease(target, row)) return false;
  return row.searchText === burmeseCopyPatchForRow(target, row).searchText;
}

async function burmeseCopyAuditReleaseApplied(ctx: Pick<QueryCtx, 'db'>) {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', 'library.burmese_copy_audit.release'))
    .take(100);
  return rows.some((row) => row.summary === BURMESE_COPY_AUDIT_RELEASE_ID);
}

function burmeseCopySeedStillMatchesHistoricalRelease(
  target: CopyPatchTarget,
  desired: Item | undefined,
): boolean {
  if ((BURMESE_COPY_AUDIT_SUPERSEDED_SLUGS as readonly string[]).includes(target.slug)) {
    return desired !== undefined || isRetiredContentSlug(target.slug);
  }
  return desired !== undefined && seedMatchesBurmeseCopyRelease(target, desired);
}

/** Read-only, exact-state preflight for the published Burmese copy release. */
export const preflightBurmeseCopyAuditRelease = internalQuery({
  args: { releaseId: v.literal(BURMESE_COPY_AUDIT_RELEASE_ID) },
  returns: v.object({
    releaseApplied: v.boolean(),
    payloadSha256: v.string(),
    heldSlugs: v.array(v.string()),
    targets: v.array(burmeseCopyAuditRowValidator),
  }),
  handler: async (ctx) => {
    const releaseApplied = await burmeseCopyAuditReleaseApplied(ctx);
    const desiredBySlug = new Map((seedData as unknown as Item[]).map((item) => [item.slug, item]));
    const targets = [];
    for (const target of BURMESE_COPY_AUDIT_TARGETS) {
      const desired = desiredBySlug.get(target.slug);
      const row = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .unique();
      const seedMatchesRelease = burmeseCopySeedStillMatchesHistoricalRelease(target, desired);
      const desiredMatches = Boolean(row && rowMatchesBurmeseCopyRelease(target, row));
      let action: 'ready' | 'already_current' | 'already_applied' | 'seed_mismatch' | 'missing_seed'
        | 'missing_row' | 'not_published' | 'stale_state';
      if (releaseApplied) action = 'already_applied';
      else if (!desired && !seedMatchesRelease) action = 'missing_seed';
      else if (!seedMatchesRelease) action = 'seed_mismatch';
      else if (!row) action = 'missing_row';
      else if (row.clinicalStatus !== 'published') action = 'not_published';
      else if (
        (row.reviewRevision ?? 1) !== target.expectedReviewRevision
        || row.updatedAt !== target.expectedUpdatedAt
      ) action = 'stale_state';
      else if (desiredMatches) action = 'already_current';
      else action = 'ready';
      targets.push({
        slug: target.slug,
        found: row !== null,
        clinicalStatus: row?.clinicalStatus ?? null,
        reviewRevision: row ? (row.reviewRevision ?? 1) : null,
        updatedAt: row?.updatedAt ?? null,
        expectedReviewRevision: target.expectedReviewRevision,
        expectedUpdatedAt: target.expectedUpdatedAt,
        seedMatchesRelease,
        desiredMatches,
        action,
      });
    }
    return {
      releaseApplied,
      payloadSha256: BURMESE_COPY_AUDIT_PAYLOAD_SHA256,
      heldSlugs: [...BURMESE_COPY_AUDIT_HELD_SLUGS],
      targets,
    };
  },
});

/**
 * Apply only the 25 code-reviewed language corrections that were published at
 * the exact state captured by the preflight. The specialist safe-sleep row and
 * every row already in clinical review are deliberately outside this release.
 * All targets are validated before the first write, and a completion audit
 * makes the operation idempotent.
 */
export const applyBurmeseCopyAuditRelease = internalMutation({
  args: { releaseId: v.literal(BURMESE_COPY_AUDIT_RELEASE_ID) },
  returns: v.object({
    alreadyApplied: v.boolean(),
    updated: v.number(),
    unchanged: v.number(),
    total: v.number(),
    held: v.number(),
  }),
  handler: async (ctx) => {
    if (await burmeseCopyAuditReleaseApplied(ctx)) {
      return {
        alreadyApplied: true,
        updated: 0,
        unchanged: 0,
        total: 0,
        held: BURMESE_COPY_AUDIT_HELD_SLUGS.length,
      };
    }

    const desiredBySlug = new Map((seedData as unknown as Item[]).map((item) => [item.slug, item]));
    const validated: Array<{
      row: Doc<'libraryContent'>;
      target: BurmeseCopyAuditTarget;
      changed: boolean;
    }> = [];
    for (const target of BURMESE_COPY_AUDIT_TARGETS) {
      const desired = desiredBySlug.get(target.slug);
      const row = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .unique();
      if (!burmeseCopySeedStillMatchesHistoricalRelease(target, desired)) {
        throw new Error(desired
          ? `Burmese copy seed does not match immutable release: ${target.slug}`
          : `Burmese copy target missing from seed: ${target.slug}`);
      }
      if (!row) throw new Error(`Burmese copy target missing from production: ${target.slug}`);
      if (row.clinicalStatus !== 'published') {
        throw new Error(`Burmese copy target is no longer published: ${target.slug}`);
      }
      if (
        (row.reviewRevision ?? 1) !== target.expectedReviewRevision
        || row.updatedAt !== target.expectedUpdatedAt
      ) {
        throw new Error(`Burmese copy target changed after preflight: ${target.slug}`);
      }
      validated.push({ target, row, changed: !rowMatchesBurmeseCopyRelease(target, row) });
    }

    const now = Date.now();
    let updated = 0;
    let unchanged = 0;
    for (const { target, row, changed } of validated) {
      if (!changed) {
        unchanged += 1;
        continue;
      }
      const rowUpdate = burmeseCopyPatchForRow(target, row);
      const changes: Array<{ path: string; before: unknown; after: unknown }> = target.patches.map((patch) => ({
        path: patch.path,
        before: releasePathValue(row, patch.path),
        after: patch.value,
      }));
      if (row.searchText !== rowUpdate.searchText) {
        changes.push({ path: 'searchText', before: row.searchText, after: rowUpdate.searchText });
      }
      await ctx.db.patch(row._id, { ...rowUpdate, updatedAt: now });
      await logAudit(
        ctx,
        null,
        'library.published_errata',
        'libraryContent',
        row._id,
        `${BURMESE_COPY_AUDIT_RELEASE_ID} · ${row.slug}`,
        {
          before: JSON.stringify({ reviewRevision: row.reviewRevision ?? 1, updatedAt: row.updatedAt }),
          after: JSON.stringify({ reviewRevision: row.reviewRevision ?? 1, updatedAt: now, changes }),
        },
      );
      updated += 1;
    }
    await logAudit(
      ctx,
      null,
      'library.burmese_copy_audit.release',
      'libraryContent',
      undefined,
      BURMESE_COPY_AUDIT_RELEASE_ID,
      {
        after: JSON.stringify({
          payloadSha256: BURMESE_COPY_AUDIT_PAYLOAD_SHA256,
          updated,
          unchanged,
          total: validated.length,
        }),
      },
    );
    return {
      alreadyApplied: false,
      updated,
      unchanged,
      total: validated.length,
      held: BURMESE_COPY_AUDIT_HELD_SLUGS.length,
    };
  },
});

const clinicalReviewCopyActionValidator = v.union(
  v.literal('ready'),
  v.literal('already_current'),
  v.literal('already_applied'),
  v.literal('seed_mismatch'),
  v.literal('missing_seed'),
  v.literal('missing_row'),
  v.literal('unexpected_status'),
  v.literal('stale_state'),
  v.literal('before_mismatch'),
);

const clinicalReviewCopyRowValidator = v.object({
  slug: v.string(),
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  expectedClinicalStatus: v.string(),
  expectedReviewRevision: v.number(),
  expectedUpdatedAt: v.number(),
  seedMatchesRelease: v.boolean(),
  currentMatchesExpected: v.boolean(),
  desiredMatches: v.boolean(),
  action: clinicalReviewCopyActionValidator,
});

function rowMatchesExpectedClinicalReviewCopy(
  target: ClinicalReviewCopyTarget,
  row: Doc<'libraryContent'>,
): boolean {
  return target.patches.every((patch) =>
    releasePathValue(row, patch.path) === patch.before);
}

async function clinicalReviewCopyReleaseApplied(ctx: Pick<QueryCtx, 'db'>) {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', 'library.clinical_review_copy.release'))
    .take(100);
  return rows.some((row) => row.summary === CLINICAL_REVIEW_COPY_RELEASE_ID);
}

/**
 * Read-only exact-state preflight for the two reviewed Burmese corrections.
 * A caller should run this against production after deployment and apply only
 * when every action is `ready`.
 */
export const preflightClinicalReviewCopyRelease = internalQuery({
  args: { releaseId: v.literal(CLINICAL_REVIEW_COPY_RELEASE_ID) },
  returns: v.object({
    releaseApplied: v.boolean(),
    payloadSha256: v.string(),
    targets: v.array(clinicalReviewCopyRowValidator),
  }),
  handler: async (ctx) => {
    const releaseApplied = await clinicalReviewCopyReleaseApplied(ctx);
    const desiredBySlug = new Map((seedData as unknown as Item[]).map((item) => [item.slug, item]));
    const targets = [];
    for (const target of CLINICAL_REVIEW_COPY_TARGETS) {
      const desired = desiredBySlug.get(target.slug);
      const row = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .unique();
      const seedMatchesRelease = Boolean(desired && seedMatchesBurmeseCopyRelease(target, desired));
      const currentMatchesExpected = Boolean(row && rowMatchesExpectedClinicalReviewCopy(target, row));
      const desiredMatches = Boolean(row && rowMatchesBurmeseCopyRelease(target, row));
      let action: 'ready' | 'already_current' | 'already_applied' | 'seed_mismatch'
        | 'missing_seed' | 'missing_row' | 'unexpected_status' | 'stale_state'
        | 'before_mismatch';
      if (releaseApplied) action = 'already_applied';
      else if (!desired) action = 'missing_seed';
      else if (!seedMatchesRelease) action = 'seed_mismatch';
      else if (!row) action = 'missing_row';
      else if (row.clinicalStatus !== target.expectedClinicalStatus) action = 'unexpected_status';
      else if (
        (row.reviewRevision ?? 1) !== target.expectedReviewRevision
        || row.updatedAt !== target.expectedUpdatedAt
      ) action = 'stale_state';
      else if (desiredMatches) action = 'already_current';
      else if (!currentMatchesExpected) action = 'before_mismatch';
      else action = 'ready';
      targets.push({
        slug: target.slug,
        found: row !== null,
        clinicalStatus: row?.clinicalStatus ?? null,
        reviewRevision: row ? (row.reviewRevision ?? 1) : null,
        updatedAt: row?.updatedAt ?? null,
        expectedClinicalStatus: target.expectedClinicalStatus,
        expectedReviewRevision: target.expectedReviewRevision,
        expectedUpdatedAt: target.expectedUpdatedAt,
        seedMatchesRelease,
        currentMatchesExpected,
        desiredMatches,
        action,
      });
    }
    return {
      releaseApplied,
      payloadSha256: CLINICAL_REVIEW_COPY_PAYLOAD_SHA256,
      targets,
    };
  },
});

/**
 * Apply exactly two review-queue copy corrections. Every target is validated
 * before the first write, only allowlisted Burmese paths and the derived
 * search index are patched, and prior review decisions are invalidated by a
 * review-revision increment while the row remains in clinical review.
 */
export const applyClinicalReviewCopyRelease = internalMutation({
  args: { releaseId: v.literal(CLINICAL_REVIEW_COPY_RELEASE_ID) },
  returns: v.object({
    alreadyApplied: v.boolean(),
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    if (await clinicalReviewCopyReleaseApplied(ctx)) {
      return { alreadyApplied: true, updated: 0, total: 0 };
    }

    const desiredBySlug = new Map((seedData as unknown as Item[]).map((item) => [item.slug, item]));
    const validated: Array<{
      row: Doc<'libraryContent'>;
      target: ClinicalReviewCopyTarget;
    }> = [];
    for (const target of CLINICAL_REVIEW_COPY_TARGETS) {
      const desired = desiredBySlug.get(target.slug);
      const row = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .unique();
      if (!desired) throw new Error(`Clinical-review copy target missing from seed: ${target.slug}`);
      if (!seedMatchesBurmeseCopyRelease(target, desired)) {
        throw new Error(`Clinical-review copy seed does not match immutable release: ${target.slug}`);
      }
      if (!row) throw new Error(`Clinical-review copy target missing from production: ${target.slug}`);
      if (row.clinicalStatus !== target.expectedClinicalStatus) {
        throw new Error(`Clinical-review copy target has unexpected status: ${target.slug}`);
      }
      if (
        (row.reviewRevision ?? 1) !== target.expectedReviewRevision
        || row.updatedAt !== target.expectedUpdatedAt
      ) {
        throw new Error(`Clinical-review copy target changed after preflight: ${target.slug}`);
      }
      if (!rowMatchesExpectedClinicalReviewCopy(target, row)) {
        throw new Error(`Clinical-review copy target no longer matches expected text: ${target.slug}`);
      }
      validated.push({ target, row });
    }

    const now = Date.now();
    for (const { target, row } of validated) {
      const rowUpdate = burmeseCopyPatchForRow(target, row);
      const reviewRevision = (row.reviewRevision ?? 1) + 1;
      const changes: Array<{ path: string; before: unknown; after: unknown }> =
        target.patches.map((patch) => ({
          path: patch.path,
          before: patch.before,
          after: patch.value,
        }));
      if (row.searchText !== rowUpdate.searchText) {
        changes.push({ path: 'searchText', before: row.searchText, after: rowUpdate.searchText });
      }
      await ctx.db.patch(row._id, {
        ...rowUpdate,
        reviewRevision,
        clinicalStatus: 'clinical_review',
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: undefined,
        updatedAt: now,
      });
      await logAudit(
        ctx,
        null,
        'library.clinical_review_copy.updated',
        'libraryContent',
        row._id,
        `${CLINICAL_REVIEW_COPY_RELEASE_ID} · ${row.slug}`,
        {
          before: JSON.stringify({
            clinicalStatus: row.clinicalStatus,
            reviewRevision: row.reviewRevision ?? 1,
            updatedAt: row.updatedAt,
          }),
          after: JSON.stringify({
            clinicalStatus: 'clinical_review',
            reviewRevision,
            updatedAt: now,
            changes,
          }),
        },
      );
    }
    await logAudit(
      ctx,
      null,
      'library.clinical_review_copy.release',
      'libraryContent',
      undefined,
      CLINICAL_REVIEW_COPY_RELEASE_ID,
      {
        after: JSON.stringify({
          payloadSha256: CLINICAL_REVIEW_COPY_PAYLOAD_SHA256,
          updated: validated.length,
          total: validated.length,
        }),
      },
    );
    return { alreadyApplied: false, updated: validated.length, total: validated.length };
  },
});

async function evidenceSafetyReleaseApplied(ctx: Pick<QueryCtx, 'db'>) {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', 'library.evidence_safety.release'))
    .take(100);
  return rows.some((row) => row.summary === PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID);
}

/**
 * Read-only snapshot for the exact published-content release. The caller must
 * pass every returned slug/revision back to the mutation. This binds the write
 * to the complete parent-visible catalogue instead of a stale count.
 */
export const preflightPublishedEvidenceSafetyRelease = internalQuery({
  args: { releaseId: v.literal(PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID) },
  returns: v.object({
    releaseApplied: v.boolean(),
    published: v.array(publishedReleaseRowValidator),
    specialist: v.array(specialistReleaseRowValidator),
  }),
  handler: async (ctx) => {
    const publishedRows = await ctx.db
      .query('libraryContent')
      .withIndex('by_status', (q) => q.eq('clinicalStatus', 'published'))
      .take(PUBLISHED_RELEASE_LIMIT + 1);
    if (publishedRows.length > PUBLISHED_RELEASE_LIMIT) {
      throw new Error('Published catalogue exceeds the guarded release limit');
    }
    const published = publishedRows
      .map((row) => ({
        slug: row.slug,
        reviewRevision: row.reviewRevision ?? 1,
        sourceState: sourceState(row.source),
        action: publishedReleaseAction(row.slug),
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
    const specialist = [];
    for (const slug of FOCUSED_SPECIALIST_REVIEW_SLUGS) {
      const row = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      specialist.push({
        slug,
        found: row !== null,
        clinicalStatus: row?.clinicalStatus ?? null,
        reviewRevision: row ? (row.reviewRevision ?? 1) : null,
      });
    }
    return {
      releaseApplied: await evidenceSafetyReleaseApplied(ctx),
      published,
      specialist,
    };
  },
});

/**
 * Reconcile reviewed source metadata and stage every substantive or
 * specialist-scoped edit at a fresh review revision.
 *
 * The exact current published set and every review revision are validated
 * before the first write. Ordinary metadata-only rows remain published;
 * changed wording and emergency-decision wording fail closed into review.
 */
export const applyPublishedEvidenceSafetyRelease = internalMutation({
  args: {
    releaseId: v.literal(PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID),
    publishedTargets: v.array(publishedReleaseTargetValidator),
    specialistTargets: v.array(specialistReleaseTargetValidator),
  },
  returns: v.object({
    alreadyApplied: v.boolean(),
    metadataUpdated: v.number(),
    correctionsStaged: v.number(),
    specialistStaged: v.number(),
    specialistAlreadyInReview: v.number(),
    unchanged: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    if (await evidenceSafetyReleaseApplied(ctx)) {
      return {
        alreadyApplied: true,
        metadataUpdated: 0,
        correctionsStaged: 0,
        specialistStaged: 0,
        specialistAlreadyInReview: 0,
        unchanged: 0,
        total: 0,
      };
    }

    const publishedRows = await ctx.db
      .query('libraryContent')
      .withIndex('by_status', (q) => q.eq('clinicalStatus', 'published'))
      .take(PUBLISHED_RELEASE_LIMIT + 1);
    if (publishedRows.length > PUBLISHED_RELEASE_LIMIT) {
      throw new Error('Published catalogue exceeds the guarded release limit');
    }
    const suppliedSlugs = new Set(args.publishedTargets.map((target) => target.slug));
    const currentSlugs = new Set(publishedRows.map((row) => row.slug));
    if (
      suppliedSlugs.size !== args.publishedTargets.length
      || args.publishedTargets.length !== publishedRows.length
      || [...currentSlugs].some((slug) => !suppliedSlugs.has(slug))
    ) {
      throw new Error('Published targets must match the complete current published catalogue');
    }

    const expectedSpecialistSlugs = new Set<string>(FOCUSED_SPECIALIST_REVIEW_SLUGS);
    const suppliedSpecialistSlugs = new Set(args.specialistTargets.map((target) => target.slug));
    if (
      suppliedSpecialistSlugs.size !== args.specialistTargets.length
      || args.specialistTargets.length !== expectedSpecialistSlugs.size
      || [...expectedSpecialistSlugs].some((slug) => !suppliedSpecialistSlugs.has(slug))
    ) {
      throw new Error('Specialist targets must match the complete focused specialist set');
    }

    let specialistAlreadyInReview = 0;
    const specialistTargetBySlug = new Map(args.specialistTargets.map((target) => [target.slug, target]));
    for (const slug of FOCUSED_SPECIALIST_REVIEW_SLUGS) {
      const row = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      const target = specialistTargetBySlug.get(slug);
      if (
        !row
        || !target
        || row.clinicalStatus !== target.expectedClinicalStatus
        || (row.reviewRevision ?? 1) !== target.expectedReviewRevision
      ) {
        throw new Error(`Specialist target changed after preflight: ${slug}`);
      }
      if (row.clinicalStatus !== 'published' && row.clinicalStatus !== 'clinical_review') {
        throw new Error(`Specialist target is not in a releasable review state: ${slug}`);
      }
      if (row.clinicalStatus === 'clinical_review') specialistAlreadyInReview += 1;
    }

    const desiredBySlug = new Map((seedData as unknown as Item[]).map((item) => [item.slug, item]));
    const targetBySlug = new Map(args.publishedTargets.map((target) => [target.slug, target]));
    for (const row of publishedRows) {
      const target = targetBySlug.get(row.slug);
      if (!target || target.expectedReviewRevision !== (row.reviewRevision ?? 1)) {
        throw new Error(`Published target has a newer review revision: ${row.slug}`);
      }
      if (sourceState(row.source) === 'unexpected') {
        throw new Error(`Published target has unexpected source metadata: ${row.slug}`);
      }
      if (!desiredBySlug.has(row.slug)) {
        throw new Error(`Published target is missing from the reviewed seed: ${row.slug}`);
      }
    }

    let metadataUpdated = 0;
    let correctionsStaged = 0;
    let specialistStaged = 0;
    let unchanged = 0;
    const now = Date.now();
    for (const row of publishedRows) {
      const action = publishedReleaseAction(row.slug);
      if (action === 'metadata_only') {
        if (row.source === EVIDENCE_REVIEWED_EDUCATION_SOURCE) {
          unchanged += 1;
          continue;
        }
        await ctx.db.patch(row._id, {
          source: EVIDENCE_REVIEWED_EDUCATION_SOURCE,
          updatedAt: now,
        });
        await logAudit(
          ctx,
          null,
          'library.evidence_safety.source_metadata_updated',
          'libraryContent',
          row._id,
          `${PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID} · ${row.slug}`,
          { before: row.source, after: EVIDENCE_REVIEWED_EDUCATION_SOURCE },
        );
        metadataUpdated += 1;
        continue;
      }

      const desired = desiredBySlug.get(row.slug);
      if (!desired) throw new Error(`Reviewed seed target missing: ${row.slug}`);
      const reviewRevision = (row.reviewRevision ?? 1) + 1;
      await ctx.db.patch(row._id, {
        ...desiredLibraryPatch(desired),
        reviewRevision,
        clinicalStatus: 'clinical_review',
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: undefined,
        updatedAt: now,
      });
      await logAudit(
        ctx,
        null,
        action === 'specialist_to_review'
          ? 'library.evidence_safety.specialist_review_staged'
          : 'library.evidence_safety.correction_staged',
        'libraryContent',
        row._id,
        `${PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID} · ${row.slug}`,
        {
          before: JSON.stringify({
            clinicalStatus: row.clinicalStatus,
            reviewRevision: row.reviewRevision ?? 1,
          }),
          after: JSON.stringify({ clinicalStatus: 'clinical_review', reviewRevision }),
        },
      );
      if (action === 'specialist_to_review') specialistStaged += 1;
      else correctionsStaged += 1;
    }

    await logAudit(
      ctx,
      null,
      'library.evidence_safety.release',
      'libraryContent',
      undefined,
      PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
      {
        after: JSON.stringify({
          metadataUpdated,
          correctionsStaged,
          specialistStaged,
          specialistAlreadyInReview,
          unchanged,
          total: publishedRows.length,
        }),
      },
    );
    return {
      alreadyApplied: false,
      metadataUpdated,
      correctionsStaged,
      specialistStaged,
      specialistAlreadyInReview,
      unchanged,
      total: publishedRows.length,
    };
  },
});

const printablePayloadTargetValidator = v.object({
  slug: v.string(),
  expectedReviewRevision: v.number(),
});

const printablePayloadPreflightRowValidator = v.object({
  slug: v.string(),
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  pdfRows: v.number(),
  approvedPayloads: v.number(),
  previewSeedReady: v.boolean(),
});

function hasApprovedPrintablePayload(media: Doc<'libraryMedia'>): boolean {
  return (
    (media.kind === 'pdf' || media.kind === 'download')
    && media.placeholder !== true
    && media.reviewStatus === 'approved'
    && Boolean(media.url || media.storageId)
  );
}

function isPreviewOnlyPrintable(item: Item | undefined): boolean {
  if (!item || item.type !== 'printable' || typeof item.data !== 'object' || item.data === null) return false;
  const data = item.data as Record<string, unknown>;
  return (
    data.format === 'Preview only — bilingual PDF not yet available'
    && data.availability === 'preview_only'
  );
}

async function printablePayloadReleaseApplied(ctx: Pick<QueryCtx, 'db'>) {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', 'library.printable_payload.release'))
    .take(100);
  return rows.some((row) => row.summary === PRINTABLE_PAYLOAD_RELEASE_ID);
}

/** Read-only snapshot of the exact published placeholder-printable release. */
export const preflightPrintablePayloadRelease = internalQuery({
  args: { releaseId: v.literal(PRINTABLE_PAYLOAD_RELEASE_ID) },
  returns: v.object({
    releaseApplied: v.boolean(),
    publishedPrintableSlugs: v.array(v.string()),
    targets: v.array(printablePayloadPreflightRowValidator),
  }),
  handler: async (ctx) => {
    const desiredBySlug = new Map((seedData as unknown as Item[]).map((item) => [item.slug, item]));
    const printableRows = await ctx.db
      .query('libraryContent')
      .withIndex('by_type', (q) => q.eq('type', 'printable'))
      .take(PUBLISHED_RELEASE_LIMIT + 1);
    if (printableRows.length > PUBLISHED_RELEASE_LIMIT) {
      throw new Error('Printable catalogue exceeds the guarded release limit');
    }
    const targets = [];
    for (const slug of PLACEHOLDER_PRINTABLE_SLUGS) {
      const row = printableRows.find((candidate) => candidate.slug === slug) ?? null;
      const mediaRows = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', slug))
        .take(100);
      targets.push({
        slug,
        found: row !== null,
        clinicalStatus: row?.clinicalStatus ?? null,
        reviewRevision: row ? (row.reviewRevision ?? 1) : null,
        pdfRows: mediaRows.filter((media) => media.kind === 'pdf' || media.kind === 'download').length,
        approvedPayloads: mediaRows.filter(hasApprovedPrintablePayload).length,
        previewSeedReady: isPreviewOnlyPrintable(desiredBySlug.get(slug)),
      });
    }
    return {
      releaseApplied: await printablePayloadReleaseApplied(ctx),
      publishedPrintableSlugs: printableRows
        .filter((row) => row.clinicalStatus === 'published')
        .map((row) => row.slug)
        .sort((a, b) => a.localeCompare(b)),
      targets,
    };
  },
});

/**
 * Withdraw the exact parent-visible printable rows whose promised PDF is only
 * a placeholder. The reviewed preview-only catalogue wording is staged at a
 * fresh revision; media and history remain available to staff.
 */
export const applyPrintablePayloadRelease = internalMutation({
  args: {
    releaseId: v.literal(PRINTABLE_PAYLOAD_RELEASE_ID),
    targets: v.array(printablePayloadTargetValidator),
  },
  returns: v.object({
    alreadyApplied: v.boolean(),
    staged: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    if (await printablePayloadReleaseApplied(ctx)) {
      return { alreadyApplied: true, staged: 0, total: 0 };
    }

    const expectedSlugs = new Set<string>(PLACEHOLDER_PRINTABLE_SLUGS);
    const suppliedSlugs = new Set(args.targets.map((target) => target.slug));
    if (
      suppliedSlugs.size !== args.targets.length
      || args.targets.length !== expectedSlugs.size
      || [...expectedSlugs].some((slug) => !suppliedSlugs.has(slug))
    ) {
      throw new Error('Printable targets must match the exact placeholder release set');
    }

    const printableRows = await ctx.db
      .query('libraryContent')
      .withIndex('by_type', (q) => q.eq('type', 'printable'))
      .take(PUBLISHED_RELEASE_LIMIT + 1);
    if (printableRows.length > PUBLISHED_RELEASE_LIMIT) {
      throw new Error('Printable catalogue exceeds the guarded release limit');
    }
    const currentPublishedSlugs = printableRows
      .filter((row) => row.clinicalStatus === 'published')
      .map((row) => row.slug);
    if (
      currentPublishedSlugs.length !== expectedSlugs.size
      || currentPublishedSlugs.some((slug) => !expectedSlugs.has(slug))
    ) {
      throw new Error('Published printable catalogue changed after review');
    }

    const desiredBySlug = new Map((seedData as unknown as Item[]).map((item) => [item.slug, item]));
    const targetBySlug = new Map(args.targets.map((target) => [target.slug, target]));
    const validated: Array<{ row: Doc<'libraryContent'>; desired: Item }> = [];
    for (const slug of PLACEHOLDER_PRINTABLE_SLUGS) {
      const row = printableRows.find((candidate) => candidate.slug === slug);
      const target = targetBySlug.get(slug);
      const desired = desiredBySlug.get(slug);
      if (
        !row
        || !target
        || row.clinicalStatus !== 'published'
        || (row.reviewRevision ?? 1) !== target.expectedReviewRevision
      ) {
        throw new Error(`Printable target changed after preflight: ${slug}`);
      }
      if (!isPreviewOnlyPrintable(desired)) {
        throw new Error(`Printable preview-only seed is not ready: ${slug}`);
      }
      const mediaRows = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', slug))
        .take(100);
      if (mediaRows.some(hasApprovedPrintablePayload)) {
        throw new Error(`Printable now has an approved payload and needs content review: ${slug}`);
      }
      validated.push({ row, desired: desired as Item });
    }

    const now = Date.now();
    for (const { row, desired } of validated) {
      const reviewRevision = (row.reviewRevision ?? 1) + 1;
      await ctx.db.patch(row._id, {
        ...desiredLibraryPatch(desired),
        clinicalStatus: 'clinical_review',
        reviewRevision,
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: undefined,
        updatedAt: now,
      });
      await logAudit(
        ctx,
        null,
        'library.printable_payload.withdrawn',
        'libraryContent',
        row._id,
        `${PRINTABLE_PAYLOAD_RELEASE_ID} · ${row.slug}`,
        {
          before: JSON.stringify({
            clinicalStatus: row.clinicalStatus,
            reviewRevision: row.reviewRevision ?? 1,
            format: (row.data as Record<string, unknown>)?.format ?? null,
          }),
          after: JSON.stringify({
            clinicalStatus: 'clinical_review',
            reviewRevision,
            format: 'Preview only — bilingual PDF not yet available',
          }),
        },
      );
    }
    await logAudit(
      ctx,
      null,
      'library.printable_payload.release',
      'libraryContent',
      undefined,
      PRINTABLE_PAYLOAD_RELEASE_ID,
      { after: JSON.stringify({ staged: validated.length, total: validated.length }) },
    );
    return { alreadyApplied: false, staged: validated.length, total: validated.length };
  },
});

const duplicateMilestoneSlugValidator = v.union(
  v.literal('ms_5_6m_gross_motor_1'),
  v.literal('ms_5_6m_speech_1'),
  v.literal('ms_7_9m_gross_motor_1'),
  v.literal('ms_5_6m_fine_motor_1'),
  v.literal('ms_5_6m_language_1'),
  v.literal('ms_5_6m_social_1'),
);

const retirementPreflightRowValidator = v.object({
  slug: duplicateMilestoneSlugValidator,
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  mediaRows: v.number(),
  evidenceLinkRows: v.number(),
});

// The production preflight on 2026-08-11 found five legacy published rows and
// one row already withdrawn to clinical_review. Both states are safe inputs to
// this exact retirement release: the former are unpublished by the archive;
// the latter is permanently retired so a future review cannot republish it.
const DUPLICATE_MILESTONE_RETIRABLE_STATUSES = new Set([
  'published',
  'clinical_review',
]);

/**
 * Read-only production preflight for the exact retirement release. Run this
 * after deployment and copy the six reported review revisions into the guarded
 * mutation. It cannot expose or mutate any other slug.
 */
export const preflightDuplicateMilestoneRetirement = internalQuery({
  args: { releaseId: v.literal(DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID) },
  returns: v.array(retirementPreflightRowValidator),
  handler: async (ctx) => {
    const rows: Array<{
      slug: DuplicateMilestoneSlug;
      found: boolean;
      clinicalStatus: string | null;
      reviewRevision: number | null;
      mediaRows: number;
      evidenceLinkRows: number;
    }> = [];
    for (const slug of DUPLICATE_MILESTONE_SLUGS) {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      const mediaRows = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', slug))
        .take(100);
      const evidenceLinkRows = await ctx.db
        .query('evidenceLinks')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .take(20);
      rows.push({
        slug,
        found: content !== null,
        clinicalStatus: content?.clinicalStatus ?? null,
        reviewRevision: content ? (content.reviewRevision ?? 1) : null,
        mediaRows: mediaRows.length,
        evidenceLinkRows: evidenceLinkRows.length,
      });
    }
    return rows;
  },
});

/**
 * Atomically archive the six reviewed duplicate milestones.
 *
 * INTERNAL means no browser or parent session can call it. The caller must use
 * the exact code-reviewed release id and the review revisions returned by the
 * preflight. Every target is validated before the first write, so a changed or
 * missing row aborts the whole transaction instead of partially withdrawing a
 * catalogue. Media, evidence links and review decisions remain for staff audit
 * but become unreachable to parents through the existing publication gates.
 */
export const retireDuplicateMilestones = internalMutation({
  args: {
    releaseId: v.literal(DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID),
    targets: v.array(v.object({
      slug: duplicateMilestoneSlugValidator,
      expectedReviewRevision: v.number(),
    })),
  },
  returns: v.object({
    retired: v.number(),
    alreadyRetired: v.number(),
    publishedWithdrawn: v.number(),
    unpublishedArchived: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const expectedSlugs = new Set<string>(DUPLICATE_MILESTONE_SLUGS);
    const suppliedSlugs = new Set<string>(args.targets.map((target) => target.slug));
    if (
      args.targets.length !== DUPLICATE_MILESTONE_SLUGS.length
      || suppliedSlugs.size !== DUPLICATE_MILESTONE_SLUGS.length
      || [...expectedSlugs].some((slug) => !suppliedSlugs.has(slug))
    ) {
      throw new Error('Retirement targets must match the exact six-slug release');
    }

    const targetBySlug = new Map(args.targets.map((target) => [target.slug, target]));
    const validated: Array<Doc<'libraryContent'>> = [];
    let alreadyRetired = 0;
    let publishedWithdrawn = 0;
    let unpublishedArchived = 0;

    // Validate the entire release before writing anything (stale-state guard).
    for (const slug of DUPLICATE_MILESTONE_SLUGS) {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      if (!content) throw new Error(`Retirement target missing: ${slug}`);
      const target = targetBySlug.get(slug);
      if (!target || (content.reviewRevision ?? 1) !== target.expectedReviewRevision) {
        throw new Error(`Retirement target has a newer review revision: ${slug}`);
      }
      if (content.clinicalStatus === 'archived') {
        alreadyRetired += 1;
        continue;
      }
      if (!DUPLICATE_MILESTONE_RETIRABLE_STATUSES.has(content.clinicalStatus)) {
        throw new Error(`Retirement target has an unexpected status: ${slug}`);
      }
      if (content.clinicalStatus === 'published') publishedWithdrawn += 1;
      else unpublishedArchived += 1;
      validated.push(content);
    }

    const now = Date.now();
    for (const content of validated) {
      await ctx.db.patch(content._id, {
        clinicalStatus: 'archived',
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: `Retired by ${DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID}`,
        updatedAt: now,
      });
      await logAudit(
        ctx,
        null,
        'library.duplicate_milestone.retired',
        'libraryContent',
        content._id,
        `${DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID} · ${content.slug}`,
        {
          before: JSON.stringify({
            clinicalStatus: content.clinicalStatus,
            reviewRevision: content.reviewRevision ?? 1,
          }),
          after: JSON.stringify({
            clinicalStatus: 'archived',
            reviewRevision: content.reviewRevision ?? 1,
          }),
        },
      );
    }

    return {
      retired: validated.length,
      alreadyRetired,
      publishedWithdrawn,
      unpublishedArchived,
      total: DUPLICATE_MILESTONE_SLUGS.length,
    };
  },
});

const socialEmotionalMilestoneRetirementSlugValidator = v.union(
  v.literal('ms_3_4m_social_2'),
  v.literal('ms_2_5y_social_3'),
  v.literal('ms_13_18m_emotional_1'),
  v.literal('ms_5y_emotional_1'),
);

const socialEmotionalMilestoneRetirementStatusValidator = v.union(
  v.literal('published'),
  v.literal('clinical_review'),
);

const socialEmotionalRetirementPreflightRowValidator = v.object({
  slug: socialEmotionalMilestoneRetirementSlugValidator,
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  expectedClinicalStatus: socialEmotionalMilestoneRetirementStatusValidator,
  expectedReviewRevision: v.number(),
  exactState: v.boolean(),
  mediaRows: v.number(),
  evidenceLinkRows: v.number(),
});

/**
 * Read-only exact-state preflight for the four unsupported social/emotional
 * milestones. The expected preimage is code-versioned, so an operator cannot
 * copy a newer production revision into the mutation and bypass review.
 */
export const preflightSocialEmotionalMilestoneRetirement = internalQuery({
  args: {
    releaseId: v.literal(SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID),
  },
  returns: v.array(socialEmotionalRetirementPreflightRowValidator),
  handler: async (ctx) => {
    const rows: Array<{
      slug: SocialEmotionalMilestoneRetirementSlug;
      found: boolean;
      clinicalStatus: string | null;
      reviewRevision: number | null;
      expectedClinicalStatus: 'published' | 'clinical_review';
      expectedReviewRevision: number;
      exactState: boolean;
      mediaRows: number;
      evidenceLinkRows: number;
    }> = [];

    for (const target of SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS) {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .unique();
      const mediaRows = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', target.slug))
        .take(100);
      const evidenceLinkRows = await ctx.db
        .query('evidenceLinks')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .take(20);
      const reviewRevision = content ? (content.reviewRevision ?? 1) : null;
      const alreadyRetiredByRelease = content?.clinicalStatus === 'archived'
        && content.reviewNote === `Retired by ${SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID}`;
      rows.push({
        slug: target.slug,
        found: content !== null,
        clinicalStatus: content?.clinicalStatus ?? null,
        reviewRevision,
        expectedClinicalStatus: target.expectedClinicalStatus,
        expectedReviewRevision: target.expectedReviewRevision,
        exactState: reviewRevision === target.expectedReviewRevision
          && (content?.clinicalStatus === target.expectedClinicalStatus || alreadyRetiredByRelease),
        mediaRows: mediaRows.length,
        evidenceLinkRows: evidenceLinkRows.length,
      });
    }
    return rows;
  },
});

/**
 * Atomically archives the four exact records removed by the PH40 claim-scope
 * audit. The fixed release id, slugs, original statuses and revisions are all
 * code-reviewed. Every target is validated before the first patch, and an
 * archived row is idempotent only when this release's audit note is present.
 */
export const retireSocialEmotionalMilestones = internalMutation({
  args: {
    releaseId: v.literal(SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID),
  },
  returns: v.object({
    retired: v.number(),
    alreadyRetired: v.number(),
    publishedWithdrawn: v.number(),
    unpublishedArchived: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const validated: Array<{
      content: Doc<'libraryContent'>;
      expectedClinicalStatus: 'published' | 'clinical_review';
      expectedReviewRevision: number;
    }> = [];
    let alreadyRetired = 0;
    let publishedWithdrawn = 0;
    let unpublishedArchived = 0;

    for (const target of SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS) {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .unique();
      if (!content) throw new Error(`Retirement target missing: ${target.slug}`);
      if ((content.reviewRevision ?? 1) !== target.expectedReviewRevision) {
        throw new Error(`Retirement target has a newer review revision: ${target.slug}`);
      }
      if (content.clinicalStatus === 'archived') {
        if (content.reviewNote !== `Retired by ${SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID}`) {
          throw new Error(`Retirement target was archived outside this release: ${target.slug}`);
        }
        alreadyRetired += 1;
        continue;
      }
      if (content.clinicalStatus !== target.expectedClinicalStatus) {
        throw new Error(`Retirement target has an unexpected status: ${target.slug}`);
      }
      if ((target.expectedClinicalStatus as string) === 'published') publishedWithdrawn += 1;
      else unpublishedArchived += 1;
      validated.push({
        content,
        expectedClinicalStatus: target.expectedClinicalStatus,
        expectedReviewRevision: target.expectedReviewRevision,
      });
    }

    const now = Date.now();
    for (const target of validated) {
      await ctx.db.patch(target.content._id, {
        clinicalStatus: 'archived',
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: `Retired by ${SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID}`,
        updatedAt: now,
      });
      await logAudit(
        ctx,
        null,
        'library.social_emotional_milestone.retired',
        'libraryContent',
        target.content._id,
        `${SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID} · ${target.content.slug}`,
        {
          before: JSON.stringify({
            clinicalStatus: target.expectedClinicalStatus,
            reviewRevision: target.expectedReviewRevision,
          }),
          after: JSON.stringify({
            clinicalStatus: 'archived',
            reviewRevision: target.expectedReviewRevision,
          }),
        },
      );
    }

    return {
      retired: validated.length,
      alreadyRetired,
      publishedWithdrawn,
      unpublishedArchived,
      total: SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS.length,
    };
  },
});

const brightFuturesDuplicateMilestoneSlugValidator =
  v.literal('ms_5y_self_help_2');

const brightFuturesDuplicateMilestonePreflightRowValidator = v.object({
  slug: brightFuturesDuplicateMilestoneSlugValidator,
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  expectedClinicalStatus: v.literal('clinical_review'),
  expectedReviewRevision: v.number(),
  exactState: v.boolean(),
  mediaRows: v.number(),
  evidenceLinkRows: v.number(),
});

/**
 * Read-only production preflight for the one invalid Bright Futures template
 * row. The expected status and revision are code-versioned; operators cannot
 * supply a newer preimage to bypass the stale-state guard.
 */
export const preflightBrightFuturesDuplicateMilestoneRetirement = internalQuery({
  args: {
    releaseId: v.literal(BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID),
  },
  returns: brightFuturesDuplicateMilestonePreflightRowValidator,
  handler: async (ctx) => {
    const target = BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET;
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', target.slug))
      .unique();
    const mediaRows = await ctx.db
      .query('libraryMedia')
      .withIndex('by_content', (q) => q.eq('contentSlug', target.slug))
      .take(100);
    const evidenceLinkRows = await ctx.db
      .query('evidenceLinks')
      .withIndex('by_slug', (q) => q.eq('slug', target.slug))
      .take(20);
    const reviewRevision = content ? (content.reviewRevision ?? 1) : null;
    const alreadyRetiredByRelease = content?.clinicalStatus === 'archived'
      && content.reviewNote === `Retired by ${BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID}`;

    return {
      slug: target.slug as BrightFuturesDuplicateMilestoneRetirementSlug,
      found: content !== null,
      clinicalStatus: content?.clinicalStatus ?? null,
      reviewRevision,
      expectedClinicalStatus: target.expectedClinicalStatus,
      expectedReviewRevision: target.expectedReviewRevision,
      exactState: reviewRevision === target.expectedReviewRevision
        && (content?.clinicalStatus === target.expectedClinicalStatus || alreadyRetiredByRelease),
      mediaRows: mediaRows.length,
      evidenceLinkRows: evidenceLinkRows.length,
    };
  },
});

/**
 * Atomically archives the exact invalid 5-year self-help row while preserving
 * its media, evidence links and review history for staff audit. An archived
 * replay is idempotent only when this release's note is present.
 */
export const retireBrightFuturesDuplicateMilestone = internalMutation({
  args: {
    releaseId: v.literal(BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID),
  },
  returns: v.object({
    retired: v.number(),
    alreadyRetired: v.number(),
    publishedWithdrawn: v.number(),
    unpublishedArchived: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const target = BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET;
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', target.slug))
      .unique();
    if (!content) throw new Error(`Retirement target missing: ${target.slug}`);
    if ((content.reviewRevision ?? 1) !== target.expectedReviewRevision) {
      throw new Error(`Retirement target has a newer review revision: ${target.slug}`);
    }
    if (content.clinicalStatus === 'archived') {
      if (content.reviewNote !== `Retired by ${BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID}`) {
        throw new Error(`Retirement target was archived outside this release: ${target.slug}`);
      }
      return {
        retired: 0,
        alreadyRetired: 1,
        publishedWithdrawn: 0,
        unpublishedArchived: 0,
        total: 1,
      };
    }
    if (content.clinicalStatus !== target.expectedClinicalStatus) {
      throw new Error(`Retirement target has an unexpected status: ${target.slug}`);
    }

    const now = Date.now();
    await ctx.db.patch(content._id, {
      clinicalStatus: 'archived',
      reviewerId: undefined,
      reviewerQualification: undefined,
      reviewerDisplayName: undefined,
      reviewScope: undefined,
      reviewedAt: undefined,
      nextReviewAt: undefined,
      reviewNote: `Retired by ${BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID}`,
      updatedAt: now,
    });
    await logAudit(
      ctx,
      null,
      'library.bright_futures_duplicate_milestone.retired',
      'libraryContent',
      content._id,
      `${BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID} · ${content.slug}`,
      {
        before: JSON.stringify({
          clinicalStatus: target.expectedClinicalStatus,
          reviewRevision: target.expectedReviewRevision,
        }),
        after: JSON.stringify({
          clinicalStatus: 'archived',
          reviewRevision: target.expectedReviewRevision,
        }),
      },
    );

    return {
      retired: 1,
      alreadyRetired: 0,
      publishedWithdrawn: 0,
      unpublishedArchived: 1,
      total: 1,
    };
  },
});

/**
 * Applies one code-reviewed correction release to rows already published.
 * The content comes exclusively from the bundled seed snapshot; callers can
 * neither submit content nor choose slugs. Review state and media are retained.
 */
export const applyPublishedErrata = internalMutation({
  args: {
    releaseId: v.union(
      v.literal('2026-07-28-content-remediation'),
      v.literal('2026-07-28-myanmar-copy-clarity'),
    ),
  },
  returns: v.object({
    updated: v.number(),
    unchanged: v.number(),
    missing: v.number(),
    notPublished: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, { releaseId }) => {
    const slugs = publishedErrataSlugs(releaseId) ?? [];
    const items = seedData as unknown as Item[];
    const desiredBySlug = new Map(items.map((item) => [item.slug, item]));
    const priorErrata = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'library.published_errata'))
      .collect();
    const appliedSummaries = new Set(priorErrata.map((row) => row.summary).filter(Boolean));
    const now = Date.now();
    let updated = 0;
    let unchanged = 0;
    let missing = 0;
    let notPublished = 0;

    for (const slug of slugs) {
      const auditSummary = `${releaseId} · ${slug}`;
      if (appliedSummaries.has(auditSummary)) {
        unchanged += 1;
        continue;
      }
      const desired = desiredBySlug.get(slug);
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      if (!desired || !existing) {
        missing += 1;
        continue;
      }
      if (existing.clinicalStatus !== 'published') {
        notPublished += 1;
        continue;
      }

      const { media: _media, clinicalStatus: _clinicalStatus, ...content } = desired;
      void _media;
      void _clinicalStatus;
      const current = Object.fromEntries(
        Object.keys(content).map((key) => [key, existing[key as keyof typeof existing]]),
      );
      if (JSON.stringify(current) === JSON.stringify(content)) {
        unchanged += 1;
        continue;
      }

      await ctx.db.patch(existing._id, { ...content, updatedAt: now });
      await logAudit(
        ctx,
        null,
        'library.published_errata',
        'libraryContent',
        existing._id,
        auditSummary,
        {
          before: JSON.stringify({
            titleMm: existing.titleMm,
            reviewRevision: existing.reviewRevision ?? 1,
          }),
          after: JSON.stringify({
            titleMm: desired.titleMm,
            reviewRevision: existing.reviewRevision ?? 1,
          }),
        },
      );
      updated += 1;
    }

    return { updated, unchanged, missing, notPublished, total: slugs.length };
  },
});

export const run = internalMutation({
  args: {},
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    skippedApproved: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const items = seedData as unknown as Item[];
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skippedApproved = 0;
    for (const it of items) {
      if (seedRunSkipsItem(it)) {
        skippedApproved += 1;
        continue;
      }
      const { media, ...content } = it;
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', it.slug))
        .unique();
      if (existing) {
        if (!seedMayUpdateExisting(existing.clinicalStatus, Boolean(existing.aiPublicationReleaseId))) {
          skippedApproved += 1;
          continue;
        }
        await ctx.db.patch(existing._id, {
          ...content,
          clinicalStatus: existing.clinicalStatus,
          reviewerId: existing.reviewerId,
          reviewedAt: existing.reviewedAt,
          nextReviewAt: existing.nextReviewAt,
          updatedAt: now,
        });
        updated++;
      } else {
        // Seeding can never create published content (clinical-review gate).
        const clinicalStatus = content.clinicalStatus === 'published' ? 'clinical_review' : content.clinicalStatus;
        await ctx.db.insert('libraryContent', { ...content, clinicalStatus, createdAt: now, updatedAt: now });
        created++;
      }
      const existingMedia = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', it.slug))
        .collect();
      for (const mrow of existingMedia) {
        if (!seedMediaIsProtected(mrow)) await ctx.db.delete(mrow._id);
      }
      for (const mref of media) {
        if (existingMedia.some((row) => row.kind === mref.kind && seedMediaIsProtected(row))) continue;
        await ctx.db.insert('libraryMedia', {
          contentSlug: it.slug,
          kind: mref.kind,
          placeholder: mref.placeholder ?? true,
          offline: mref.offline,
          note: mref.note,
        });
      }
    }
    await logAudit(
      ctx,
      null,
      'library.seed',
      'libraryContent',
      undefined,
      seedAuditSummary(created, updated, skippedApproved),
    );
    return { created, updated, skippedApproved, total: items.length };
  },
});
