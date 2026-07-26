import { v } from 'convex/values';
import { query } from './_generated/server';
import { ownChild, requireUser } from './lib/auth';
import { requireFeature } from './lib/entitlements';

function isoDate(value: number): string {
  return new Date(value).toISOString().slice(0, 10);
}

export const childSummary = query({
  args: { childId: v.id('children'), asOf: v.number() },
  returns: v.object({
    childNickname: v.string(),
    birthDate: v.string(),
    periodStart: v.string(),
    periodEnd: v.string(),
    strengthsMm: v.array(v.string()),
    strengthsEn: v.array(v.string()),
    emergingMm: v.array(v.string()),
    emergingEn: v.array(v.string()),
    completedActivitiesMm: v.array(v.string()),
    completedActivitiesEn: v.array(v.string()),
    parentNotes: v.array(v.string()),
    questionsForProfessional: v.array(v.string()),
    latestResultState: v.union(
      v.literal('green'),
      v.literal('yellow'),
      v.literal('orange'),
      v.literal('red'),
      v.null(),
    ),
    growthSummaryMm: v.union(v.string(), v.null()),
    growthSummaryEn: v.union(v.string(), v.null()),
    sleepSummaryMm: v.union(v.string(), v.null()),
    sleepSummaryEn: v.union(v.string(), v.null()),
    nextAppointmentAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, { childId, asOf }) => {
    const userId = await requireUser(ctx);
    await requireFeature(ctx, userId, 'advanced_reports');
    await ownChild(ctx, childId, userId);
    const child = await ctx.db.get(childId);
    if (!child) throw new Error('Not found');

    const end = asOf;
    const start = end - 30 * 86_400_000;
    const sessions = await ctx.db
      .query('milestoneSessions')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .take(20);
    const latest = sessions[0] ?? null;
    const responses = latest
      ? await ctx.db
        .query('milestoneResponses')
        .withIndex('by_session', (q) => q.eq('sessionId', latest._id))
        .take(100)
      : [];
    const growth = await ctx.db
      .query('growthRecords')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .take(2);
    const sleep = await ctx.db
      .query('sleepRecords')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .take(14);
    const completions = await ctx.db
      .query('activityCompletions')
      .withIndex('by_child_and_completed_at', (q) => q.eq('childId', childId).gte('completedAt', start))
      .order('desc')
      .take(50);
    const appointments = await ctx.db
      .query('appointments')
      .withIndex('by_child_and_appointment_at', (q) => q.eq('childId', childId).gte('appointmentAt', end))
      .order('asc')
      .take(10);

    const activityRows = await Promise.all(completions.slice(0, 10).map(async (completion) => {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', completion.contentSlug))
        .unique();
      return content ? { mm: content.titleMm, en: content.titleEn } : null;
    }));
    const parentNotes = [
      ...responses.map((response) => response.note),
      ...completions.map((completion) => completion.note),
    ].filter((note): note is string => Boolean(note?.trim())).slice(0, 12);
    const questionsForProfessional = appointments
      .map((appointment) => appointment.questions)
      .filter((question): question is string => Boolean(question?.trim()))
      .flatMap((question) => question.split('\n').map((line) => line.trim()).filter(Boolean))
      .slice(0, 12);
    const strengths = responses.filter((response) => response.answer === 'yes' || response.answer === 'sometimes');
    const emerging = responses.filter((response) => response.answer === 'not_yet' || response.answer === 'not_sure');
    const latestGrowth = growth[0];
    const growthPartsMm = latestGrowth
      ? [
        latestGrowth.weightKg ? `ကိုယ်အလေးချိန် ${latestGrowth.weightKg} ကီလိုဂရမ်` : null,
        latestGrowth.heightCm ? `အရပ် ${latestGrowth.heightCm} စင်တီမီတာ` : null,
      ].filter(Boolean)
      : [];
    const growthPartsEn = latestGrowth
      ? [
        latestGrowth.weightKg ? `Weight ${latestGrowth.weightKg} kg` : null,
        latestGrowth.heightCm ? `Height ${latestGrowth.heightCm} cm` : null,
      ].filter(Boolean)
      : [];
    const averageNap = sleep.length
      ? Math.round(sleep.reduce((total, row) => total + row.napMinutes, 0) / sleep.length)
      : null;

    return {
      childNickname: child.nickname,
      birthDate: child.birthDate,
      periodStart: isoDate(start),
      periodEnd: isoDate(end),
      strengthsMm: strengths.map((response) => response.titleMm ?? response.milestoneKey),
      strengthsEn: strengths.map((response) => response.titleEn ?? response.milestoneKey),
      emergingMm: emerging.map((response) => response.titleMm ?? response.milestoneKey),
      emergingEn: emerging.map((response) => response.titleEn ?? response.milestoneKey),
      completedActivitiesMm: activityRows.flatMap((row) => row ? [row.mm] : []),
      completedActivitiesEn: activityRows.flatMap((row) => row ? [row.en] : []),
      parentNotes,
      questionsForProfessional,
      latestResultState: latest?.resultState ?? null,
      growthSummaryMm: growthPartsMm.length ? `နောက်ဆုံးမှတ်တမ်း — ${growthPartsMm.join('၊ ')}။` : null,
      growthSummaryEn: growthPartsEn.length ? `Latest record — ${growthPartsEn.join(', ')}.` : null,
      sleepSummaryMm: averageNap === null ? null : `လတ်တလော ${sleep.length} ရက်အတွင်း နေ့ခင်းအိပ်ချိန် ပျမ်းမျှ ${averageNap} မိနစ်။`,
      sleepSummaryEn: averageNap === null ? null : `Average daytime sleep over ${sleep.length} recent records: ${averageNap} minutes.`,
      nextAppointmentAt: appointments[0]?.appointmentAt ?? null,
    };
  },
});
