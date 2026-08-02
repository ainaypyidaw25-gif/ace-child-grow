import { describe, expect, it } from 'vitest';
import {
  buildDownloadPlan,
  countByType,
  filterOfflineRecords,
  formatBytes,
  isDownloadable,
  selectDownloadable,
  toOfflineRecord,
  totalBytes,
  type LibraryRowLike,
} from '../offline/offlineLibrary';

const row = (over: Partial<LibraryRowLike> = {}): LibraryRowLike => ({
  _id: 'id_guide_sleep',
  slug: 'guide_sleep',
  type: 'guide',
  clinicalStatus: 'published',
  titleMm: 'အိပ်စက်ခြင်း',
  titleEn: 'Sleep',
  summaryEn: 'How toddlers sleep.',
  tags: ['sleep'],
  ageGroupKey: '1y',
  data: { body: { mm: 'က', en: 'a' } },
  ...over,
});

describe('what may be stored offline', () => {
  it('accepts published content', () => {
    expect(isDownloadable(row())).toBe(true);
  });

  it.each(['draft', 'clinical_review', 'archived'])('refuses %s content', (status) => {
    expect(isDownloadable(row({ clinicalStatus: status }))).toBe(false);
  });

  it('drops every non-published row when selecting a download set', () => {
    const records = selectDownloadable([
      row({ slug: 'a', clinicalStatus: 'published' }),
      row({ slug: 'b', clinicalStatus: 'clinical_review' }),
      row({ slug: 'c', clinicalStatus: 'draft' }),
    ], 1000);
    expect(records.map((r) => r.slug)).toEqual(['a']);
  });

  it('keeps the bilingual payload the reading screens need', () => {
    const record = toOfflineRecord(row(), 42);
    expect(record.titleMm).toBe('အိပ်စက်ခြင်း');
    expect(record.titleEn).toBe('Sleep');
    expect(record.data).toEqual({ body: { mm: 'က', en: 'a' } });
    expect(record.savedAt).toBe(42);
  });

  it('leaves absent optional fields absent, and always gives tags an array', () => {
    const record = toOfflineRecord({
      _id: 'id_s', slug: 's', type: 'story', clinicalStatus: 'published', titleMm: 'မ', titleEn: 'S',
    }, 1);
    expect(record.tags).toEqual([]);
    expect(record.summaryMm).toBeUndefined();
    expect(record.data).toEqual({});
  });
});

describe('refreshing a download', () => {
  it('removes content that is no longer published', () => {
    // A reviewer withdrew guide_old; a device holding it must drop it.
    const plan = buildDownloadPlan(
      selectDownloadable([row({ slug: 'guide_new' })], 2),
      [{ slug: 'guide_new', savedAt: 1 }, { slug: 'guide_old', savedAt: 1 }],
    );
    expect(plan.remove).toEqual(['guide_old']);
    expect(plan.put.map((r) => r.slug)).toEqual(['guide_new']);
  });

  it('reports how many were already held', () => {
    const plan = buildDownloadPlan(selectDownloadable([row({ slug: 'a' })], 2), [{ slug: 'a', savedAt: 1 }]);
    expect(plan.unchanged).toBe(1);
  });

  it('removes nothing on a first download', () => {
    const plan = buildDownloadPlan(selectDownloadable([row()], 1), []);
    expect(plan.remove).toEqual([]);
  });
});

describe('reading the downloaded copy', () => {
  const records = selectDownloadable([
    row({ slug: 'guide_a', type: 'guide', ageGroupKey: '1y', titleEn: 'Bedtime' }),
    row({ slug: 'guide_b', type: 'guide', ageGroupKey: '2y', titleEn: 'Tantrums' }),
    row({ slug: 'act_c', type: 'activity', ageGroupKey: '1y', titleEn: 'Stacking' }),
  ], 1);

  it('filters by type', () => {
    expect(filterOfflineRecords(records, { type: 'activity' }).map((r) => r.slug)).toEqual(['act_c']);
  });

  it('filters by age group, like the server query does', () => {
    expect(filterOfflineRecords(records, { type: 'guide', ageGroupKey: '2y' }).map((r) => r.slug))
      .toEqual(['guide_b']);
  });

  it('searches titles and tags', () => {
    expect(filterOfflineRecords(records, { type: 'guide', q: 'tantrum' }).map((r) => r.slug))
      .toEqual(['guide_b']);
  });

  it('returns a stable order', () => {
    expect(filterOfflineRecords(records, { type: 'guide' }).map((r) => r.slug)).toEqual(['guide_a', 'guide_b']);
  });
});

describe('storage reporting', () => {
  it('counts by type', () => {
    expect(countByType([{ type: 'guide' }, { type: 'guide' }, { type: 'story' }]))
      .toEqual({ guide: 2, story: 1 });
  });

  it('sums a non-zero size for stored records', () => {
    expect(totalBytes(selectDownloadable([row()], 1))).toBeGreaterThan(0);
  });

  it('formats sizes for the storage line', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
