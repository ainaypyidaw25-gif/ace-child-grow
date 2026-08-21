import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireOwner, requireUser } from './lib/auth';
import { logAudit } from './audit';

const paidPlanValidator = v.union(v.literal('premium'), v.literal('family'));
const intervalValidator = v.union(v.literal('month'), v.literal('year'));
const requestStatusValidator = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('canceled'),
);

const planValidator = v.object({
  _id: v.id('subscriptionPlans'),
  _creationTime: v.number(),
  planKey: paidPlanValidator,
  nameMm: v.string(),
  nameEn: v.string(),
  descriptionMm: v.optional(v.string()),
  descriptionEn: v.optional(v.string()),
  amount: v.number(),
  currency: v.string(),
  interval: intervalValidator,
  features: v.array(v.string()),
  isActive: v.boolean(),
  sortOrder: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const methodValidator = v.object({
  _id: v.id('paymentMethods'),
  _creationTime: v.number(),
  nameMm: v.string(),
  nameEn: v.string(),
  accountName: v.string(),
  accountIdentifier: v.string(),
  instructionsMm: v.optional(v.string()),
  instructionsEn: v.optional(v.string()),
  isActive: v.boolean(),
  sortOrder: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const requestValidator = v.object({
  _id: v.id('paymentRequests'),
  _creationTime: v.number(),
  userId: v.id('users'),
  planKey: paidPlanValidator,
  planId: v.optional(v.id('subscriptionPlans')),
  paymentMethodId: v.id('paymentMethods'),
  amount: v.number(),
  currency: v.string(),
  paymentReference: v.string(),
  proofStorageId: v.optional(v.id('_storage')),
  status: requestStatusValidator,
  reviewedBy: v.optional(v.id('users')),
  reviewNote: v.optional(v.string()),
  reviewedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const options = query({
  args: {},
  returns: v.object({ plans: v.array(planValidator), methods: v.array(methodValidator) }),
  handler: async (ctx) => {
    await requireUser(ctx);
    const plans = await ctx.db
      .query('subscriptionPlans')
      .withIndex('by_active_and_sort_order', (q) => q.eq('isActive', true))
      .take(20);
    const methods = await ctx.db
      .query('paymentMethods')
      .withIndex('by_active_and_sort_order', (q) => q.eq('isActive', true))
      .take(20);
    return { plans, methods };
  },
});

export const myRequests = query({
  args: {},
  returns: v.array(requestValidator),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query('paymentRequests')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
  },
});

export const generateProofUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const submitPaymentRequest = mutation({
  args: {
    planId: v.id('subscriptionPlans'),
    paymentMethodId: v.id('paymentMethods'),
    paymentReference: v.string(),
    proofStorageId: v.optional(v.id('_storage')),
  },
  returns: v.id('paymentRequests'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const [plan, method] = await Promise.all([
      ctx.db.get(args.planId),
      ctx.db.get(args.paymentMethodId),
    ]);
    if (!plan?.isActive || !method?.isActive) throw new Error('Plan or payment method is unavailable');
    const reference = args.paymentReference.trim();
    if (reference.length < 3 || reference.length > 100) throw new Error('Payment reference is required');
    // A payment proof is a screenshot an owner will open in the admin dashboard.
    // Validate what was actually uploaded rather than trusting the storage id the
    // client passed, the same way library media is checked before it is attached.
    if (args.proofStorageId) {
      const metadata = await ctx.db.system.get(args.proofStorageId);
      if (!metadata) throw new Error('Uploaded payment proof not found');
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(metadata.contentType ?? '') || metadata.size > 5 * 1024 * 1024) {
        await ctx.storage.delete(args.proofStorageId);
        throw new Error('Use a JPG, PNG, or WebP screenshot up to 5 MB');
      }
    }
    const previous = await ctx.db
      .query('paymentRequests')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
    if (previous.some((row) => row.status === 'pending')) throw new Error('A payment request is already pending');
    const now = Date.now();
    const id = await ctx.db.insert('paymentRequests', {
      userId,
      planKey: plan.planKey,
      planId: plan._id,
      paymentMethodId: method._id,
      amount: plan.amount,
      currency: plan.currency,
      paymentReference: reference,
      proofStorageId: args.proofStorageId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    await logAudit(ctx, userId, 'billing.request.submit', 'paymentRequests', id, `${plan.planKey} · ${plan.amount} ${plan.currency}`);
    return id;
  },
});

export const cancelMyRequest = mutation({
  args: { id: v.id('paymentRequests') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new Error('Payment request not found');
    if (row.status !== 'pending') throw new Error('Only a pending request can be canceled');
    await ctx.db.patch(id, { status: 'canceled', updatedAt: Date.now() });
    await logAudit(ctx, userId, 'billing.request.cancel', 'paymentRequests', id);
    return null;
  },
});

export const adminDashboard = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    plans: v.array(planValidator),
    methods: v.array(methodValidator),
    requests: v.array(v.object({
      request: requestValidator,
      userEmail: v.union(v.string(), v.null()),
      methodName: v.union(v.string(), v.null()),
      proofUrl: v.union(v.string(), v.null()),
    })),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false, plans: [], methods: [], requests: [] };
    try {
      await requireOwner(ctx);
    } catch {
      return { allowed: false, plans: [], methods: [], requests: [] };
    }
    const [plans, methods, pending, approved, rejected] = await Promise.all([
      ctx.db.query('subscriptionPlans').take(50),
      ctx.db.query('paymentMethods').take(50),
      ctx.db.query('paymentRequests').withIndex('by_status', (q) => q.eq('status', 'pending')).order('desc').take(100),
      ctx.db.query('paymentRequests').withIndex('by_status', (q) => q.eq('status', 'approved')).order('desc').take(50),
      ctx.db.query('paymentRequests').withIndex('by_status', (q) => q.eq('status', 'rejected')).order('desc').take(50),
    ]);
    plans.sort((a, b) => a.sortOrder - b.sortOrder);
    methods.sort((a, b) => a.sortOrder - b.sortOrder);
    const requests = [];
    for (const request of [...pending, ...approved, ...rejected]) {
      const [user, method, proofUrl] = await Promise.all([
        ctx.db.get(request.userId),
        ctx.db.get(request.paymentMethodId),
        request.proofStorageId ? ctx.storage.getUrl(request.proofStorageId) : Promise.resolve(null),
      ]);
      requests.push({
        request,
        userEmail: user?.email ?? null,
        methodName: method?.nameMm ?? method?.nameEn ?? null,
        proofUrl,
      });
    }
    return { allowed: true, plans, methods, requests };
  },
});

export const upsertPlan = mutation({
  args: {
    id: v.optional(v.id('subscriptionPlans')),
    planKey: paidPlanValidator,
    nameMm: v.string(), nameEn: v.string(),
    descriptionMm: v.optional(v.string()), descriptionEn: v.optional(v.string()),
    amount: v.number(), currency: v.string(), interval: intervalValidator,
    features: v.array(v.string()), isActive: v.boolean(), sortOrder: v.number(),
  },
  returns: v.id('subscriptionPlans'),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    if (!Number.isInteger(args.amount) || args.amount <= 0) throw new Error('Amount must be a positive whole number');
    if (!args.nameMm.trim() || !args.nameEn.trim() || !args.currency.trim()) throw new Error('Plan fields are required');
    const existingForKey = await ctx.db
      .query('subscriptionPlans')
      .withIndex('by_plan_key_interval', (q) => q.eq('planKey', args.planKey).eq('interval', args.interval))
      .unique();
    if (existingForKey && existingForKey._id !== args.id) throw new Error('This plan and interval already exist');
    const now = Date.now();
    const { id, ...fields } = args;
    const normalized = {
      ...fields,
      nameMm: fields.nameMm.trim(),
      nameEn: fields.nameEn.trim(),
      currency: fields.currency.trim().toUpperCase(),
      updatedAt: now,
    };
    const planId = id ?? await ctx.db.insert('subscriptionPlans', { ...normalized, createdAt: now });
    if (id) {
      if (!(await ctx.db.get(id))) throw new Error('Plan not found');
      await ctx.db.patch(id, normalized);
    }
    await logAudit(ctx, ownerId, id ? 'billing.plan.update' : 'billing.plan.create', 'subscriptionPlans', planId, normalized.nameEn);
    return planId;
  },
});

export const installRecommendedPlans = mutation({
  args: {},
  returns: v.object({ created: v.number(), updated: v.number() }),
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx);
    const now = Date.now();
    const templates = [
      { planKey: 'premium' as const, interval: 'month' as const, amount: 6_900, sortOrder: 1, nameMm: 'Premium လစဉ်', nameEn: 'Premium Monthly' },
      { planKey: 'premium' as const, interval: 'year' as const, amount: 69_000, sortOrder: 2, nameMm: 'Premium နှစ်စဉ်', nameEn: 'Premium Yearly' },
      { planKey: 'family' as const, interval: 'month' as const, amount: 9_900, sortOrder: 3, nameMm: 'Family လစဉ်', nameEn: 'Family Monthly' },
      { planKey: 'family' as const, interval: 'year' as const, amount: 99_000, sortOrder: 4, nameMm: 'Family နှစ်စဉ်', nameEn: 'Family Yearly' },
    ];
    let created = 0;
    let updated = 0;
    for (const template of templates) {
      const existing = await ctx.db
        .query('subscriptionPlans')
        .withIndex('by_plan_key_interval', (q) => q.eq('planKey', template.planKey).eq('interval', template.interval))
        .unique();
      const values = {
        ...template,
        descriptionMm: template.planKey === 'family'
          ? 'ကလေး ၃ ဦးနှင့် စောင့်ရှောက်သူ ၃ ဦးအထိ'
          : 'ကလေးတစ်ဦးအတွက် ကိုယ်ပိုင်အစီအစဉ်နှင့် အစီရင်ခံစာ',
        descriptionEn: template.planKey === 'family'
          ? 'Up to 3 children and 3 caregivers'
          : 'Personalized plan and reports for one child',
        currency: 'MMK',
        features: [],
        isActive: true,
        updatedAt: now,
      };
      if (existing) {
        await ctx.db.patch(existing._id, values);
        updated += 1;
      } else {
        await ctx.db.insert('subscriptionPlans', { ...values, createdAt: now });
        created += 1;
      }
    }
    await logAudit(ctx, ownerId, 'billing.plan.install_recommended', 'subscriptionPlans', undefined, `${created} created, ${updated} updated`);
    return { created, updated };
  },
});

