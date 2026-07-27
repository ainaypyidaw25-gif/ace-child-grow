import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import { list as listChildren, update as updateChild } from '../../../convex/children';
import { importSeed, listByType, setReview as setLibraryReview } from '../../../convex/library';
import { forContent as evidenceForContent, setReview as setEvidenceReview } from '../../../convex/evidence';
import { transition as transitionContent } from '../../../convex/content';
import { listSessions, recordSession } from '../../../convex/milestones';
import { complete as completeActivity, list as listActivities } from '../../../convex/activities';

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: {
  rows?: Record<string, Row[]>;
  get?: Row | null;
  profile?: Row | null;
} = {}) {
  const patch = vi.fn();
  const insert = vi.fn(async (table: string) => table === 'milestoneSessions'
    ? 'session-1'
    : table === 'activityCompletions' ? 'completion-1' : 'insert-1');
  const query = vi.fn((table: string) => {
    const rows = options.rows?.[table] ?? [];
    const terminal = {
      collect: async () => rows,
      take: async (count: number) => rows.slice(0, count),
      unique: async () => table === 'parentProfiles' ? options.profile ?? null : rows[0] ?? null,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: () => unknown }) => unknown) => {
        callback({ eq: () => undefined });
        return terminal;
      },
    };
  });
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async () => options.get ?? null),
      patch,
      insert,
    },
    storage: {},
  };
}

function handler(fn: unknown): (context: ReturnType<typeof ctx>, args: Record<string, unknown>) => Promise<unknown> {
  return (fn as { _handler: (context: ReturnType<typeof ctx>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

describe('Convex registered handlers enforce authorization', () => {
  beforeEach(() => {
    authState.userId = null;
  });

  it('children.list returns no private rows and performs no database read when unauthenticated', async () => {
    const context = ctx({ rows: { children: [{ _id: 'child-1', userId: 'user-1', nickname: 'Private' }] } });
    await expect(handler(listChildren)(context, {})).resolves.toEqual([]);
    expect(context.db.query).not.toHaveBeenCalled();
  });

  it('children.update rejects a different owner and performs no patch', async () => {
    authState.userId = 'user-1';
    const context = ctx({ get: { _id: 'child-2', userId: 'user-2' } });
    await expect(handler(updateChild)(context, {
      id: 'child-2' as never,
      nickname: 'Changed',
      birthDate: '2024-01-01',
      useCorrectedAge: false,
    })).rejects.toThrow('Not found');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('non-staff catalogue response excludes drafts and contains no child/private fields', async () => {
    authState.userId = 'user-1';
    const published = {
      _id: 'content-1',
      slug: 'safe-public',
      type: 'activity',
      clinicalStatus: 'published',
      titleMm: 'အများသုံး',
      titleEn: 'Public',
    };
    const draft = {
      _id: 'content-2',
      slug: 'private-draft',
      type: 'activity',
      clinicalStatus: 'clinical_review',
      titleMm: 'မူကြမ်း',
      titleEn: 'Draft',
    };
    const context = ctx({
      profile: { userId: 'user-1', isStaff: false },
      rows: { libraryContent: [published, draft] },
    });
    const result = await handler(listByType)(context, { type: 'activity' });
    expect(result).toEqual({ staff: false, items: [published] });
    expect(JSON.stringify(result)).not.toMatch(/childId|birthDate|nickname|userId/);
  });

  it('normal users cannot invoke the seed importer', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(importSeed)(context, { items: [] })).rejects.toThrow('Insufficient staff permission');
  });

  it('normal users cannot mutate evidence review state', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(setEvidenceReview)(context, {
      sourceId: 'source-1',
      status: 'in_review',
      reviewer: 'Untrusted',
      reviewerQualification: 'None',
      reviewDate: '2026-07-27',
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('normal users cannot transition global clinical content', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(transitionContent)(context, {
      id: 'content-1' as never,
      to: 'clinical_review',
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a qualified education owner cannot publish parent-facing library content', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'clinical-guidance', titleEn: 'Clinical guidance' }] },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'clinical-guidance', clinicalStatus: 'published',
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a named qualified clinical reviewer can publish and records clinical scope', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer',
        staffQualification: 'MBBS, MMedSc (Paediatrics)', displayName: 'Clinical Reviewer',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'clinical-guidance', titleEn: 'Clinical guidance' }] },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'clinical-guidance', clinicalStatus: 'published',
    })).resolves.toEqual({ ok: true, reviewScope: 'clinical' });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      clinicalStatus: 'published', reviewScope: 'clinical', reviewerDisplayName: 'Clinical Reviewer',
    }));
  });

  it('parent citation lookup projects only public bibliographic fields', async () => {
    authState.userId = 'user-1';
    const context = ctx({ rows: {
      evidenceLinks: [{ slug: 'activity-1', kind: 'activity', sourceIds: ['source-1'] }],
      evidenceSources: [{
        _id: 'db-source-1', sourceId: 'source-1', org: 'WHO', title: 'Public title',
        authors: null, year: 2024, edition: null, country: null, language: 'en',
        url: 'https://example.test/source', doi: null, isbn: null, pmid: null,
        evidenceLevel: 'guideline', reviewStatus: 'approved', reviewer: 'Private Reviewer',
        reviewerId: 'reviewer-1', reviewerQualification: 'Private qualification',
        verifiedNote: 'Internal note', reviewNote: 'Internal review note', searchText: 'internal',
        createdAt: 1, updatedAt: 2,
      }],
    } });
    const result = await handler(evidenceForContent)(context, { slug: 'activity-1', kind: 'activity' });
    expect(result).toEqual({ allowed: true, sources: [expect.objectContaining({ sourceId: 'source-1', org: 'WHO' })] });
    expect(JSON.stringify(result)).not.toMatch(/reviewer|verifiedNote|reviewNote|searchText|createdAt|updatedAt|db-source/);
  });

  it('milestone handlers reject unauthenticated and cross-user access without writes', async () => {
    const unauthenticated = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await expect(handler(recordSession)(unauthenticated, {
      childId: 'child-1', resultState: 'green', lostSkill: false, resultSnapshot: {},
    })).rejects.toThrow('Not authenticated');
    expect(unauthenticated.db.insert).not.toHaveBeenCalled();

    authState.userId = 'user-2';
    const otherOwner = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await expect(handler(listSessions)(otherOwner, { childId: 'child-1' })).rejects.toThrow('Not found');
    expect(otherOwner.db.insert).not.toHaveBeenCalled();
  });

  it('milestone owner can record a session for their child', async () => {
    authState.userId = 'user-1';
    const context = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await expect(handler(recordSession)(context, {
      childId: 'child-1', resultState: 'green', lostSkill: false, resultSnapshot: {}, responses: [],
    })).resolves.toBe('session-1');
    expect(context.db.insert).toHaveBeenCalledWith('milestoneSessions', expect.objectContaining({
      userId: 'user-1', childId: 'child-1', resultState: 'green',
    }));
  });

  it('activity handlers reject another child owner without recording completion', async () => {
    authState.userId = 'user-2';
    const context = ctx({
      get: { _id: 'child-1', userId: 'user-1' },
      rows: { subscriptions: [{ userId: 'user-2', planKey: 'premium', status: 'active', currentPeriodEnd: Date.now() + 60_000 }] },
    });
    await expect(handler(completeActivity)(context, {
      childId: 'child-1', contentSlug: 'activity-1',
    })).rejects.toThrow('Not found');
    await expect(handler(listActivities)(context, { childId: 'child-1' })).rejects.toThrow('Not found');
    expect(context.db.insert).not.toHaveBeenCalled();
  });
});
