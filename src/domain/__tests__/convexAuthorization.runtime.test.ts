import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import {
  ownChild,
  requireContentEditor,
  requireEvidenceEditor,
  requireProfessionalPublisher,
  requireUser,
} from '../../../convex/lib/auth';

type Profile = {
  userId: string;
  isStaff?: boolean;
  staffRole?: 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'support';
  staffQualification?: string;
  displayName?: string;
};

function context(options: {
  child?: { _id: string; userId: string };
  profile?: Profile;
} = {}) {
  const query = (table: string) => ({
    withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
      callback({ eq: () => undefined });
      return {
        unique: async () => table === 'parentProfiles' ? options.profile ?? null : null,
        collect: async () => [],
        take: async () => [],
      };
    },
  });
  return {
    auth: {},
    db: {
      get: vi.fn(async () => options.child ?? null),
      query,
    },
  } as never;
}

describe('Convex authorization helpers (runtime)', () => {
  beforeEach(() => {
    authState.userId = null;
  });

  it('rejects an unauthenticated caller before private data access', async () => {
    await expect(requireUser(context())).rejects.toThrow('Not authenticated');
  });

  it('allows the owner to access their child record', async () => {
    const child = { _id: 'child-1', userId: 'user-1' };
    await expect(ownChild(context({ child }), 'child-1' as never, 'user-1' as never)).resolves.toEqual(child);
  });

  it('does not reveal another user’s child when no active caregiver grant exists', async () => {
    const child = { _id: 'child-1', userId: 'user-2' };
    await expect(ownChild(context({ child }), 'child-1' as never, 'user-1' as never)).rejects.toThrow('Not found');
  });

  it('normal users cannot import content or edit evidence', async () => {
    authState.userId = 'user-1';
    const ctx = context({ profile: { userId: 'user-1' } });
    await expect(requireContentEditor(ctx)).rejects.toThrow('Insufficient staff permission');
    await expect(requireEvidenceEditor(ctx)).rejects.toThrow('Insufficient staff permission');
  });

  it('support staff cannot change clinical approval status', async () => {
    authState.userId = 'user-1';
    const ctx = context({ profile: { userId: 'user-1', isStaff: true, staffRole: 'support' } });
    await expect(requireProfessionalPublisher(ctx)).rejects.toThrow('Insufficient staff permission');
  });

  it('an unqualified owner cannot publish or imply clinical approval', async () => {
    authState.userId = 'user-1';
    const ctx = context({ profile: { userId: 'user-1', isStaff: true, staffRole: 'owner' } });
    await expect(requireProfessionalPublisher(ctx)).rejects.toThrow('Professional qualification is required');
  });

  it('a qualified owner receives education scope, never clinical scope', async () => {
    authState.userId = 'user-1';
    const ctx = context({
      profile: {
        userId: 'user-1',
        isStaff: true,
        staffRole: 'owner',
        staffQualification: 'Education reviewer',
        displayName: 'Owner',
      },
    });
    await expect(requireProfessionalPublisher(ctx)).resolves.toMatchObject({ scope: 'education' });
  });

  it('a clinical reviewer cannot perform the owner-only final publication step', async () => {
    authState.userId = 'reviewer-1';
    const ctx = context({
      profile: {
        userId: 'reviewer-1',
        isStaff: true,
        staffRole: 'clinical_reviewer',
        staffQualification: 'MBBS, MMedSc (Paediatrics)',
        displayName: 'Clinical Reviewer',
      },
    });
    await expect(requireProfessionalPublisher(ctx)).rejects.toThrow('Insufficient staff permission');
  });
});