export const upsertMethod = mutation({
  args: {
    id: v.optional(v.id('paymentMethods')),
    nameMm: v.string(), nameEn: v.string(), accountName: v.string(), accountIdentifier: v.string(),
    instructionsMm: v.optional(v.string()), instructionsEn: v.optional(v.string()),
    isActive: v.boolean(), sortOrder: v.number(),
  },
  returns: v.id('paymentMethods'),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    if (!args.nameMm.trim() || !args.nameEn.trim() || !args.accountName.trim() || !args.accountIdentifier.trim()) {
      throw new Error('Payment method fields are required');
    }
    const now = Date.now();
    const { id, ...fields } = args;
    const normalized = {
      ...fields,
      nameMm: fields.nameMm.trim(), nameEn: fields.nameEn.trim(),
      accountName: fields.accountName.trim(), accountIdentifier: fields.accountIdentifier.trim(),
      updatedAt: now,
    };
    const methodId = id ?? await ctx.db.insert('paymentMethods', { ...normalized, createdAt: now });
    if (id) {
      if (!(await ctx.db.get(id))) throw new Error('Payment method not found');
      await ctx.db.patch(id, normalized);
    }
    await logAudit(ctx, ownerId, id ? 'billing.method.update' : 'billing.method.create', 'paymentMethods', methodId, normalized.nameEn);
    return methodId;
  },
});

