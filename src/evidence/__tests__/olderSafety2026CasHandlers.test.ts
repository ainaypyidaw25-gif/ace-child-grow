import { describe, expect, it, vi } from 'vitest';
import { apply, preflight, stageSources } from '../../../convex/olderSafety2026Cas';
import { OLDER_SAFETY_2026_RELEASE_ID } from '../../../convex/lib/olderSafety2026CasData';
import { OLDER_SAFETY_2026_V2_RELEASE_ID } from '../../../convex/lib/olderSafety2026CasV2Data';

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function noAccessContext() {
  return {
    db: {
      query: vi.fn(() => {
        throw new Error('superseded v1 must not query');
      }),
      get: vi.fn(() => {
        throw new Error('superseded v1 must not get');
      }),
      insert: vi.fn(() => {
        throw new Error('superseded v1 must not insert');
      }),
      patch: vi.fn(() => {
        throw new Error('superseded v1 must not patch');
      }),
    },
  };
}

const supersededBlocker =
  `Release ${OLDER_SAFETY_2026_RELEASE_ID} is superseded by ${OLDER_SAFETY_2026_V2_RELEASE_ID}`;

describe('older-safety v1 fail-closed supersession', () => {
  it('reports blocked without reading Production state', async () => {
    const ctx = noAccessContext();

    await expect(registeredHandler(preflight)(ctx, { now: Date.parse('2026-08-24T00:00:00Z') }))
      .resolves.toMatchObject({
        releaseId: OLDER_SAFETY_2026_RELEASE_ID,
        phase: 'blocked',
        targetCount: 9,
        blockers: [supersededBlocker],
      });

    expect(ctx.db.query).not.toHaveBeenCalled();
    expect(ctx.db.get).not.toHaveBeenCalled();
  });

  it('rejects every v1 write entrypoint before any database read or write', async () => {
    const ctx = noAccessContext();

    await expect(registeredHandler(stageSources)(ctx, {})).resolves.toEqual({
      ok: false,
      code: 'blocked',
      inserted: 0,
      blockers: [supersededBlocker],
    });
    await expect(registeredHandler(apply)(ctx, {})).resolves.toEqual({
      ok: false,
      phase: 'blocked',
      updated: 0,
      blockers: [supersededBlocker],
    });

    expect(ctx.db.query).not.toHaveBeenCalled();
    expect(ctx.db.get).not.toHaveBeenCalled();
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });
});
