import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { query } from './_generated/server';
import { getStaffAccess, type StaffRole } from './lib/auth';

const SCAN_LIMIT = 2_000;

const roleValidator = v.union(
  v.literal('owner'),
  v.literal('content_editor'),
  v.literal('language_reviewer'),
  v.literal('evidence_reviewer'),
  v.literal('clinical_reviewer'),
  v.literal('review_manager'),
  v.literal('support'),
);

const changeValidator = v.object({
  path: v.string(),
  before: v.string(),
  after: v.string(),
  truncated: v.boolean(),
});

const editValidator = v.object({
  _id: v.id('contentEditLogs'),
  _creationTime: v.number(),
  contentId: v.id('libraryContent'),
  contentSlug: v.string(),
  fromVersion: v.number(),
  toVersion: v.number(),
  editorId: v.id('users'),
  editorDisplayName: v.string(),
  editorRole: roleValidator,
  editedAt: v.number(),
  totalChanges: v.number(),
  logTruncated: v.boolean(),
  changes: v.array(changeValidator),
});

/** Owner/content-editor view of field-level edits across the content library. */
export const activity = query({
  args: {
    editorId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    allowed: v.boolean(),
    truncated: v.boolean(),
    totalScanned: v.number(),
    edits: v.array(editValidator),
    editors: v.array(
      v.object({
        editorId: v.id('users'),
        displayName: v.string(),
        role: roleValidator,
        total: v.number(),
        distinctItems: v.number(),
        lastEditedAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const access = userId ? await getStaffAccess(ctx, userId) : null;
    if (!access || !['owner', 'content_editor'].includes(access.role)) {
      return {
        allowed: false,
        truncated: false,
        totalScanned: 0,
        edits: [],
        editors: [],
      };
    }

    const scanned = await ctx.db.query('contentEditLogs').order('desc').take(SCAN_LIMIT);
    const byEditor = new Map<string, {
      editorId: (typeof scanned)[number]['editorId'];
      displayName: string;
      role: StaffRole;
      total: number;
      slugs: Set<string>;
      lastEditedAt: number;
    }>();

    for (const row of scanned) {
      const key = String(row.editorId);
      const current = byEditor.get(key);
      if (!current) {
        byEditor.set(key, {
          editorId: row.editorId,
          displayName: row.editorDisplayName,
          role: row.editorRole,
          total: 1,
          slugs: new Set([row.contentSlug]),
          lastEditedAt: row.editedAt,
        });
        continue;
      }
      current.total += 1;
      current.slugs.add(row.contentSlug);
      if (row.editedAt > current.lastEditedAt) {
        current.lastEditedAt = row.editedAt;
        current.displayName = row.editorDisplayName;
        current.role = row.editorRole;
      }
    }

    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    const edits = args.editorId
      ? await ctx.db
          .query('contentEditLogs')
          .withIndex('by_editor', (q) => q.eq('editorId', args.editorId!))
          .order('desc')
          .take(limit)
      : scanned.slice(0, limit);

    return {
      allowed: true,
      truncated: scanned.length === SCAN_LIMIT || edits.length === limit,
      totalScanned: scanned.length,
      edits,
      editors: [...byEditor.values()]
        .map(({ slugs, ...editor }) => ({ ...editor, distinctItems: slugs.size }))
        .sort((a, b) => b.lastEditedAt - a.lastEditedAt),
    };
  },
});
