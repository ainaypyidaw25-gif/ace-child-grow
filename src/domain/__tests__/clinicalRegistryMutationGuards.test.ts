import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'owner-user' as string | null }));
vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import seedData from '../../../convex/seedData.json';
import {
  approveMedia,
  attachUploadedMedia,
  createStarterAnimationQueue,
  importSeed,
  updateDraft,
} from '../../../convex/library';
import { saveDecision } from '../../../convex/contentReviews';
import { importLinks, importSources, setReview as setEvidenceReview } from '../../../convex/evidence';
import { requestReviews, setGovernance } from '../../../convex/ownerPriority';
import {
  applyBurmeseCopyAuditRelease,
  applyClinicalReviewCopyRelease,
  applyPublishedErrata,
  applyPublishedEvidenceSafetyRelease,
  run as runSeed,
} from '../../../convex/seed';
import { apply as applyAsqDoctorVisits } from '../../../convex/asqDoctorVisitsLinkCas';
import { apply as applyBirth2mGrossMotor } from '../../../convex/birth2mGrossMotorCas';
import { apply as applyBirth2mNutrition } from '../../../convex/birth2mNutritionCas';
import { apply as applySwaimanCerebralPalsy } from '../../../convex/swaimanCerebralPalsyLinkCas';
import { apply as applySwaimanSeizure } from '../../../convex/swaimanSeizureLinkCas';
import { apply as applySwaimanSuddenWeakness } from '../../../convex/swaimanSuddenWeaknessCas';
import { apply as applyInherentPublic } from '../../../convex/inherentPublicLinkCas';
import { apply as applyManualReviewContent } from '../../../convex/manualReviewContentCas';
import { apply as applyManualReviewEvidence } from '../../../convex/manualReviewEvidenceLinkCas';
import { apply as applyLegacyPriorityCorrection } from '../../../convex/legacyCompletedPriorityCorrection';
import { apply as applyRemainingPseudoRetirement } from '../../../convex/remainingPseudoMilestoneRetirement';
import { apply as applyAiPublication } from '../../../convex/aiPublication';
import { STARTER_ANIMATION_SLUGS } from '../../../convex/animationPlan';
import {
  BURMESE_COPY_AUDIT_RELEASE_ID,
  BURMESE_COPY_AUDIT_TARGETS,
} from '../../../convex/lib/burmeseCopyAuditRelease';
import {
  CLINICAL_REVIEW_COPY_RELEASE_ID,
  CLINICAL_REVIEW_COPY_TARGETS,
} from '../../../convex/lib/clinicalReviewCopyRelease';
import { PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID } from '../../../convex/lib/evidenceSafetyRelease';
import { publishedErrataSlugs } from '../../../convex/lib/seedPolicy';
import {
  contentIsParentReadable,
  parentReadableContentResult,
} from '../../../convex/lib/publicationVisibility';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';
import {
  ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID,
  ASQ_DOCTOR_VISITS_TARGET,
} from '../../../convex/lib/asqDoctorVisitsLinkCasData';
import {
  BIRTH2M_GROSS_MOTOR_CAS_RELEASE_ID,
  BIRTH2M_GROSS_MOTOR_TARGET,
} from '../../../convex/lib/birth2mGrossMotorCasData';
import {
  BIRTH2M_NUTRITION_CAS_RELEASE_ID,
  BIRTH2M_NUTRITION_TARGET,
} from '../../../convex/lib/birth2mNutritionCasData';
import {
  SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
  SWAIMAN_CEREBRAL_PALSY_TARGET,
} from '../../../convex/lib/swaimanCerebralPalsyLinkCasData';
import {
  SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
  SWAIMAN_SEIZURE_LINK_CAS_TARGET,
} from '../../../convex/lib/swaimanSeizureLinkCasData';
import {
  SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_TARGET,
} from '../../../convex/lib/swaimanSuddenWeaknessCasData';
import {
  INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
  INHERENT_PUBLIC_LINK_CAS_TARGETS,
} from '../../../convex/lib/inherentPublicLinkCasData';
import {
  MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
  MANUAL_REVIEW_CONTENT_TARGETS,
} from '../../../convex/lib/manualReviewContentCasData';
import {
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS,
} from '../../../convex/lib/manualReviewEvidenceLinkCasData';
import {
  LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
  LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET,
} from '../../../convex/lib/legacyCompletedPriorityCorrectionData';
import {
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS,
} from '../../../convex/lib/remainingPseudoMilestoneRetirementData';
import {
  AI_PUBLICATION_RELEASE_ID,
  AI_PUBLICATION_RELEASE_TARGETS,
} from '../../../convex/lib/aiPublicationReleaseData';

