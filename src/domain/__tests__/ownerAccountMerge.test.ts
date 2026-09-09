import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  apply,
  OWNER_ACCOUNT_MERGE_FINALIZE_CONFIRMATION,
  OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION,
  OWNER_ACCOUNT_MERGE_RELEASE_ID,
  preflight,
  quarantine,
} from '../../../convex/ownerAccountMerge';
import { OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS } from '../../../convex/lib/ownerAccountMergePolicy';

type Row = Record<string, unknown> & { _id: string };

const SOURCE_USER_ID = 'mn7en7gt4yc0w1fny6gfccqb8s8bck0m';
const TARGET_USER_ID = 'mn79pqcdy108y85stdxvtvqcz18b8w9c';
const SOURCE_PROFILE_ID = 'md7ab5dgsg9h6ew6ah2n39f7v98bds46';
const TARGET_PROFILE_ID = 'md7bqb9vjxytefqsdfd8p19cwd8b8vq8';
const SOURCE_SUBSCRIPTION_ID = 'mx72fnnqyd0q125shqxv4vvebh8bc1xa';
const TARGET_SUBSCRIPTION_ID = 'mx75qt1n1e8dv5y7wr1f5xm5sh8b8t2h';
const GOOGLE_ACCOUNT_ID = 'j97asew6qe3engdk7tm6a8g6fs8bcrwx';
const PASSWORD_ACCOUNT_ID = 'j97fwc6mr1gj8evmatwnzbkrah8b9gm3';
const SOURCE_CHILD_ID = 'k177zh32zak9da9jrsf3y7dh718bc2vx';
const START_TIME = 1_800_000_000_000;
const ACCESS_TOKEN_DRAIN_MS = 65 * 60 * 1_000;