export const setPlanActive = mutation({
  args: { id: v.id('subscriptionPlans'), isActive: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error('Plan not found');
    await ctx.db.patch(row._id, { isActive: args.isActive, updatedAt: Date.now() });
    await logAudit(ctx, ownerId, 'billing.plan.visibility', 'subscriptionPlans', row._id, `${row.planKey} · ${args.isActive}`);
    return null;
  },
});

export const setMethodActive = mutation({
  args: { id: v.id('paymentMethods'), isActive: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error('Payment method not found');
    await ctx.db.patch(row._id, { isActive: args.isActive, updatedAt: Date.now() });
    await logAudit(ctx, ownerId, 'billing.method.visibility', 'paymentMethods', row._id, `${row.nameEn} · ${args.isActive}`);
    return null;
  },
});

export const reviewPaymentRequest = mutation({
  args: {
    id: v.id('paymentRequests'),
    decision: v.union(v.literal('approved'), v.literal('rejected')),
    note: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error('Payment request not found');
    if (row.status !== 'pending') throw new Error('Payment request was already reviewed');
    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: args.decision,
      reviewedBy: ownerId,
      reviewedAt: now,
      reviewNote: args.note?.trim(),
      updatedAt: now,
    });
    if (args.decision === 'approved') {
      const plan = row.planId
        ? await ctx.db.get(row.planId)
        : (await ctx.db
          .query('subscriptionPlans')
          .withIndex('by_plan_key', (q) => q.eq('planKey', row.planKey))
          .take(10))
          .find((candidate) => candidate.amount === row.amount && candidate.currency === row.currency);
      if (!plan) throw new Error('Subscription plan no longer exists');
      const existing = await ctx.db
        .query('subscriptions')
        .withIndex('by_user', (q) => q.eq('userId', row.userId))
        .unique();
      const periodMs = plan.interval === 'year' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const patch = {
        planKey: row.planKey,
        status: 'active' as const,
        provider: 'manual_verified',
        currentPeriodEnd: now + periodMs,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      };
      if (existing) await ctx.db.patch(existing._id, patch);
      else await ctx.db.insert('subscriptions', { userId: row.userId, ...patch, createdAt: now });
    }
    await logAudit(ctx, ownerId, `billing.request.${args.decision}`, 'paymentRequests', row._id, `${row.planKey} · ${row.amount} ${row.currency}`);
    return { ok: true };
  },
});
