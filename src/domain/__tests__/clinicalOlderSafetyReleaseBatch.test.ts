import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';

import type { Doc } from '../../../convex/_generated/dataModel';
import { snapshotFields } from '../../../convex/clinicalReviewBatch';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
  CLINICAL_NUTRITION_RELEASE_BATCH_ID,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_HASH,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_MANIFEST,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

const EMPTY_ARRAY_SHA256 = '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';
const EMPTY_AI_SHA256 = 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d';

const pair = (mm: string, en: string) => ({ mm, en });

function safetySnapshotContent(): Doc<'libraryContent'> {
  return {
    _id: 'content-safety-snapshot',
    _creationTime: 1,
    type: 'guide',
    slug: 'gd_safety_snapshot',
    domainKey: 'safety',
    titleMm: 'ဘေးကင်းရေး လမ်းညွှန်',
    titleEn: 'Safety guide',
    tags: ['safety'],
    data: {
      why: pair('အရေးကြီးသည်။', 'It matters.'),
      observationQuestions: [pair('စောင့်ကြည့်ပါ။', 'Observe.')],
      dailyActivities: [pair('နေ့စဉ်စစ်ပါ။', 'Check daily.')],
      weeklyActivities: [pair('အပတ်စဉ်စစ်ပါ။', 'Check weekly.')],
      indoor: [pair('အိမ်တွင်းစစ်ပါ။', 'Check indoors.')],
      outdoor: [pair('အပြင်တွင်စစ်ပါ။', 'Check outdoors.')],
      safety: pair('အနီးကပ်စောင့်ကြည့်ပါ။', 'Supervise closely.'),
      parentTips: [pair('အေးဆေးရှင်းပြပါ။', 'Explain calmly.')],
      faq: [{ q: pair('ဘယ်လိုလုပ်မလဲ။', 'What should I do?'), a: pair('စစ်ဆေးပါ။', 'Check it.') }],
      redFlags: [pair('အန္တရာယ်ရှိပါက ရပ်ပါ။', 'Stop if there is danger.')],
      referral: pair('အရေးပေါ်အကူအညီယူပါ။', 'Get emergency help.'),
      encouragement: pair('တဖြည်းဖြည်း လေ့ကျင့်ပါ။', 'Keep practising.'),
    },
    source: 'ACE Child Grow editorial content',
    version: 1,
    reviewRevision: 1,
    clinicalStatus: 'clinical_review',
    searchText: 'safety',
    createdAt: 1,
    updatedAt: 1,
  } as unknown as Doc<'libraryContent'>;
}