function initialTables(): Record<string, Row[]> {
  return {
    users: [
      {
        _id: SOURCE_USER_ID,
        email: 'lapyaewun2690@gmail.com',
        name: 'Lapyae Wun',
        image: 'https://lh3.googleusercontent.com/a/ACg8ocJwP6KQ1LPgG1d1FM93hgHxwf3xK5aQa8_qPGxinSwScdcw9g=s96-c',
        emailVerificationTime: 1788167129007,
      },
      {
        _id: TARGET_USER_ID,
        email: 'lapyaewun2690@gmail.com',
        emailVerificationTime: 1787753791940,
      },
    ],
    parentProfiles: [
      {
        _id: SOURCE_PROFILE_ID,
        userId: SOURCE_USER_ID,
        displayName: 'ဒေါ်လပြည့်၀န်း',
        preferredLocale: 'mm',
        staffRole: 'owner',
        isStaff: true,
        consentAcceptedAt: 1785227040807,
        parentTourCompletedVersion: 1,
        staffTourCompletedVersion: 1,
      },
      {
        _id: TARGET_PROFILE_ID,
        userId: TARGET_USER_ID,
        displayName: 'Daw La Pyae Wun',
        preferredLocale: 'en',
        staffRole: 'owner',
        staffQualification: 'MEd (Early Childhood and Special Education)',
        isStaff: true,
        consentAcceptedAt: 1785027628992,
        parentTourCompletedVersion: 1,
        staffTourCompletedVersion: 1,
      },
    ],
    subscriptions: [
      {
        _id: SOURCE_SUBSCRIPTION_ID,
        userId: SOURCE_USER_ID,
        planKey: 'free',
        status: 'active',
        createdAt: 1785226992721,
        updatedAt: 1785226992721,
      },
      {
        _id: TARGET_SUBSCRIPTION_ID,
        userId: TARGET_USER_ID,
        planKey: 'free',
        status: 'active',
        createdAt: 1785046558245,
        updatedAt: 1785046558245,
      },
    ],
    authAccounts: [
      {
        _id: GOOGLE_ACCOUNT_ID,
        userId: SOURCE_USER_ID,
        provider: 'google',
        providerAccountId: '105107425159252909867',
      },
      {
        _id: PASSWORD_ACCOUNT_ID,
        userId: TARGET_USER_ID,
        provider: 'password',
        providerAccountId: 'lapyaewun2690@gmail.com',
        emailVerified: 'lapyaewun2690@gmail.com',
        secret: 'exact-password-secret-is-present',
      },
    ],
    authSessions: OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS.map((session) => ({ ...session })),
    // Refresh tokens are deliberately a live count (122 in the final snapshot)
    // while their owning session rows are exact and frozen.
    authRefreshTokens: Array.from({ length: 122 }, (_, index) => ({
      _id: `source-refresh-${index}`,
      sessionId: OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS[index % 16]._id,
    })),
    authVerifiers: [{
      _id: 'source-verifier-0',
      sessionId: OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS[0]._id,
    }],
    authVerificationCodes: [],
    children: [
      {
        _creationTime: 1785227083876.6602,
        _id: SOURCE_CHILD_ID,
        birthDate: '2026-04-02',
        gestationalWeeks: 37,
        nickname: 'La Pyae',
        useCorrectedAge: true,
        userId: SOURCE_USER_ID,
      },
      {
        _creationTime: 1785034645865.151,
        _id: 'k17b8swx2tn146zqbykj7ad3hd8b91kz',
        birthDate: '2025-11-06',
        nickname: 'ဖြိုး',
        useCorrectedAge: false,
        userId: TARGET_USER_ID,
      },
      {
        _creationTime: 1785713267663.4736,
        _id: 'k17bvz7ktgz3hrjg8reyqqsykh8bp83k',
        birthDate: '2023-12-14',
        nickname: 'လပြည့်',
        useCorrectedAge: false,
        userId: TARGET_USER_ID,
      },
    ],
    activityCompletions: [
      { _creationTime: 1785928626600.7715, _id: 'nd7057y0e1am4xzwdhhx03j7z98bxm6c', childId: SOURCE_CHILD_ID, completedAt: 1785928626600, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928636642.0193, _id: 'nd74dywcsc60csmd3x48f96qes8bx0vd', childId: SOURCE_CHILD_ID, completedAt: 1785928636642, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928630215.591, _id: 'nd74v726q2sxrkdczf1h3dbads8bxmn6', childId: SOURCE_CHILD_ID, completedAt: 1785928630215, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928638215.949, _id: 'nd756s7y1yp4fce3cy911nmgns8bwksn', childId: SOURCE_CHILD_ID, completedAt: 1785928638216, contentSlug: 'act_peek_a_boo_cloth', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928627175.2158, _id: 'nd75bwe6tt9x9jj2hvp6feby158bwzf7', childId: SOURCE_CHILD_ID, completedAt: 1785928627175, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928637961.2705, _id: 'nd765vf1fdb29pk5xg2m87vtv18bw4fd', childId: SOURCE_CHILD_ID, completedAt: 1785928637961, contentSlug: 'act_peek_a_boo_cloth', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928627569.0073, _id: 'nd78n3n1mwj8gb36f1y5zjtc9h8bwprc', childId: SOURCE_CHILD_ID, completedAt: 1785928627569, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928626022.703, _id: 'nd7bnydpfphmemqmz551yzt6b98bx7nr', childId: SOURCE_CHILD_ID, completedAt: 1785928626022, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928637222.3584, _id: 'nd7d93rdkfgtkdygjssn59g0258bwd9z', childId: SOURCE_CHILD_ID, completedAt: 1785928637222, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928639595.1538, _id: 'nd7dwagvn15k8qxmrqt29cqnkn8bx1c5', childId: SOURCE_CHILD_ID, completedAt: 1785928639595, contentSlug: 'act_picture_book_naming', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928630727.5234, _id: 'nd7e7qbckmvcj70e9mx5b64sxs8bxx3s', childId: SOURCE_CHILD_ID, completedAt: 1785928630727, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1786332191799.7844, _id: 'nd7e85pamb8dg2vj5sx4zjjhh18c6cad', childId: SOURCE_CHILD_ID, completedAt: 1786332191799, contentSlug: 'act_picture_book_naming', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928639361.79, _id: 'nd7edx89x3hewny8j88e1z2ry18bx21f', childId: SOURCE_CHILD_ID, completedAt: 1785928639361, contentSlug: 'act_picture_book_naming', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1786332192100.1045, _id: 'nd7ejdxk8bx9qwbv697g65n4th8c6d77', childId: SOURCE_CHILD_ID, completedAt: 1786332192100, contentSlug: 'act_picture_book_naming', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928637487.8015, _id: 'nd7fdy67mw1zpkddfcpatd8dds8bwqvw', childId: SOURCE_CHILD_ID, completedAt: 1785928637487, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785928636258.0337, _id: 'nd7fk280e6dmjz2x0vbcv5qtk98bx2q6', childId: SOURCE_CHILD_ID, completedAt: 1785928636258, contentSlug: 'act_copy_my_sound', durationMinutes: 5, userId: SOURCE_USER_ID },
      { _creationTime: 1785712605223.7625, _id: 'nd70qgdn8vybxd6c11k9vzw0k18bp9xb', childId: 'k17b8swx2tn146zqbykj7ad3hd8b91kz', completedAt: 1785712605223, contentSlug: 'act_gentle_bicycle_legs', durationMinutes: 2, userId: TARGET_USER_ID },
      { _creationTime: 1785712603597.0864, _id: 'nd72eq543178b92f0wg0ayw8j98bqjmm', childId: 'k17b8swx2tn146zqbykj7ad3hd8b91kz', completedAt: 1785712603597, contentSlug: 'act_face_to_face_talk', durationMinutes: 3, userId: TARGET_USER_ID },
      { _creationTime: 1785712604529.8918, _id: 'nd7fpekws9n768mk6tjjse4ct18bpb4a', childId: 'k17b8swx2tn146zqbykj7ad3hd8b91kz', completedAt: 1785712604529, contentSlug: 'act_first_book_share', durationMinutes: 3, userId: TARGET_USER_ID },
    ],
    notifications: [
      {
        _creationTime: 1785227040807.2278,
        _id: 'm97cchz13w6rjqsr764d9v88gd8bcfa1',
        bodyEn: 'Welcome to ACE Child Grow. Start your child’s development journey.',
        bodyMm: 'ACE Child Grow မှ ကြိုဆိုပါတယ်။ ကလေး၏ ဖွံ့ဖြိုးမှုခရီးကို စတင်လိုက်ပါ။',
        readAt: 1785227044680,
        titleEn: 'Welcome',
        titleMm: 'ကြိုဆိုပါတယ်',
        userId: SOURCE_USER_ID,
      },
      {
        _creationTime: 1785027628992.539,
        _id: 'm975z3xynwzwk31h1czhhk9vb98b9p72',
        bodyEn: 'Welcome to ACE Child Grow. Start your child’s development journey.',
        bodyMm: 'ACE Child Grow မှ ကြိုဆိုပါတယ်။ ကလေး၏ ဖွံ့ဖြိုးမှုခရီးကို စတင်လိုက်ပါ။',
        readAt: 1785027659126,
        titleEn: 'Welcome',
        titleMm: 'ကြိုဆိုပါတယ်',
        userId: TARGET_USER_ID,
      },
    ],
    contentReviews: Array.from({ length: 26 }, (_, index) => ({
      _id: `source-review-${index}`,
      reviewerId: SOURCE_USER_ID,
    })),
    contentEditLogs: Array.from({ length: 11 }, (_, index) => ({
      _id: `source-edit-${index}`,
      editorId: SOURCE_USER_ID,
    })),
    auditLogs: [{
      _id: 'historical-audit',
      _creationTime: 1_700_000_000_000,
      actorId: SOURCE_USER_ID,
      action: 'content.review.recorded',
      entityTable: 'libraryContent',
      entityId: 'historic-content',
      summary: 'historical actor must remain exact',
      result: 'ok',
    }],
  };
}

