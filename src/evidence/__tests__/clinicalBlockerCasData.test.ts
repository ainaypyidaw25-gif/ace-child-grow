import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { requiredPublicationReviews } from '../../../convex/lib/contentReviewRequirements';
import { seedRunSkipsItem } from '../../../convex/seed';
import {
  CLINICAL_BLOCKER_FIXTURE_SHA256,
  GD_BIRTH2M_EMOTIONAL_CONTENT_PREIMAGE,
  GD_BIRTH2M_EMOTIONAL_DESIRED_DATA,
  GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT,
  GD_BIRTH2M_EMOTIONAL_LINK_PREIMAGE,
  GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
  GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS,
  GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_TARGET,
  NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
  UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES,
  UNICEF_SEEN_COUNTED_DESIRED_METADATA,
  UNICEF_SEEN_COUNTED_LINK_PREIMAGES,
  UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES,
  UNICEF_SEEN_COUNTED_REVERSE_KEYS,
  UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES,
  UNICEF_SEEN_COUNTED_SOURCE_ID,
  UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE,
  isClinicalBlockerCasSource,
  isGdBirth2mEmotionalCasContentSlug,
  isGdBirth2mEmotionalCasLink,
  isUnicefSeenCountedConsumer,
  isUnicefSeenCountedConsumerSlug,
} from '../../../convex/lib/clinicalBlockerCasData';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';
import { SOURCE_BY_ID } from '../sources';

describe('clinical blocker exact CAS data', () => {
  it('pins every captured Production document and the frozen artifact bytes', async () => {
    const fixturePath = resolve(
      process.cwd(),
      'convex/lib/clinicalBlockerCasPreimages.json',
    );
    expect(createHash('sha256').update(readFileSync(fixturePath)).digest('hex'))
      .toBe(CLINICAL_BLOCKER_FIXTURE_SHA256);
    for (const expected of [
      GD_BIRTH2M_EMOTIONAL_CONTENT_PREIMAGE,
      GD_BIRTH2M_EMOTIONAL_LINK_PREIMAGE,
      ...GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES,
      ...GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES,
      UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE,
      ...UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES,
      ...UNICEF_SEEN_COUNTED_LINK_PREIMAGES,
      ...UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES,
      ...UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES,
    ]) {
      expect(await sha256Canonical(expected.document), expected.rowId)
        .toBe(expected.exactCanonicalSha256);
    }
  });

  it('keeps the authored guide, generated seed and exact evidence edge aligned', () => {
    expect(GD_BIRTH2M_EMOTIONAL_RELEASE_ID)
      .toBe('2026-08-23-birth-2m-emotional-tier-evidence-v1');
    const item = CONTENT_SEED.find((candidate) =>
      candidate.slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug);
    const generated = (seedData as Array<{ slug: string; data: unknown; searchText: string }>)
      .find((candidate) => candidate.slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug);
    expect(item?.data).toEqual(GD_BIRTH2M_EMOTIONAL_DESIRED_DATA);
    expect(item?.searchText).toBe(GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT);
    expect(generated?.data).toEqual(GD_BIRTH2M_EMOTIONAL_DESIRED_DATA);
    expect(generated?.searchText).toBe(GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT);
    const link = EVIDENCE_LINKS.find((candidate) =>
      candidate.kind === GD_BIRTH2M_EMOTIONAL_TARGET.kind
        && candidate.slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug);
    expect(link?.sourceIds).toEqual(GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds);
    expect(link?.sourceIds).not.toContain('nhs-child-accident-2025');
  });

  it('does not make vomiting or refusing feeds alone universally emergency', () => {
    const faq = GD_BIRTH2M_EMOTIONAL_DESIRED_DATA.faq as Array<{
      a: { en: string; mm: string };
    }>;
    expect(faq[1].a.en).toContain('contact a health professional urgently');
    expect(faq[1].a.en).toContain('Call emergency services now if');
    expect(faq[1].a.en).toContain('repeatedly projectile vomiting');
    expect(faq[1].a.en).not.toContain(
      'vomiting or not interested in feeding, call emergency services',
    );
    const item = CONTENT_SEED.find((candidate) =>
      candidate.slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug)!;
    expect(new Set(requiredPublicationReviews(item))).toEqual(
      new Set(GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS),
    );
  });

  it('authors the NHS source awaiting review and corrects the stable UNICEF id to 2021', () => {
    const nhs = SOURCE_BY_ID.get(NHS_SOOTHING_CRYING_BABY_SOURCE_ID);
    expect(nhs).toMatchObject({
      title: 'Soothing a crying baby',
      year: 2026,
      reviewStatus: 'awaiting_review',
      verifiedOn: '2026-08-23',
    });
    expect(nhs?.verifiedNote).toContain('repeated projectile vomiting');
    const unicef = SOURCE_BY_ID.get(UNICEF_SEEN_COUNTED_SOURCE_ID);
    expect(unicef).toMatchObject(UNICEF_SEEN_COUNTED_DESIRED_METADATA);
    expect(unicef?.id).toBe('unicef-seen-counted-included-2022');
    expect(unicef?.verifiedNote).toContain('UNICEF, New York, 2021');
  });

  it('freezes exactly two UNICEF reverse consumers without changing lesson revision 2', () => {
    expect(UNICEF_SEEN_COUNTED_REVERSE_KEYS).toEqual([
      'lesson:lsn_special_needs_awareness',
      'special_need:sn_learning_disability',
    ]);
    expect(UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES.find((row) =>
      row.document.slug === 'lsn_special_needs_awareness')?.document.reviewRevision).toBe(2);
    expect(UNICEF_SEEN_COUNTED_LINK_PREIMAGES.map((row) =>
      `${String(row.document.kind)}:${String(row.document.slug)}`)).toEqual(
      UNICEF_SEEN_COUNTED_REVERSE_KEYS,
    );
  });

  it('guards only the bounded source, link and content units', () => {
    expect(isGdBirth2mEmotionalCasContentSlug('gd_birth_2m_emotional')).toBe(true);
    expect(isGdBirth2mEmotionalCasContentSlug('gd_birth_2m_social')).toBe(false);
    expect(isGdBirth2mEmotionalCasLink('guide', 'gd_birth_2m_emotional')).toBe(true);
    expect(isGdBirth2mEmotionalCasLink('lesson', 'gd_birth_2m_emotional')).toBe(false);
    expect(isClinicalBlockerCasSource(NHS_SOOTHING_CRYING_BABY_SOURCE_ID)).toBe(true);
    expect(isClinicalBlockerCasSource(UNICEF_SEEN_COUNTED_SOURCE_ID)).toBe(true);
    expect(isClinicalBlockerCasSource('who-nurturing-care-2018')).toBe(false);
    expect(isUnicefSeenCountedConsumer('lesson', 'lsn_special_needs_awareness')).toBe(true);
    expect(isUnicefSeenCountedConsumer('guide', 'lsn_special_needs_awareness')).toBe(false);
    expect(isUnicefSeenCountedConsumerSlug('sn_learning_disability')).toBe(true);
    expect(isUnicefSeenCountedConsumerSlug('sn_autism')).toBe(false);
    expect(seedRunSkipsItem({ type: 'guide', slug: 'gd_birth_2m_emotional' })).toBe(true);
    expect(seedRunSkipsItem({ type: 'lesson', slug: 'lsn_special_needs_awareness' })).toBe(true);
    expect(seedRunSkipsItem({ type: 'special_need', slug: 'sn_learning_disability' })).toBe(true);
    expect(seedRunSkipsItem({ type: 'guide', slug: 'gd_birth_2m_social' })).toBe(false);
  });
});
