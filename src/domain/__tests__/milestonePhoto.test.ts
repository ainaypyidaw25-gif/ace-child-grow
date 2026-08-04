import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import {
  attachMilestonePhoto,
  removeMilestonePhoto,
  listAchievedMilestones,
  getMilestoneKeepsake,
} from '../../../convex/milestones';

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: {
  rows?: Record<string, Row[]>;
  get?: Row | null;
  getMany?: Record<string, Row | null>;
  storageMeta?: Row | null;
} = {}) {
  const storageDelete = vi.fn(async () => undefined);
  const getUrl = vi.fn(async (id: string) => `https://cdn.example/${id}`);
  const patch = vi.fn();
  const query = vi.fn((table: string) => {
    const rows = options.rows?.[table] ?? [];
    const terminal = {
      collect: async () => rows,
      take: async (n: number) => rows.slice(0, n),
      unique: async () => rows[0] ?? null,
      order: () => terminal,
    };
    return {
      ...terminal,
      withIndex: (_n: string, cb: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => {
        const q = { eq: (field: string, value: unknown): unknown => { void field; void value; return q; } };
        cb(q);
        return terminal;
      },
    };
  });
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async (id: unknown) => options.getMany?.[String(id)] ?? options.get ?? null),
      patch,
      system: { get: vi.fn(async () => options.storageMeta ?? null) },
    },
    storage: { delete: storageDelete, getUrl },
    storageDelete,
    getUrl,
    patch,
  };
}

