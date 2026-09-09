import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';
import { canonicalJson, sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  GD10_12M_PLAY_V5_CONTENT_PREIMAGE,
  GD10_12M_PLAY_V5_DESIRED_CONTENT,
  GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS,
  GD10_12M_PLAY_V5_FIXTURE_SHA256,
  GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS,
  GD10_12M_PLAY_V5_LINK_PREIMAGE,
  GD10_12M_PLAY_V5_PREIMAGES,
  GD10_12M_PLAY_V5_REQUIRED_REVIEWS,
  GD10_12M_PLAY_V5_REVERSE_PREIMAGES,
  GD10_12M_PLAY_V5_REVIEW_PREIMAGES,
  GD10_12M_PLAY_V5_SOURCE_PREIMAGES,
  isGd10_12mPlayV5ContentSlug,
  isGd10_12mPlayV5Link,
  isGd10_12mPlayV5Source,
} from '../../../convex/lib/gd10_12mPlayV5CasData';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';

describe('gd_10_12m_play v5 exact CAS data', () => {
  it('freezes the complete Production preimage and fixture bytes', async () => {
    const fixturePath = resolve(
      process.cwd(),
      'convex/lib/gd10_12mPlayV5CasPreimages.json',
    );
    expect(createHash('sha256').update(readFileSync(fixturePath)).digest('hex'))
      .toBe(GD10_12M_PLAY_V5_FIXTURE_SHA256);
    expect(await sha256Canonical(GD10_12M_PLAY_V5_CONTENT_PREIMAGE.document))
      .toBe(GD10_12M_PLAY_V5_CONTENT_PREIMAGE.exactCanonicalSha256);
    expect(await sha256Canonical(GD10_12M_PLAY_V5_LINK_PREIMAGE.document))
      .toBe(GD10_12M_PLAY_V5_LINK_PREIMAGE.exactCanonicalSha256);
    for (const source of GD10_12M_PLAY_V5_SOURCE_PREIMAGES) {
      expect(await sha256Canonical(source.document), source.sourceId)
        .toBe(source.exactCanonicalSha256);
    }
    for (const review of GD10_12M_PLAY_V5_REVIEW_PREIMAGES) {
      expect(await sha256Canonical(review.document), review.rowId)
        .toBe(review.exactCanonicalSha256);
    }
    expect(GD10_12M_PLAY_V5_PREIMAGES.media).toEqual([]);
    expect(GD10_12M_PLAY_V5_PREIMAGES.ai).toEqual({
      contentAudits: [], evidenceAudits: [], releases: [], runs: [],
    });
    expect(GD10_12M_PLAY_V5_PREIMAGES.releaseAudits).toEqual([]);
  });

  it('keeps authored, generated, and evidence registries on the exact postimage', () => {
    const authored = CONTENT_SEED.find((row) => row.slug === 'gd_10_12m_play');
    const generated = (seedData as Array<{ slug: string }>).find(
      (row) => row.slug === 'gd_10_12m_play',
    );
    const link = EVIDENCE_LINKS.find((row) =>
      row.kind === 'guide' && row.slug === 'gd_10_12m_play');
    expect(canonicalJson(authored)).toBe(canonicalJson(GD10_12M_PLAY_V5_DESIRED_CONTENT));
    expect(canonicalJson(generated)).toBe(canonicalJson(GD10_12M_PLAY_V5_DESIRED_CONTENT));
    expect(link?.sourceIds).toEqual(GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS);
    expect(GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS).toEqual([
      'aap-power-of-play-2018',
      'who-care-for-child-development-2012',
      'unicef-early-moments-2017',
      'tb-bright-futures-4e-2017',
      'aap-drowning-2021',
      'aap-safe-sleep-2022',
    ]);
  });

  it('uses bounded direct-source copy and requires six fresh reviews', () => {
    const text = JSON.stringify(GD10_12M_PLAY_V5_DESIRED_CONTENT);
    expect(text).toContain('move climbable furniture away from windows');
    expect(text).toContain('not emergency-treatment thresholds');
    expect(text).toContain('constant, attentive supervision');
    expect(text).not.toMatch(/loss of consciousness|unusual drowsiness/i);
    expect(text).not.toMatch(/swallowed button battery or magnet/i);
    expect(text).not.toContain('Tie blind cords high');
    expect(text).not.toContain('aap-safe-sleep-2022');
    expect(GD10_12M_PLAY_V5_REQUIRED_REVIEWS).toEqual([
      'native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical',
    ]);
    expect(GD10_12M_PLAY_V5_SOURCE_PREIMAGES.every((row) => (
      (row.document as { reviewStatus?: string }).reviewStatus === 'approved'
    ))).toBe(true);
  });

  it('freezes all eight source reverse dependency sets', () => {
    expect(GD10_12M_PLAY_V5_REVERSE_PREIMAGES.map((row) => ({
      sourceId: row.sourceId,
      count: row.count,
      canonicalSha256: row.canonicalSha256,
    }))).toEqual([
      { sourceId: 'aap-power-of-play-2018', count: 96, canonicalSha256: '27f81cd95af69c573eb327a5a2d09e262dd748a993ebf80a34c39117e834353c' },
      { sourceId: 'who-care-for-child-development-2012', count: 83, canonicalSha256: 'dde3d4f69a12e2e322a187afbb37fe24198bbf779f52b20a2186a286aa2d17a2' },
      { sourceId: 'unicef-early-moments-2017', count: 4, canonicalSha256: 'ea8d87d00eb26d5a996f46a1f4ea2a2a5da47f63a7caa34f994b832f84063a98' },
      { sourceId: 'tb-bright-futures-4e-2017', count: 94, canonicalSha256: 'da88cca719cc2905b76dd6bac06cbd8230c297de2e2a9aec0056357d56a62b9d' },
      { sourceId: 'aap-drowning-2021', count: 24, canonicalSha256: '7c56850b982f31a488627b79d0aa697960400c59b2fdbf3f24347190961ef784' },
      { sourceId: 'aap-safe-sleep-2022', count: 44, canonicalSha256: '11b7fd39ad77c603f8ce80631f526480ada63aed68a1e5ddcfd4223eaec38557' },
      { sourceId: 'cpsc-childproofing-home-2023', count: 1, canonicalSha256: '34e66086ae3cd3db141ba1911f41b8a1475447bc40f7074eb6afe42163ef7ef7' },
      { sourceId: 'hc-choking-prevention-2026', count: 8, canonicalSha256: 'b41e56e4ae6c383575057b2b253d0102d969a4953397dab5dfbd49fdc6b95945' },
    ]);
  });

  it('exposes exact durable import guards only for this release scope', () => {
    expect(isGd10_12mPlayV5ContentSlug('gd_10_12m_play')).toBe(true);
    expect(isGd10_12mPlayV5ContentSlug('gd_10_12m_sleep')).toBe(false);
    expect(isGd10_12mPlayV5Link('guide', 'gd_10_12m_play')).toBe(true);
    expect(isGd10_12mPlayV5Link('milestone', 'gd_10_12m_play')).toBe(false);
    for (const sourceId of [...GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS,
      ...GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS]) {
      expect(isGd10_12mPlayV5Source(sourceId), sourceId).toBe(true);
    }
    expect(isGd10_12mPlayV5Source('cdc-milestones-2026')).toBe(false);
  });
});
