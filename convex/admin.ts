import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getStaffAccess, requireOwner, requireReviewManager, requireUser, type StaffRole } from './lib/auth';
import { logAudit } from './audit';
import { staffRoleValidator as roleValidator } from './lib/reviewRoles';

const REVIEWER_TERMS_VERSION = 'reviewer-terms-2026-07-29';

const roleLabels: Record<StaffRole, string> = {
  owner: 'Owner',
  content_editor: 'Content editor',
  language_reviewer: 'Native-language reviewer',
  evidence_reviewer: 'Evidence reviewer',
  clinical_reviewer: 'Clinical reviewer',
  support: 'Support',
  system_admin: 'System admin',
  review_manager: 'Review manager',
  myanmar_language_reviewer: 'Myanmar language reviewer',
  child_development_reviewer: 'Child development reviewer',
  publisher: 'Publisher',
  auditor: 'Auditor',
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createInviteCode(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const myAccess = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      isStaff: v.boolean(),
      role: v.union(roleValidator, v.null()),
      roles: v.array(roleValidator),
      qualification: v.union(v.string(), v.null()),
      displayName: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    return {
      isStaff: access !== null,
      role: access?.role ?? null,
      roles: access?.roles ?? [],
      qualification: access?.qualification ?? null,
      displayName: access?.displayName ?? null,
    };
  },
});

export const listTeam = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    currentUserId: v.union(v.id('users'), v.null()),
    members: v.array(
      v.object({
        userId: v.id('users'),
        email: v.union(v.string(), v.null()),
        displayName: v.union(v.string(), v.null()),
        role: roleValidator,
        roles: v.array(roleValidator),
        qualification: v.union(v.string(), v.null()),
      }),
    ),
    invites: v.array(
      v.object({
        id: v.id('staffInvites'),
        email: v.string(),
        displayName: v.string(),
        role: roleValidator,
        qualification: v.union(v.string(), v.null()),
        expiresAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!access?.roles.some((role) => ['owner', 'system_admin', 'review_manager'].includes(role))) {
      return { allowed: false, currentUserId: userId, members: [], invites: [] };
    }

    const profiles = await ctx.db
      .query('parentProfiles')
      .withIndex('by_is_staff', (q) => q.eq('isStaff', true))
      .take(100);
    const members = [];
    for (const profile of profiles) {
      const memberAccess = await getStaffAccess(ctx, profile.userId);
      if (!memberAccess) continue;
      const user = await ctx.db.get(profile.userId);
      members.push({
        userId: profile.userId,
        email: user?.email ?? null,
        displayName: memberAccess.displayName,
        role: memberAccess.role,
        roles: memberAccess.roles,
        qualification: memberAccess.qualification,
      });
    }
    const pending = await ctx.db
      .query('staffInvites')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .order('desc')
      .take(100);
    return {
      allowed: true,
      currentUserId: userId,
      members,
      invites: pending.map((invite) => ({
        id: invite._id,
        email: invite.email,
        displayName: invite.displayName,
        role: invite.role,
        qualification: invite.reviewerQualification ?? null,
        expiresAt: invite.expiresAt,
      })),
    };
  },
});