type Row = Record<string, unknown> & { _id?: string };
const GOVERNED_SLUG = 'registry_governed_slug';
const GOVERNED_SOURCE = 'registry-governed-source';
const originalRegistry = [...CLINICAL_REVIEW_BATCH_REGISTRY] as ClinicalReviewBatchRegistration[];

function installReleaseRegistration() {
  const pilot = originalRegistry[0];
  const item = {
    ...pilot.manifest.items[0],
    ordinal: 1,
    slug: GOVERNED_SLUG,
    sourceIds: [GOVERNED_SOURCE],
    sourceCount: 1,
  };
  const release = {
    ...pilot,
    authority: 'release' as const,
    manifest: {
      ...pilot.manifest,
      batchId: 'guard-release',
      count: 1,
      items: [item],
    },
  } as ClinicalReviewBatchRegistration;
  (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
}

function context(contentSlug = GOVERNED_SLUG, extra: Record<string, Row[]> = {}) {
  const profile: Row = {
    _id: 'owner-profile', userId: 'owner-user', isStaff: true,
    staffRole: 'owner', staffQualification: 'MD', displayName: 'Owner',
  };
  const content: Row = {
    _id: 'content-1', type: 'milestone', slug: contentSlug,
    titleMm: 'အကြောင်းအရာ', titleEn: 'Content', tags: [], data: {}, source: 'source',
    clinicalStatus: 'clinical_review', reviewRevision: 1, version: 1,
    searchText: 'content', createdAt: 1, updatedAt: 2,
  };
  const media: Row = {
    _id: 'media-1', contentSlug, kind: 'illustration', placeholder: false,
    storageId: 'storage-1', rightsOwner: 'ACE', licenseType: 'Original',
  };
  const tables: Record<string, Row[]> = {
    parentProfiles: [profile],
    libraryContent: [content],
    libraryMedia: [media],
    evidenceSources: [{
      _id: 'source-1', sourceId: GOVERNED_SOURCE, reviewStatus: 'awaiting_review',
      reviewer: null, updatedAt: 2,
    }],
    evidenceLinks: [],
    contentReviews: [],
    auditLogs: [],
    clinicalReviewBatches: [{
      _id: 'batch-1', batchId: 'guard-release', authority: 'release', status: 'frozen',
    }],
    clinicalReviewAssignments: [{
      _id: 'assignment-1', batchId: 'guard-release', contentSlug,
      sourceIds: [GOVERNED_SOURCE],
    }],
    ...extra,
  };
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) {
    for (const row of rows) if (row._id) byId.set(row._id, row);
  }
  const query = vi.fn((table: string) => {
    const filters: Array<[string, unknown]> = [];
    const matching = () => (tables[table] ?? []).filter((row) =>
      filters.every(([field, value]) => row[field] === value));
    const terminal = {
      collect: async () => matching(),
      take: async (count: number) => matching().slice(0, count),
      unique: async () => matching()[0] ?? null,
      order: () => terminal,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = { eq: (field: string, value: unknown): unknown => {
          filters.push([field, value]);
          return q;
        } };
        callback(q);
        return terminal;
      },
    };
  });
  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    const id = `${table}-insert-${++inserted}`;
    (tables[table] ??= []).push({ _id: id, ...value });
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (row) Object.assign(row, value);
  });
  const remove = vi.fn();
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async (id: string) => byId.get(id) ?? null),
      insert,
      patch,
      delete: remove,
      system: { get: vi.fn(async () => ({ contentType: 'image/webp', size: 1_024 })) },
    },
    storage: { delete: vi.fn(), generateUploadUrl: vi.fn(), getUrl: vi.fn() },
    tables,
    insert,
    patch,
    remove,
  };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

beforeEach(() => {
  authState.userId = 'owner-user';
  installReleaseRegistration();
});

afterEach(() => {
  const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
  registry.splice(0, registry.length, ...originalRegistry);
  vi.restoreAllMocks();
});