function handler(fn: unknown): (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> {
  return (fn as { _handler: (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> })._handler;
}

beforeEach(() => { authState.userId = 'user-1'; });

describe('attachMilestonePhoto', () => {
  const achievedResponse = { _id: 'response-1', childId: 'child-1', answer: 'yes' };
  const ownChildDoc = { _id: 'child-1', userId: 'user-1' };
  const args = { responseId: 'response-1', storageId: 'storage-1' };

  it('rejects when unauthenticated', async () => {
    authState.userId = null;
    const context = ctx({ getMany: { 'response-1': achievedResponse, 'child-1': ownChildDoc } });
    await expect(handler(attachMilestonePhoto)(context, args)).rejects.toThrow('Not authenticated');
  });

  it('rejects a response owned by a different user\'s child', async () => {
    const context = ctx({
      getMany: { 'response-1': achievedResponse, 'child-1': { _id: 'child-1', userId: 'user-2' } },
    });
    await expect(handler(attachMilestonePhoto)(context, args)).rejects.toThrow('Not found');
    expect(context.patch).not.toHaveBeenCalled();
  });

  it('rejects a response that has not been answered yes', async () => {
    const context = ctx({
      getMany: { 'response-1': { ...achievedResponse, answer: 'not_yet' }, 'child-1': ownChildDoc },
    });
    await expect(handler(attachMilestonePhoto)(context, args)).rejects.toThrow(/achieved milestone/);
  });

  it('rejects and deletes a non-image upload', async () => {
    const context = ctx({
      getMany: { 'response-1': achievedResponse, 'child-1': ownChildDoc },
      storageMeta: { contentType: 'application/pdf', size: 1000 },
    });
    await expect(handler(attachMilestonePhoto)(context, args)).rejects.toThrow(/JPG, PNG, or WebP/);
    expect(context.storageDelete).toHaveBeenCalledWith('storage-1');
  });

  it('rejects and deletes an oversized image', async () => {
    const context = ctx({
      getMany: { 'response-1': achievedResponse, 'child-1': ownChildDoc },
      storageMeta: { contentType: 'image/png', size: 6 * 1024 * 1024 },
    });
    await expect(handler(attachMilestonePhoto)(context, args)).rejects.toThrow(/up to 5 MB/);
    expect(context.storageDelete).toHaveBeenCalledWith('storage-1');
  });

  it('rejects a storage id with no uploaded file behind it', async () => {
    const context = ctx({
      getMany: { 'response-1': achievedResponse, 'child-1': ownChildDoc },
      storageMeta: null,
    });
    await expect(handler(attachMilestonePhoto)(context, args)).rejects.toThrow(/not found/);
  });

  it('attaches a valid photo and deletes the previous blob when replacing one', async () => {
    const context = ctx({
      getMany: {
        'response-1': { ...achievedResponse, photoStorageId: 'old-storage' },
        'child-1': ownChildDoc,
      },
      storageMeta: { contentType: 'image/webp', size: 1000 },
    });
    await handler(attachMilestonePhoto)(context, args);
    expect(context.patch).toHaveBeenCalledWith('response-1', { photoStorageId: 'storage-1' });
    expect(context.storageDelete).toHaveBeenCalledWith('old-storage');
  });

  it('does not delete anything when there was no previous photo', async () => {
    const context = ctx({
      getMany: { 'response-1': achievedResponse, 'child-1': ownChildDoc },
      storageMeta: { contentType: 'image/jpeg', size: 1000 },
    });
    await handler(attachMilestonePhoto)(context, args);
    expect(context.storageDelete).not.toHaveBeenCalled();
  });
});

describe('removeMilestonePhoto', () => {
  const ownChildDoc = { _id: 'child-1', userId: 'user-1' };

  it('deletes the blob and clears the field', async () => {
    const context = ctx({
      getMany: {
        'response-1': { _id: 'response-1', childId: 'child-1', photoStorageId: 'storage-1' },
        'child-1': ownChildDoc,
      },
    });
    await handler(removeMilestonePhoto)(context, { responseId: 'response-1' });
    expect(context.storageDelete).toHaveBeenCalledWith('storage-1');
    expect(context.patch).toHaveBeenCalledWith('response-1', { photoStorageId: undefined });
  });

  it('rejects when there is no photo to remove', async () => {
    const context = ctx({
      getMany: { 'response-1': { _id: 'response-1', childId: 'child-1' }, 'child-1': ownChildDoc },
    });
    await expect(handler(removeMilestonePhoto)(context, { responseId: 'response-1' }))
      .rejects.toThrow(/No photo/);
  });

  it('rejects a response owned by a different user\'s child', async () => {
    const context = ctx({
      getMany: {
        'response-1': { _id: 'response-1', childId: 'child-1', photoStorageId: 'storage-1' },
        'child-1': { _id: 'child-1', userId: 'user-2' },
      },
    });
    await expect(handler(removeMilestonePhoto)(context, { responseId: 'response-1' })).rejects.toThrow('Not found');
    expect(context.storageDelete).not.toHaveBeenCalled();
  });
});

describe('listAchievedMilestones', () => {
  const ownChildDoc = { _id: 'child-1', userId: 'user-1' };

  it('filters to achieved milestones and dedupes by milestoneKey, keeping the latest', async () => {
    const context = ctx({
      getMany: { 'child-1': ownChildDoc },
      rows: {
        milestoneResponses: [
          { _id: 'r1', childId: 'child-1', milestoneKey: 'first_steps', answer: 'yes', answeredAt: 100, domain: 'motor' },
          { _id: 'r2', childId: 'child-1', milestoneKey: 'first_words', answer: 'not_yet', answeredAt: 200, domain: 'language' },
          { _id: 'r3', childId: 'child-1', milestoneKey: 'first_steps', answer: 'yes', answeredAt: 300, domain: 'motor', photoStorageId: 'storage-1' },
        ],
      },
    });
    const result = await handler(listAchievedMilestones)(context, { childId: 'child-1' }) as Array<{ _id: string; photoUrl: string | null }>;
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('r3');
    expect(result[0].photoUrl).toBe('https://cdn.example/storage-1');
  });

  it('returns a null photoUrl for a milestone with no photo', async () => {
    const context = ctx({
      getMany: { 'child-1': ownChildDoc },
      rows: {
        milestoneResponses: [
          { _id: 'r1', childId: 'child-1', milestoneKey: 'first_steps', answer: 'yes', answeredAt: 100, domain: 'motor' },
        ],
      },
    });
    const result = await handler(listAchievedMilestones)(context, { childId: 'child-1' }) as Array<{ photoUrl: string | null }>;
    expect(result[0].photoUrl).toBeNull();
    expect(context.getUrl).not.toHaveBeenCalled();
  });
});

describe('getMilestoneKeepsake', () => {
  const ownChildDoc = { _id: 'child-1', userId: 'user-1', nickname: 'Baby' };

  it('returns null for a nonexistent response', async () => {
    const context = ctx({ getMany: {} });
    await expect(handler(getMilestoneKeepsake)(context, { responseId: 'missing' })).resolves.toBeNull();
  });

  it('throws for a different owner\'s child', async () => {
    const context = ctx({
      getMany: {
        'response-1': { _id: 'response-1', childId: 'child-1', milestoneKey: 'first_steps', answer: 'yes', answeredAt: 100, domain: 'motor' },
        'child-1': { _id: 'child-1', userId: 'user-2' },
      },
    });
    await expect(handler(getMilestoneKeepsake)(context, { responseId: 'response-1' })).rejects.toThrow('Not found');
  });

  it('returns the keepsake data with the child nickname and resolved photo url', async () => {
    const context = ctx({
      getMany: {
        'response-1': {
          _id: 'response-1', childId: 'child-1', milestoneKey: 'first_steps',
          titleMm: 'ပထမဆုံး လှမ်းလှမ်း', titleEn: 'First steps',
          answer: 'yes', answeredAt: 100, domain: 'motor', photoStorageId: 'storage-1',
        },
        'child-1': ownChildDoc,
      },
    });
    const result = await handler(getMilestoneKeepsake)(context, { responseId: 'response-1' }) as { childNickname: string; photoUrl: string | null };
    expect(result.childNickname).toBe('Baby');
    expect(result.photoUrl).toBe('https://cdn.example/storage-1');
  });
});
