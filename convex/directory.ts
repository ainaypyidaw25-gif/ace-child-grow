import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { isStaff, requireStaff } from './lib/auth';
import { logAudit } from './audit';

const facilityValidator = v.object({
  _id: v.id('healthcareFacilities'),
  _creationTime: v.number(),
  country: v.string(),
  region: v.optional(v.string()),
  township: v.optional(v.string()),
  name: v.string(),
  facilityType: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  services: v.optional(v.string()),
  source: v.optional(v.string()),
  lastVerifiedAt: v.optional(v.number()),
  verifiedBy: v.optional(v.id('users')),
  isActive: v.boolean(),
});

// Public directory: ONLY active + source-verified facilities. The active index
// keeps this bounded; optional UI filters run over at most 200 public entries.
export const listPublic = query({
  args: { region: v.optional(v.string()), township: v.optional(v.string()), facilityType: v.optional(v.string()) },
  returns: v.array(facilityValidator),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('healthcareFacilities')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .take(200);
    return rows.filter(
      (row) =>
        (!args.region || row.region === args.region) &&
        (!args.township || row.township === args.township) &&
        (!args.facilityType || row.facilityType === args.facilityType),
    );
  },
});

export const adminList = query({
  args: {},
  returns: v.object({ allowed: v.boolean(), rows: v.array(facilityValidator) }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) return { allowed: false, rows: [] };
    return { allowed: true, rows: await ctx.db.query('healthcareFacilities').take(500) };
  },
});

export const create = mutation({
  args: {
    country: v.string(), region: v.optional(v.string()), township: v.optional(v.string()),
    name: v.string(), facilityType: v.optional(v.string()), phone: v.optional(v.string()),
    address: v.optional(v.string()), services: v.optional(v.string()), source: v.optional(v.string()),
  },
  returns: v.id('healthcareFacilities'),
  handler: async (ctx, args) => {
    const userId = await requireStaff(ctx);
    const id = await ctx.db.insert('healthcareFacilities', { ...args, isActive: false });
    await logAudit(ctx, userId, 'facility.create', 'healthcareFacilities', id, args.name);
    return id;
  },
});

// Verify → marks active + records verifier + timestamp (audited).
export const verify = mutation({
  args: { id: v.id('healthcareFacilities') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireStaff(ctx);
    await ctx.db.patch(id, { isActive: true, verifiedBy: userId, lastVerifiedAt: Date.now() });
    await logAudit(ctx, userId, 'facility.verify', 'healthcareFacilities', id);
    return null;
  },
});

export const deactivate = mutation({
  args: { id: v.id('healthcareFacilities') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireStaff(ctx);
    await ctx.db.patch(id, { isActive: false });
    await logAudit(ctx, userId, 'facility.deactivate', 'healthcareFacilities', id);
    return null;
  },
});