describe('persisted release mutation guards', () => {
  it('blocks wrong-type seed imports, drafts, and every media mutation path', async () => {
    const ctx = context();
    const imported = await handler(importSeed)(ctx, {
      items: [{
        type: 'story', slug: GOVERNED_SLUG, titleMm: 'x', titleEn: 'x', tags: [],
        source: 'x', version: 1, clinicalStatus: 'clinical_review', data: {}, media: [], searchText: 'x',
      }],
    });
    expect(imported).toMatchObject({ created: 0, updated: 0, skippedApproved: 1 });
    await expect(handler(updateDraft)(ctx, {
      slug: GOVERNED_SLUG, titleMm: 'x', titleEn: 'x', data: {}, expectedReviewRevision: 1,
    })).rejects.toThrow('Frozen release content');
    await expect(handler(attachUploadedMedia)(ctx, {
      contentSlug: GOVERNED_SLUG, kind: 'illustration', storageId: 'storage-2',
      altMm: 'x', altEn: 'x', rightsOwner: 'ACE', licenseType: 'Original', accessLevel: 'premium',
    })).rejects.toThrow('Frozen release media');
    await expect(handler(approveMedia)(ctx, { mediaId: 'media-1' })).rejects.toThrow('Frozen release media');

    const starterCtx = context(STARTER_ANIMATION_SLUGS[0]);
    await expect(handler(createStarterAnimationQueue)(starterCtx, {})).rejects.toThrow('Frozen release media');
    expect(ctx.patch).not.toHaveBeenCalled();
    expect(starterCtx.insert).not.toHaveBeenCalled();
  });

  it('blocks generic decisions, governance, review requests, and evidence review/import paths', async () => {
    const dimensions = ['english', 'native_myanmar', 'child_development', 'evidence', 'safety', 'clinical'];
    const roles = ['owner', 'content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer', 'review_manager', 'support'];
    for (const role of roles) {
      for (const dimension of dimensions) {
        const decisionCtx = context();
        decisionCtx.tables.parentProfiles[0].staffRole = role;
        await expect(handler(saveDecision)(decisionCtx, {
          contentSlug: GOVERNED_SLUG, dimension, decision: 'approved', expectedReviewRevision: 1,
        }), `${role}:${dimension}`).resolves.toMatchObject({ ok: false, code: 'assignment_required' });
        expect(decisionCtx.tables.contentReviews, `${role}:${dimension}`).toHaveLength(0);
      }
    }

    const ctx = context();
    await expect(handler(setGovernance)(ctx, {
      slug: GOVERNED_SLUG, expectedReviewRevision: 1, ownerPriority: 'P1',
    })).resolves.toMatchObject({ ok: false, code: 'frozen_release_governed' });
    await expect(handler(requestReviews)(ctx, {
      slug: GOVERNED_SLUG, expectedReviewRevision: 1, dimensions: ['clinical'],
    })).resolves.toMatchObject({ ok: false, code: 'frozen_release_governed' });
    await expect(handler(setEvidenceReview)(ctx, {
      sourceId: GOVERNED_SOURCE, status: 'approved', reviewer: 'ignored',
      reviewerQualification: 'ignored', reviewDate: '2026-08-23',
    })).resolves.toMatchObject({ ok: false, code: 'frozen_release_governed' });

    const sourceImport = await handler(importSources)(ctx, { sources: [{ id: GOVERNED_SOURCE }] }) as Record<string, unknown>;
    expect(sourceImport).toMatchObject({ created: 0, updated: 0, skipped: 1 });
    const linkImport = await handler(importLinks)(ctx, {
      links: [{ kind: 'story', slug: GOVERNED_SLUG, sourceIds: [GOVERNED_SOURCE] }],
    }) as Record<string, unknown>;
    expect(linkImport).toMatchObject({ created: 0, updated: 0, skipped: 1 });
    expect(ctx.patch).not.toHaveBeenCalled();
  });

  it('keeps stored governance requirements live on individual and bulk parent visibility', async () => {
    const ctx = context('visibility_slug');
    const content = ctx.tables.libraryContent[0];
    Object.assign(content, {
      clinicalStatus: 'published',
      requiredReviewDimensions: ['native_myanmar'],
    });
    ctx.tables.evidenceLinks.push({
      _id: 'visibility-link', kind: 'milestone', slug: 'visibility_slug', sourceIds: [GOVERNED_SOURCE],
    });
    Object.assign(ctx.tables.evidenceSources[0], {
      evidenceLevel: 'guideline', year: 2026, reviewStatus: 'approved',
      reviewDate: '2026-08-01', nextReviewDate: '2027-08-01', verifiedOn: '2026-08-01',
    });

    await expect(contentIsParentReadable(ctx as never, content as never, '2026-08-23')).resolves.toBe(false);
    await expect(parentReadableContentResult(ctx as never, [content] as never, '2026-08-23'))
      .resolves.toEqual({ complete: true, rows: [] });

    ctx.tables.contentReviews.push({
      _id: 'governance-review', contentSlug: 'visibility_slug', dimension: 'native_myanmar',
      contentVersion: 1, decision: 'approved', reviewedAt: 3,
    });
    await expect(contentIsParentReadable(ctx as never, content as never, '2026-08-23')).resolves.toBe(true);
    await expect(parentReadableContentResult(ctx as never, [content] as never, '2026-08-23'))
      .resolves.toEqual({ complete: true, rows: [content] });
  });

  it('blocks the bundled seed, Burmese, clinical-copy, evidence-safety, and errata handlers', async () => {
    const cases: Array<{ name: string; fn: unknown; slug: string; args: Record<string, unknown> }> = [
      { name: 'seed.run', fn: runSeed, slug: (seedData as Array<{ slug: string }>)[0].slug, args: {} },
      {
        name: 'Burmese release', fn: applyBurmeseCopyAuditRelease,
        slug: BURMESE_COPY_AUDIT_TARGETS[0].slug, args: { releaseId: BURMESE_COPY_AUDIT_RELEASE_ID },
      },
      {
        name: 'clinical-copy release', fn: applyClinicalReviewCopyRelease,
        slug: CLINICAL_REVIEW_COPY_TARGETS[0].slug, args: { releaseId: CLINICAL_REVIEW_COPY_RELEASE_ID },
      },
      {
        name: 'evidence-safety release', fn: applyPublishedEvidenceSafetyRelease,
        slug: GOVERNED_SLUG,
        args: {
          releaseId: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
          publishedTargets: [{ slug: GOVERNED_SLUG }], specialistTargets: [],
        },
      },
      {
        name: 'published errata', fn: applyPublishedErrata,
        slug: (publishedErrataSlugs('2026-07-28-content-remediation') ?? [])[0],
        args: { releaseId: '2026-07-28-content-remediation' },
      },
    ];
    for (const testCase of cases) {
      const ctx = context(testCase.slug);
      await expect(handler(testCase.fn)(ctx, testCase.args), testCase.name)
        .rejects.toThrow('Frozen release targets require invalidation and refreeze');
      expect(ctx.insert, testCase.name).not.toHaveBeenCalled();
      expect(ctx.patch, testCase.name).not.toHaveBeenCalled();
    }
  });

  it('blocks every bounded legacy CAS/release handler before its first write', async () => {
    const cases: Array<{ name: string; fn: unknown; slug: string; args: Record<string, unknown> }> = [
      { name: 'ASQ', fn: applyAsqDoctorVisits, slug: ASQ_DOCTOR_VISITS_TARGET.slug, args: { releaseId: ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID } },
      { name: 'birth gross motor', fn: applyBirth2mGrossMotor, slug: BIRTH2M_GROSS_MOTOR_TARGET.slug, args: { releaseId: BIRTH2M_GROSS_MOTOR_CAS_RELEASE_ID } },
      { name: 'birth nutrition', fn: applyBirth2mNutrition, slug: BIRTH2M_NUTRITION_TARGET.slug, args: { releaseId: BIRTH2M_NUTRITION_CAS_RELEASE_ID } },
      { name: 'Swaiman CP', fn: applySwaimanCerebralPalsy, slug: SWAIMAN_CEREBRAL_PALSY_TARGET.slug, args: { releaseId: SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID } },
      { name: 'Swaiman seizure', fn: applySwaimanSeizure, slug: SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug, args: { releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID } },
      { name: 'Swaiman weakness', fn: applySwaimanSuddenWeakness, slug: SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug, args: { releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID } },
      { name: 'inherent public', fn: applyInherentPublic, slug: INHERENT_PUBLIC_LINK_CAS_TARGETS[0].slug, args: { releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID } },
      { name: 'manual content', fn: applyManualReviewContent, slug: MANUAL_REVIEW_CONTENT_TARGETS[0].slug, args: { releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID } },
      { name: 'manual evidence', fn: applyManualReviewEvidence, slug: MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS[0].slug, args: { releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID } },
      { name: 'legacy priority', fn: applyLegacyPriorityCorrection, slug: LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.slug, args: { releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID } },
      { name: 'remaining pseudo retirement', fn: applyRemainingPseudoRetirement, slug: REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS[0].slug, args: { releaseId: REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID } },
      {
        name: 'AI publication', fn: applyAiPublication, slug: AI_PUBLICATION_RELEASE_TARGETS[0].slug,
        args: { releaseId: AI_PUBLICATION_RELEASE_ID, operator: 'test', gitCommit: 'a'.repeat(40) },
      },
    ];
    for (const testCase of cases) {
      const ctx = context(testCase.slug);
      await expect(handler(testCase.fn)(ctx, testCase.args), testCase.name)
        .rejects.toThrow('Frozen release targets require invalidation and refreeze');
      expect(ctx.insert, testCase.name).not.toHaveBeenCalled();
      expect(ctx.patch, testCase.name).not.toHaveBeenCalled();
      expect(ctx.remove, testCase.name).not.toHaveBeenCalled();
    }
  });
});