describe('frozen older-safety clinical release batch', () => {
  it('snapshots the complete safety-guide shape without inventing generic guide fields', () => {
    const result = snapshotFields(safetySnapshotContent());

    expect(result.blockers).toEqual([]);
    expect(result.fields.map((field) => field.path)).toEqual([
      'data.why',
      'data.observationQuestions',
      'data.dailyActivities',
      'data.weeklyActivities',
      'data.indoor',
      'data.outdoor',
      'data.safety',
      'data.parentTips',
      'data.faq',
      'data.redFlags',
      'data.referral',
      'data.encouragement',
    ]);
    expect(result.fields.map((field) => field.path)).not.toContain('data.materials');
    expect(result.fields.map((field) => field.path)).not.toContain('data.commonMistakes');
  });

  it('builds a complete 12-field snapshot for every exact older-safety seed row', () => {
    for (const item of CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS) {
      const content = (seedData as Array<Record<string, unknown>>).find(
        (row) => row.slug === item.slug,
      );
      expect(content, item.slug).toBeDefined();
      const result = snapshotFields(content as unknown as Doc<'libraryContent'>);
      expect(result.blockers, item.slug).toEqual([]);
      expect(result.fields, item.slug).toHaveLength(12);
      expect(result.fields.map((field) => field.path), item.slug).toContain('data.weeklyActivities');
      expect(result.fields.map((field) => field.path), item.slug).toContain('data.outdoor');
    }
  });

  it('keeps a one-language safety field fail-closed', () => {
    const content = safetySnapshotContent();
    const data = content.data as { outdoor: Array<{ mm: string; en: string }> };
    data.outdoor[0].en = '';

    expect(snapshotFields(content).blockers).toContain('snapshot_field_missing:data.outdoor');
  });

  it('does not weaken the required shape for non-safety guides', () => {
    const content = safetySnapshotContent();
    content.domainKey = 'nutrition';

    expect(snapshotFields(content).blockers).toEqual(expect.arrayContaining([
      'snapshot_field_missing:data.materials',
      'snapshot_field_missing:data.commonMistakes',
    ]));
  });

  it('contains only the nine exact post-CAS guide revisions and regenerated digests', async () => {
    const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
      (entry) => entry.manifest.batchId === CLINICAL_OLDER_SAFETY_RELEASE_BATCH_MANIFEST.batchId,
    );
    if (!registration) throw new Error('Missing older-safety release registration');
    expect(CLINICAL_REVIEW_BATCH_REGISTRY).toHaveLength(6);
    expect(registration).toMatchObject({
      sequence: 5,
      laneGraphVersion: 1,
      dimension: 'clinical',
      authority: 'release',
      activation: {
        kind: 'after_handoff',
        previousBatchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
        expectedPreviousFreezeDigest: CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
      },
    });
    expect(CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS.map((item) => (
      `${item.kind}:${item.slug}@${item.reviewRevision}`
    ))).toEqual([
      'guide:gd_13_18m_safety@7',
      'guide:gd_19_24m_safety@7',
      'guide:gd_2y_safety@7',
      'guide:gd_2_5y_safety@7',
      'guide:gd_3y_safety@6',
      'guide:gd_3_5y_safety@6',
      'guide:gd_4y_safety@6',
      'guide:gd_4_5y_safety@6',
      'guide:gd_5y_safety@6',
    ]);
    expect(await sha256Canonical(CLINICAL_OLDER_SAFETY_RELEASE_BATCH_MANIFEST)).toBe(
      CLINICAL_OLDER_SAFETY_RELEASE_BATCH_HASH,
    );
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration))).toBe(
      CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ROUTING_HASH,
    );
  });

  it('binds the exact reviewer and freezes empty media, AI, and review histories', () => {
    expect(CLINICAL_OLDER_SAFETY_RELEASE_BATCH_MANIFEST.reviewer).toMatchObject({
      profileId: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
      userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
      identityCanonicalSha256: 'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
    });
    for (const item of CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS) {
      expect(item.mediaCount).toBe(0);
      expect(item.mediaCanonicalSha256).toBe(EMPTY_ARRAY_SHA256);
      expect(item.aiCanonicalSha256).toBe(EMPTY_AI_SHA256);
      expect(item.currentClinicalReviewCount).toBe(0);
      expect(item.currentClinicalReviewsCanonicalSha256).toBe(EMPTY_ARRAY_SHA256);
      expect(item.allClinicalReviewHistoryCanonicalSha256).toBe(EMPTY_ARRAY_SHA256);
      expect(item.upstreamReviewDigests).toEqual([
        { dimension: 'all_review_history', digest: EMPTY_ARRAY_SHA256 },
        { dimension: 'all_nonclinical_history', digest: EMPTY_ARRAY_SHA256 },
        { dimension: 'english', digest: EMPTY_ARRAY_SHA256 },
        { dimension: 'native_myanmar', digest: EMPTY_ARRAY_SHA256 },
        { dimension: 'child_development', digest: EMPTY_ARRAY_SHA256 },
        { dimension: 'evidence', digest: EMPTY_ARRAY_SHA256 },
        { dimension: 'safety', digest: EMPTY_ARRAY_SHA256 },
      ]);
    }
  });

  it('surfaces bilingual water, window, anchoring, and age-source cautions', () => {
    for (const item of CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS) {
      const advisory = item.reviewerAdvisory;
      expect(advisory).toBeDefined();
      if (!advisory) throw new Error(`Missing reviewer advisory for ${item.slug}`);
      expect(advisory.mm.trim().length).toBeGreaterThan(40);
      expect(advisory.en.trim().length).toBeGreaterThan(40);
      expect(advisory.en.toLowerCase()).toContain('water');
    }

    const windowItem = CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS[1];
    if (!windowItem) throw new Error('Missing gd_19_24m_safety freeze');
    const windowAdvisory = windowItem.reviewerAdvisory;
    if (!windowAdvisory) throw new Error('Missing gd_19_24m_safety reviewer advisory');
    expect(windowItem.sourceIds).toContain('cpsc-childproofing-home-2023');
    expect(windowAdvisory.en).toContain('four inches');
    expect(windowAdvisory.en.toLowerCase()).toContain('anchor');

    for (const item of CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS.filter(
      (candidate) => candidate.slug !== 'gd_19_24m_safety',
    )) {
      expect(item.sourceIds).not.toContain('cpsc-childproofing-home-2023');
    }
    const fiveYearItem = CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS.find(
      (item) => item.slug === 'gd_5y_safety',
    );
    expect(fiveYearItem?.reviewerAdvisory?.en).toContain('0–60 month');
  });

  it('freezes one unique ordinal, slug, record, link, and digest set per target', () => {
    const items = CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ITEMS;
    for (const key of ['ordinal', 'slug', 'contentId', 'linkId'] as const) {
      expect(new Set(items.map((item) => item[key])).size).toBe(items.length);
    }
    for (const item of items) {
      expect(item.sourceCount).toBe(item.sourceIds.length);
      expect(item.contentCanonicalSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(item.linkCanonicalSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(item.sourcesCanonicalSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(item.contentUpdatedAt).toBe(1787547270890);
      expect(item.linkUpdatedAt).toBe(1787547270890);
    }
  });
});