// Deployment-admin-only bootstrap. Each entry was checked against the source
// URL on 2026-07-26; upsert-by-name makes repeated runs deterministic.
export const seedVerifiedSpecialNeedsDirectory = internalMutation({
  args: {},
  returns: v.object({ created: v.number(), updated: v.number(), total: v.number() }),
  handler: async (ctx) => {
    const facilities = [
      {
        country: 'Myanmar', region: 'ရန်ကုန်တိုင်းဒေသကြီး', township: 'အင်းစိန်မြို့နယ်',
        name: 'ဧဒင် မသန်စွမ်းသက်ငယ်များ ပြုစုရာရိပ်မြုံ (ECDC)',
        facilityType: 'အထူးလိုအပ်ချက် ပညာရေးနှင့် ပြန်လည်ထူထောင်ရေးဌာန',
        phone: '09 431 20885, 01 364 0399',
        address: 'အမှတ် (၅၆)၊ ဝါဦးကျောင်း (၄) လမ်း၊ ဖော့ကန်ရပ်ကွက်၊ အင်းစိန်မြို့နယ်၊ ရန်ကုန်တိုင်းဒေသကြီး',
        services: 'အထူးပညာရေး၊ ကိုယ်လက်ပြန်လည်ထူထောင်ရေး၊ မိသားစုအခြေပြုပညာရေးနှင့် မိဘသင်တန်းများ',
        source: 'https://www.edencentre.org/mya',
      },
      {
        country: 'Myanmar', region: 'ရန်ကုန်တိုင်းဒေသကြီး', township: 'မရမ်းကုန်းမြို့နယ်',
        name: 'ရန်ကုန် မျက်မမြင်ကျောင်း (MCFB)',
        facilityType: 'မျက်မမြင်ကလေးများကျောင်း',
        phone: '09 730 24586, 09 796 616107',
        address: 'အမှတ် (၁၆၅)၊ ဗဟိုလမ်း၊ (၂) ရပ်ကွက်၊ မရမ်းကုန်းမြို့နယ်၊ ရန်ကုန်မြို့',
        services: 'စာပေပညာ၊ ပေါင်းစပ်သင်ကြားရေး၊ လက်မှုပညာနှင့် မိဘအသိပညာပေးသင်တန်းများ',
        source: 'https://mcfblind.org/ဆက်သွယ်ရန်/',
      },
      {
        country: 'Myanmar', region: 'ကချင်ပြည်နယ်', township: 'မြစ်ကြီးနားမြို့',
        name: 'မြစ်ကြီးနား မျက်မမြင်ကျောင်း (MCFB)',
        facilityType: 'မျက်မမြင်ကလေးများကျောင်း',
        phone: '074 26097, 09 2401720',
        address: 'အမှတ် (၁/၂၉-၃၀)၊ အေးမြသာယာရပ်၊ မြို့သစ်ကြီးရပ်ကွက်၊ မြစ်ကြီးနားမြို့',
        services: 'မျက်မမြင်ကလေးများအတွက် ပညာရေးနှင့် ဖွံ့ဖြိုးမှုဆိုင်ရာ ပံ့ပိုးမှုများ',
        source: 'https://mcfblind.org/ဆက်သွယ်ရန်/',
      },
      {
        country: 'Myanmar', region: 'ရန်ကုန်တိုင်းဒေသကြီး',
        name: 'မေရီချက်ပ်မင်း နားမကြားကလေးများကျောင်း',
        facilityType: 'နားမကြားကလေးများကျောင်း',
        phone: '09 517 3240',
        address: 'အမှတ် (၂)၊ သံတမန်လမ်း၊ ရန်ကုန်မြို့၊ စာတိုက်အမှတ် ၁၁၁၉၁',
        services: 'နားမကြားနှင့် အကြားအာရုံချို့တဲ့ကလေးများအတွက် နေ့ကျောင်းနှင့် အဆောင်ပညာရေး',
        source: 'https://www.schoolandcollegelistings.com/MM/Yangon/102366421367180/Mary-Chapman-School-for-the-Deaf',
      },
      {
        country: 'Myanmar', region: 'ရန်ကုန်တိုင်းဒေသကြီး', township: 'ဒေါပုံမြို့နယ်',
        name: 'မြန်မာနိုင်ငံ အော်တစ်ဇင်အသင်း',
        facilityType: 'အော်တစ်ဇင်ဆိုင်ရာ မိသားစုပံ့ပိုးရေးအဖွဲ့',
        phone: '09 448 021417, 09 975 744989',
        address: 'အမှတ် ၁၀၀၀/က၊ မာလာနွယ်လမ်း၊ ဗမာအေးရပ်ကွက်၊ ဒေါပုံမြို့နယ်၊ ရန်ကုန်မြို့',
        services: 'အော်တစ်ဇင်ဆိုင်ရာ အသိပညာပေးခြင်းနှင့် မိသားစုများကို ချိတ်ဆက်ပံ့ပိုးခြင်း',
        source: 'https://www.yangondirectory.com/listing/myanmar-autism-association-l00310835.html',
      },
    ];
    const now = Date.now();
    let created = 0;
    let updated = 0;
    for (const facility of facilities) {
      const existing = await ctx.db
        .query('healthcareFacilities')
        .withIndex('by_name', (q) => q.eq('name', facility.name))
        .unique();
      const patch = { ...facility, isActive: true, lastVerifiedAt: now };
      if (existing) {
        await ctx.db.patch(existing._id, patch);
        updated += 1;
      } else {
        await ctx.db.insert('healthcareFacilities', patch);
        created += 1;
      }
    }
    await logAudit(ctx, null, 'facility.verified_seed', 'healthcareFacilities', undefined, `${created} created, ${updated} updated`);
    return { created, updated, total: facilities.length };
  },
});