export const createInvite = mutation({
  args: {
    email: v.string(),
    displayName: v.string(),
    role: roleValidator,
    reviewerQualification: v.optional(v.string()),
    organization: v.optional(v.string()),
    reviewScope: v.string(),
    ageGroups: v.array(v.string()),
    contentTypes: v.array(v.string()),
    expiresInDays: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  returns: v.object({ inviteCode: v.string(), email: v.string(), expiresAt: v.number() }),
  handler: async (ctx, args) => {
    const { userId: managerId, access } = await requireReviewManager(ctx);
    const email = normalizeEmail(args.email);
    const displayName = args.displayName.trim();
    if (!email.includes('@')) throw new Error('A valid email address is required');
    if (!displayName) throw new Error('A team member name is required');
    const targetUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .unique();
    if (args.role === 'owner' || args.role === 'system_admin' || args.role === 'publisher') {
      if (!access.roles.includes('owner') && !access.roles.includes('system_admin')) {
        throw new Error('Only a system administrator may invite this role');
      }
    }
    const qualification = args.reviewerQualification?.trim();
    if (['clinical_reviewer', 'evidence_reviewer'].includes(args.role) && !qualification) {
      throw new Error('A professional qualification is required for this reviewer role');
    }
    const prior = await ctx.db
      .query('staffInvites')
      .withIndex('by_email', (q) => q.eq('email', email))
      .order('desc')
      .take(20);
    for (const invite of prior) {
      if (invite.status === 'pending') await ctx.db.patch(invite._id, { status: 'revoked' });
    }
    const inviteCode = createInviteCode();
    const now = Date.now();
    const expiresInDays = Math.max(1, Math.min(30, Math.floor(args.expiresInDays ?? 7)));
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;
    const inviteId = await ctx.db.insert('staffInvites', {
      email,
      displayName,
      role: args.role,
      reviewerQualification: qualification,
      organization: args.organization?.trim() || undefined,
      reviewScope: args.reviewScope.trim(),
      ageGroups: [...new Set(args.ageGroups.map((value) => value.trim()).filter(Boolean))],
      contentTypes: [...new Set(args.contentTypes.map((value) => value.trim()).filter(Boolean))],
      note: args.note?.trim() || undefined,
      termsVersion: REVIEWER_TERMS_VERSION,
      codeHash: await hashCode(inviteCode),
      ...(targetUser ? { targetUserId: targetUser._id } : {}),
      status: 'pending',
      invitedBy: managerId,
      invitedAt: now,
      expiresAt,
    });
    await logAudit(ctx, managerId, 'staff.invite', 'staffInvites', inviteId, `${email} · ${roleLabels[args.role]}`);
    return { inviteCode, email, expiresAt };
  },
});

export const claimInvite = mutation({
  args: { inviteCode: v.string(), termsAccepted: v.boolean(), termsVersion: v.string() },
  returns: v.object({ ok: v.boolean(), role: v.union(roleValidator, v.null()), message: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!args.termsAccepted || args.termsVersion !== REVIEWER_TERMS_VERSION) {
      throw new Error('Current reviewer terms must be accepted');
    }
    const user = await ctx.db.get(userId);
    const email = normalizeEmail(user?.email ?? '');
    const codeHash = await hashCode(args.inviteCode.trim());
    const invite = await ctx.db
      .query('staffInvites')
      .withIndex('by_code_hash', (q) => q.eq('codeHash', codeHash))
      .unique();
    if (!invite || invite.status !== 'pending') {
      await logAudit(ctx, userId, 'staff.invite.claim_rejected', 'staffInvites', invite?._id, 'invalid or inactive', { result: 'rejected' });
      return { ok: false, role: null, message: 'Invitation is invalid or no longer active.' };
    }
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(invite._id, { status: 'expired' });
      await logAudit(ctx, userId, 'staff.invite.claim_rejected', 'staffInvites', invite._id, 'expired', { result: 'rejected' });
      return { ok: false, role: null, message: 'Invitation has expired.' };
    }
    if (!email || email !== invite.email || (invite.targetUserId !== undefined && userId !== invite.targetUserId)) {
      await logAudit(ctx, userId, 'staff.invite.claim_rejected', 'staffInvites', invite._id, 'wrong account', { result: 'rejected' });
      return { ok: false, role: null, message: 'Sign in with the exact account that was invited.' };
    }

    const profile = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    const staffPatch = {
      isStaff: true as const,
      staffRole: invite.role,
      staffQualification: invite.reviewerQualification,
      displayName: invite.displayName,
    };
    if (profile) await ctx.db.patch(profile._id, staffPatch);
    else await ctx.db.insert('parentProfiles', { userId, preferredLocale: 'mm', ...staffPatch });
    const acceptedAt = Date.now();
    await ctx.db.patch(invite._id, { status: 'accepted', acceptedBy: userId, acceptedAt, termsAcceptedAt: acceptedAt });
    await logAudit(ctx, userId, 'staff.invite.accept', 'staffInvites', invite._id, `${email} · ${roleLabels[invite.role]}`);
    return { ok: true, role: invite.role, message: 'Invitation accepted.' };
  },
});

export const revokeInvite = mutation({
  args: { id: v.id('staffInvites') },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const invite = await ctx.db.get(args.id);
    if (!invite || invite.status !== 'pending') return { ok: false };
    await ctx.db.patch(invite._id, { status: 'revoked' });
    await logAudit(ctx, ownerId, 'staff.invite.revoke', 'staffInvites', invite._id, invite.email);
    return { ok: true };
  },
});

export const changeRole = mutation({
  args: {
    userId: v.id('users'),
    role: roleValidator,
    displayName: v.optional(v.string()),
    reviewerQualification: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    if (ownerId === args.userId) throw new Error('Owners cannot change their own role');
    const qualification = args.reviewerQualification?.trim();
    const displayName = args.displayName?.trim();
    if (['clinical_reviewer', 'evidence_reviewer'].includes(args.role) && (!qualification || !displayName)) {
      throw new Error('Reviewer name and qualification are required');
    }
    const profile = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();
    if (!profile?.isStaff) return { ok: false };
    const before = profile.staffRole ?? 'owner';
    await ctx.db.patch(profile._id, {
      staffRole: args.role,
      staffQualification: qualification,
      ...(displayName ? { displayName } : {}),
    });
    await logAudit(ctx, ownerId, 'staff.role.change', 'parentProfiles', profile._id, `${before} → ${args.role}`);
    return { ok: true };
  },
});

export const removeStaff = mutation({
  args: { userId: v.id('users') },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    if (ownerId === args.userId) throw new Error('Owners cannot remove their own access');
    const profile = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();
    if (!profile?.isStaff) return { ok: false };
    await ctx.db.patch(profile._id, { isStaff: false, staffRole: undefined, staffQualification: undefined });
    await logAudit(ctx, ownerId, 'staff.remove', 'parentProfiles', profile._id);
    return { ok: true };
  },
});