function context(seed = initialTables()) {
  const tables = Object.fromEntries(
    Object.entries(seed).map(([table, rows]) => [table, rows.map((row) => ({ ...row }))]),
  ) as Record<string, Row[]>;

  const terminal = (selected: Row[]) => {
    const value = {
      take: async (count: number) => selected.slice(0, count),
      order: () => value,
    };
    return value;
  };
  const query = vi.fn((table: string) => {
    const tableRows = tables[table] ?? [];
    return {
      ...terminal(tableRows),
      withIndex: (
        _name: string,
        callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
      ) => {
        const filters: Array<[string, unknown]> = [];
        type EqQuery = { eq: (field: string, value: unknown) => EqQuery };
        const q: EqQuery = {
          eq(field: string, value: unknown) {
            filters.push([field, value]);
            return q;
          },
        };
        callback(q);
        return terminal(
          tableRows.filter((row) => filters.every(([field, value]) => row[field] === value)),
        );
      },
    };
  });
  const findRow = (id: string) => Object.values(tables)
    .flat()
    .find((row) => row._id === id) ?? null;
  const db = {
    get: vi.fn(async (id: string) => findRow(id)),
    query,
    patch: vi.fn(async (id: string, update: Record<string, unknown>) => {
      const row = findRow(id);
      if (!row) throw new Error(`Missing row ${id}`);
      Object.assign(row, update);
    }),
    delete: vi.fn(async (id: string) => {
      for (const rows of Object.values(tables)) {
        const index = rows.findIndex((row) => row._id === id);
        if (index >= 0) {
          rows.splice(index, 1);
          return;
        }
      }
      throw new Error(`Missing row ${id}`);
    }),
    insert: vi.fn(async (table: string, row: Record<string, unknown>) => {
      const inserted = {
        _id: `${table}-${(tables[table] ?? []).length + 1}`,
        _creationTime: Date.now(),
        ...row,
      };
      (tables[table] ??= []).push(inserted);
      return inserted._id;
    }),
  };
  return { ctx: { db }, tables, db };
}

