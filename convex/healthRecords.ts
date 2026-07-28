import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ownChild, requireUser } from './lib/auth';

const optionalText = (value: string | undefined): string | undefined => value?.trim() || undefined;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const healthCategory = v.union(
  v.literal('visit'),
  v.literal('illness'),
  v.literal('test'),
  v.literal('allergy'),
  v.literal('note'),
);
const vaccineStatus = v.union(v.literal('scheduled'), v.literal('completed'), v.literal('missed'));

const healthValidator = v.object({
  _id: v.id('healthRecords'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  recordDate: v.string(),
  category: healthCategory,
  title: v.string(),
  providerName: v.optional(v.string()),
  details: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
});

const vaccinationValidator = v.object({
  _id: v.id('vaccinationRecords'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  vaccineName: v.string(),
  doseLabel: v.optional(v.string()),
  scheduledOn: v.optional(v.string()),
  administeredOn: v.optional(v.string()),
  status: vaccineStatus,
  providerName: v.optional(v.string()),
  facilityName: v.optional(v.string()),
  lotNumber: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
});

const medicationValidator = v.object({
  _id: v.id('medicationRecords'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  medicineName: v.string(),
  purpose: v.optional(v.string()),
  dose: v.optional(v.string()),
  frequency: v.optional(v.string()),
  route: v.optional(v.string()),
  startedOn: v.string(),
  endedOn: v.optional(v.string()),
  lastGivenAt: v.optional(v.number()),
  prescribedBy: v.optional(v.string()),
  notes: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
});

function requireIsoDate(value: string, label: string): string {
  if (!isoDatePattern.test(value)) throw new Error(`${label} must be YYYY-MM-DD`);
  return value;
}

export const listForChild = query({
  args: { childId: v.id('children') },
  returns: v.object({
    health: v.array(healthValidator),
    vaccinations: v.array(vaccinationValidator),
    medications: v.array(medicationValidator),
  }),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, childId, userId);
    const [health, vaccinations, medications] = await Promise.all([
      ctx.db.query('healthRecords').withIndex('by_child_and_record_date', (q) => q.eq('childId', childId)).order('desc').take(200),
      ctx.db.query('vaccinationRecords').withIndex('by_child_and_scheduled_on', (q) => q.eq('childId', childId)).order('desc').take(200),
      ctx.db.query('medicationRecords').withIndex('by_child_and_started_on', (q) => q.eq('childId', childId)).order('desc').take(200),
    ]);
    return {
      health: health.filter((row) => row.deletedAt === undefined),
      vaccinations: vaccinations.filter((row) => row.deletedAt === undefined),
      medications: medications.filter((row) => row.deletedAt === undefined),
    };
  },
});

export const saveHealth = mutation({
  args: {
    id: v.optional(v.id('healthRecords')),
    childId: v.id('children'),
    recordDate: v.string(),
    category: healthCategory,
    title: v.string(),
    providerName: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  returns: v.id('healthRecords'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const child = await ownChild(ctx, args.childId, userId);
    const title = args.title.trim();
    if (!title) throw new Error('Health record title is required');
    const now = Date.now();
    const patch = {
      childId: args.childId,
      recordDate: requireIsoDate(args.recordDate, 'Record date'),
      category: args.category,
      title,
      providerName: optionalText(args.providerName),
      details: optionalText(args.details),
      updatedAt: now,
    };
    if (args.id) {
      const row = await ctx.db.get(args.id);
      if (!row || row.childId !== args.childId || row.deletedAt !== undefined) throw new Error('Health record not found');
      await ownChild(ctx, row.childId, userId);
      await ctx.db.patch(args.id, patch);
      return args.id;
    }
    return await ctx.db.insert('healthRecords', { ...patch, userId: child.userId, createdAt: now });
  },
});

export const saveVaccination = mutation({
  args: {
    id: v.optional(v.id('vaccinationRecords')),
    childId: v.id('children'),
    vaccineName: v.string(),
    doseLabel: v.optional(v.string()),
    scheduledOn: v.optional(v.string()),
    administeredOn: v.optional(v.string()),
    status: vaccineStatus,
    providerName: v.optional(v.string()),
    facilityName: v.optional(v.string()),
    lotNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id('vaccinationRecords'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const child = await ownChild(ctx, args.childId, userId);
    const vaccineName = args.vaccineName.trim();
    if (!vaccineName) throw new Error('Vaccine name is required');
    if (args.scheduledOn) requireIsoDate(args.scheduledOn, 'Scheduled date');
    if (args.administeredOn) requireIsoDate(args.administeredOn, 'Administered date');
    if (args.status === 'completed' && !args.administeredOn) throw new Error('Administered date is required for a completed vaccination');
    const now = Date.now();
    const patch = {
      childId: args.childId,
      vaccineName,
      doseLabel: optionalText(args.doseLabel),
      scheduledOn: args.scheduledOn || undefined,
      administeredOn: args.administeredOn || undefined,
      status: args.status,
      providerName: optionalText(args.providerName),
      facilityName: optionalText(args.facilityName),
      lotNumber: optionalText(args.lotNumber),
      notes: optionalText(args.notes),
      updatedAt: now,
    };
    if (args.id) {
      const row = await ctx.db.get(args.id);
      if (!row || row.childId !== args.childId || row.deletedAt !== undefined) throw new Error('Vaccination record not found');
      await ownChild(ctx, row.childId, userId);
      await ctx.db.patch(args.id, patch);
      return args.id;
    }
    return await ctx.db.insert('vaccinationRecords', { ...patch, userId: child.userId, createdAt: now });
  },
});

export const saveMedication = mutation({
  args: {
    id: v.optional(v.id('medicationRecords')),
    childId: v.id('children'),
    medicineName: v.string(),
    purpose: v.optional(v.string()),
    dose: v.optional(v.string()),
    frequency: v.optional(v.string()),
    route: v.optional(v.string()),
    startedOn: v.string(),
    endedOn: v.optional(v.string()),
    lastGivenAt: v.optional(v.number()),
    prescribedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  },
  returns: v.id('medicationRecords'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const child = await ownChild(ctx, args.childId, userId);
    const medicineName = args.medicineName.trim();
    if (!medicineName) throw new Error('Medicine name is required');
    requireIsoDate(args.startedOn, 'Start date');
    if (args.endedOn) requireIsoDate(args.endedOn, 'End date');
    const now = Date.now();
    const patch = {
      childId: args.childId,
      medicineName,
      purpose: optionalText(args.purpose),
      dose: optionalText(args.dose),
      frequency: optionalText(args.frequency),
      route: optionalText(args.route),
      startedOn: args.startedOn,
      endedOn: args.endedOn || undefined,
      lastGivenAt: args.lastGivenAt,
      prescribedBy: optionalText(args.prescribedBy),
      notes: optionalText(args.notes),
      isActive: args.isActive,
      updatedAt: now,
    };
    if (args.id) {
      const row = await ctx.db.get(args.id);
      if (!row || row.childId !== args.childId || row.deletedAt !== undefined) throw new Error('Medication record not found');
      await ownChild(ctx, row.childId, userId);
      await ctx.db.patch(args.id, patch);
      return args.id;
    }
    return await ctx.db.insert('medicationRecords', { ...patch, userId: child.userId, createdAt: now });
  },
});

export const removeHealth = mutation({
  args: { id: v.id('healthRecords') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Health record not found');
    await ownChild(ctx, row.childId, userId);
    await ctx.db.patch(id, { deletedAt: Date.now(), updatedAt: Date.now() });
    return null;
  },
});

export const removeVaccination = mutation({
  args: { id: v.id('vaccinationRecords') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Vaccination record not found');
    await ownChild(ctx, row.childId, userId);
    await ctx.db.patch(id, { deletedAt: Date.now(), updatedAt: Date.now() });
    return null;
  },
});

export const removeMedication = mutation({
  args: { id: v.id('medicationRecords') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Medication record not found');
    await ownChild(ctx, row.childId, userId);
    await ctx.db.patch(id, { deletedAt: Date.now(), updatedAt: Date.now() });
    return null;
  },
});