function handler(fn: unknown) {
  return (fn as {
    _handler: (ctx: ReturnType<typeof context>['ctx'], args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('exact duplicate-owner account merge', () => {
  it('quarantines credentials, drains old JWTs, then merges only the frozen rows', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START_TIME);
    const state = context();
    const historicalAudit = { ...state.tables.auditLogs[0] };

    await expect(handler(preflight)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'quarantine_ready',
      blockers: [],
      source: { sessionCount: 16, refreshTokenCount: 122, verifierCount: 1 },
    });

    await expect(handler(quarantine)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION,
    })).resolves.toMatchObject({
      phase: 'quarantined_waiting',
      blockers: [],
      quarantineAt: START_TIME,
      finalizeAfter: START_TIME + ACCESS_TOKEN_DRAIN_MS,
      source: { profileCount: 1, subscriptionCount: 1, childCount: 1 },
    });

    expect(state.tables.authAccounts.every((row) => row.userId === TARGET_USER_ID)).toBe(true);
    expect(state.tables.authSessions).toHaveLength(0);
    expect(state.tables.authRefreshTokens).toHaveLength(0);
    expect(state.tables.authVerifiers).toHaveLength(0);
    expect(state.tables.users.find((row) => row._id === SOURCE_USER_ID)).toEqual({
      _id: SOURCE_USER_ID,
      name: undefined,
      image: undefined,
      email: undefined,
      emailVerificationTime: undefined,
      phone: undefined,
      phoneVerificationTime: undefined,
    });
    expect(state.tables.users.find((row) => row._id === TARGET_USER_ID)).toEqual({
      _id: TARGET_USER_ID,
      email: 'lapyaewun2690@gmail.com',
      emailVerificationTime: 1787753791940,
      name: 'Lapyae Wun',
      image: 'https://lh3.googleusercontent.com/a/ACg8ocJwP6KQ1LPgG1d1FM93hgHxwf3xK5aQa8_qPGxinSwScdcw9g=s96-c',
    });
    expect(state.tables.parentProfiles).toHaveLength(2);
    expect(state.tables.subscriptions).toHaveLength(2);

    await expect(handler(apply)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_FINALIZE_CONFIRMATION,
    })).rejects.toThrow('Owner account finalize blocked');
    expect(state.tables.children.filter((row) => row.userId === SOURCE_USER_ID)).toHaveLength(1);

    vi.advanceTimersByTime(ACCESS_TOKEN_DRAIN_MS);
    await expect(handler(preflight)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({ phase: 'finalize_ready', blockers: [] });

    await expect(handler(apply)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_FINALIZE_CONFIRMATION,
    })).resolves.toMatchObject({
      phase: 'applied',
      blockers: [],
      source: {
        profileCount: 0,
        subscriptionCount: 0,
        childCount: 0,
        activityCompletionCount: 0,
        notificationCount: 0,
        historicalReviewCount: 26,
        historicalEditLogCount: 11,
      },
      target: {
        profileCount: 1,
        subscriptionCount: 1,
        authAccountCount: 2,
        childCount: 3,
        activityCompletionCount: 19,
        notificationCount: 2,
      },
    });

    expect(state.tables.contentReviews.every((row) => row.reviewerId === SOURCE_USER_ID)).toBe(true);
    expect(state.tables.contentEditLogs.every((row) => row.editorId === SOURCE_USER_ID)).toBe(true);
    expect(state.tables.auditLogs[0]).toEqual(historicalAudit);
    expect(state.tables.auditLogs.slice(1)).toEqual([
      expect.objectContaining({
        actorId: undefined,
        action: 'auth.account.merge_duplicate_owner.quarantine.2026_09_01_v1',
        result: 'ok',
      }),
      expect.objectContaining({
        actorId: undefined,
        action: 'auth.account.merge_duplicate_owner.finalize.2026_09_01_v1',
        result: 'ok',
      }),
    ]);
    expect(state.tables.parentProfiles).toEqual([
      expect.objectContaining({
        _id: TARGET_PROFILE_ID,
        displayName: 'Daw La Pyae Wun',
        preferredLocale: 'mm',
        staffQualification: 'MEd (Early Childhood and Special Education)',
      }),
    ]);
    expect(state.tables.subscriptions).toEqual([
      expect.objectContaining({ _id: TARGET_SUBSCRIPTION_ID, userId: TARGET_USER_ID }),
    ]);

    await expect(handler(quarantine)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION,
    })).resolves.toMatchObject({ phase: 'applied' });
    await expect(handler(apply)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_FINALIZE_CONFIRMATION,
    })).resolves.toMatchObject({ phase: 'applied' });
    expect(state.tables.auditLogs).toHaveLength(3);
  });

  it('fails closed before any write when the qualified owner preimage drifts', async () => {
    const seed = initialTables();
    const targetProfile = seed.parentProfiles.find((row) => row._id === TARGET_PROFILE_ID);
    if (!targetProfile) throw new Error('test fixture missing target profile');
    targetProfile.staffQualification = 'unverified';
    const state = context(seed);

    await expect(handler(preflight)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining(['qualified target owner profile preimage drifted']),
    });
    await expect(handler(quarantine)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION,
    })).rejects.toThrow('Owner account quarantine blocked');
    expect(state.db.patch).not.toHaveBeenCalled();
    expect(state.db.delete).not.toHaveBeenCalled();
    expect(state.db.insert).not.toHaveBeenCalled();
  });

  it('blocks unexpected private data and paid-provider metadata', async () => {
    const unexpectedSeed = initialTables();
    unexpectedSeed.favorites = [{ _id: 'source-favorite', userId: SOURCE_USER_ID }];
    await expect(handler(preflight)(context(unexpectedSeed).ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining(['source has 1 unexpected live reference categories']),
    });

    const paidSeed = initialTables();
    const sourceSubscription = paidSeed.subscriptions.find(
      (row) => row._id === SOURCE_SUBSCRIPTION_ID,
    );
    if (!sourceSubscription) throw new Error('test fixture missing source subscription');
    sourceSubscription.provider = 'stripe';
    sourceSubscription.providerCustomerId = 'cus_must_not_be_deleted';
    await expect(handler(preflight)(context(paidSeed).ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining(['exact initial preimage drifted']),
    });
  });

  it('blocks same-count data drift during the access-token drain', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START_TIME);
    const state = context();
    await handler(quarantine)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION,
    });
    const completion = state.tables.activityCompletions.find(
      (row) => row.userId === SOURCE_USER_ID,
    );
    if (!completion) throw new Error('test fixture missing source completion');
    completion.contentSlug = 'same-count-but-drifted';
    vi.advanceTimersByTime(ACCESS_TOKEN_DRAIN_MS);

    await expect(handler(preflight)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining(['quarantine postimage or final preimage drifted']),
    });
  });

  it('blocks drift in the exact source auth-session rows while allowing token rotation', async () => {
    const liveTokenSeed = initialTables();
    liveTokenSeed.authRefreshTokens.push({
      _id: 'newly-rotated-source-token',
      sessionId: OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS[0]._id,
    });
    await expect(handler(preflight)(context(liveTokenSeed).ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'quarantine_ready',
      blockers: [],
      source: { sessionCount: 16, refreshTokenCount: 123 },
    });
    const liveTokenState = context(liveTokenSeed);
    await expect(handler(quarantine)(liveTokenState.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION,
    })).resolves.toMatchObject({
      phase: 'quarantined_waiting',
      blockers: [],
      source: { sessionCount: 0, refreshTokenCount: 0, verifierCount: 0 },
    });
    expect(liveTokenState.tables.authRefreshTokens).not.toContainEqual(
      expect.objectContaining({ _id: 'newly-rotated-source-token' }),
    );

    const driftedSessionSeed = initialTables();
    driftedSessionSeed.authSessions[0].expirationTime = 0;
    await expect(handler(preflight)(context(driftedSessionSeed).ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining(['exact initial preimage drifted']),
    });
  });

  it('rejects duplicate target profiles and misattributed system audits', async () => {
    const duplicateProfileSeed = initialTables();
    duplicateProfileSeed.parentProfiles.push({
      _id: 'duplicate-target-profile',
      userId: TARGET_USER_ID,
      displayName: 'Duplicate',
      preferredLocale: 'en',
    });
    await expect(handler(preflight)(context(duplicateProfileSeed).ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining(['qualified target owner profile preimage drifted']),
    });

    vi.useFakeTimers();
    vi.setSystemTime(START_TIME);
    const state = context();
    await handler(quarantine)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
      confirmation: OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION,
    });
    const quarantineAudit = state.tables.auditLogs.find(
      (row) => row.action === 'auth.account.merge_duplicate_owner.quarantine.2026_09_01_v1',
    );
    if (!quarantineAudit) throw new Error('test fixture missing quarantine audit');
    quarantineAudit.actorId = TARGET_USER_ID;
    await expect(handler(preflight)(state.ctx, {
      releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining(['quarantine audit payload drifted']),
    });
  });
});
