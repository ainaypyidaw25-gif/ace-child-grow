// Evidence Base integrity tests.
//
// These are the mechanical guarantees behind the evidence policy. They are not
// style checks — each one fails the build if a rule the clinical policy depends
// on has been broken:
//
//   * no fabricated identifiers (every DOI/ISBN/PMID passes shape + checksum)
//   * no unverified record silently claiming to be usable
//   * no orphan content
//   * no dangling reference id
//   * no duplicate reference
import { describe, it, expect } from 'vitest';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_SOURCES, SOURCE_BY_ID } from '../sources';
import {
  EVIDENCE_LINKS,
  EVIDENCE_LINK_KINDS,
  MILESTONE_DOMAIN_SOURCES,
  SAFETY_RULE_SOURCES,
  buildEvidenceLinks,
  relatedContent,
  sourcesForContent,
  unusedSourceIds,
} from '../links';
import {
  EVIDENCE_LEVELS,
  EVIDENCE_ORG_KEYS,
  EVIDENCE_REVIEW_STATUSES,
  EVIDENCE_TOPICS,
  isDoiShapeValid,
  isHttpsUrl,
  isIsbnValid,
  isPmidShapeValid,
  resolveReviewStatus,
  verificationProblems,
} from '../types';
import { buildReports, contentWithoutReferences, duplicateReferences } from '../reports';

const TODAY = '2026-07-24';

describe('reference registry', () => {
  it('has records and unique ids', () => {
    expect(EVIDENCE_SOURCES.length).toBeGreaterThan(50);
    const ids = EVIDENCE_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only known enum values', () => {
    for (const src of EVIDENCE_SOURCES) {
      expect(EVIDENCE_ORG_KEYS, src.id).toContain(src.orgKey);
      expect(EVIDENCE_LEVELS, src.id).toContain(src.evidenceLevel);
      expect(EVIDENCE_REVIEW_STATUSES, src.id).toContain(src.reviewStatus);
      src.topics.forEach((t) => expect(EVIDENCE_TOPICS, `${src.id}:${t}`).toContain(t));
    }
  });

  it('records a verifiable https url, a verification date and a verification note', () => {
    for (const src of EVIDENCE_SOURCES) {
      expect(isHttpsUrl(src.url), `${src.id} url`).toBe(true);
      expect(src.verifiedOn, `${src.id} verifiedOn`).toBeTruthy();
      expect(src.verifiedNote.trim().length, `${src.id} verifiedNote`).toBeGreaterThan(0);
    }
  });

  // ANTI-FABRICATION: an identifier that does not validate was not read off the
  // page. The correct value is null, never a plausible-looking string.
  it('carries no malformed or invented identifier', () => {
    for (const src of EVIDENCE_SOURCES) {
      if (src.doi !== null) expect(isDoiShapeValid(src.doi), `${src.id} doi ${src.doi}`).toBe(true);
      if (src.isbn !== null) expect(isIsbnValid(src.isbn), `${src.id} isbn ${src.isbn}`).toBe(true);
      if (src.pmid !== null) expect(isPmidShapeValid(src.pmid), `${src.id} pmid ${src.pmid}`).toBe(true);
    }
  });

  it('never claims a year outside a plausible publishing range', () => {
    for (const src of EVIDENCE_SOURCES) {
      if (src.year === null) continue;
      expect(src.year, src.id).toBeGreaterThanOrEqual(1900);
      expect(src.year, src.id).toBeLessThanOrEqual(2100);
    }
  });

  // A record with a structural gap must not be able to present itself as
  // reviewable: resolveReviewStatus forces it back to 'evidence_required'.
  it('forces evidence_required on any record with a verification gap', () => {
    for (const src of EVIDENCE_SOURCES) {
      const problems = verificationProblems(src);
      if (problems.length > 0) {
        expect(resolveReviewStatus(src), `${src.id}: ${problems.join('; ')}`).toBe('evidence_required');
      }
    }
  });

  it('ships nothing pre-approved — approval is a human act', () => {
    for (const src of EVIDENCE_SOURCES) {
      expect(src.reviewStatus, src.id).not.toBe('approved');
      expect(src.reviewer, src.id).toBeNull();
    }
  });

  it('marks every record with no printed year as evidence_required', () => {
    for (const src of EVIDENCE_SOURCES) {
      if (src.year === null) expect(resolveReviewStatus(src), src.id).toBe('evidence_required');
    }
  });

  it('contains no duplicate document', () => {
    expect(duplicateReferences(EVIDENCE_SOURCES)).toEqual([]);
  });
});

describe('content links', () => {
  const build = buildEvidenceLinks();

  it('leaves no orphan content', () => {
    expect(build.orphans).toEqual([]);
  });

  it('names no reference id that does not exist', () => {
    expect(build.unknownSourceIds).toEqual([]);
  });

  it('covers every content item in the seed', () => {
    const linked = new Set(EVIDENCE_LINKS.map((l) => l.slug));
    const missing = CONTENT_SEED.filter((i) => !linked.has(i.slug)).map((i) => i.slug);
    expect(missing).toEqual([]);
  });

  it('gives every link at least one reference', () => {
    for (const link of EVIDENCE_LINKS) {
      expect(link.sourceIds.length, `${link.kind}:${link.slug}`).toBeGreaterThan(0);
      expect(new Set(link.sourceIds).size, `${link.kind}:${link.slug} duplicates`).toBe(link.sourceIds.length);
    }
  });

  it('uses only known link kinds', () => {
    for (const link of EVIDENCE_LINKS) {
      expect(EVIDENCE_LINK_KINDS).toContain(link.kind);
    }
  });

  it('maps every milestone domain used by the seed', () => {
    const domains = new Set(
      CONTENT_SEED.filter((i) => i.type === 'milestone').map((i) => i.domainKey ?? ''),
    );
    for (const d of domains) {
      expect(MILESTONE_DOMAIN_SOURCES[d], `unmapped milestone domain: ${d}`).toBeDefined();
    }
  });

  it('links the deterministic safety rules and every Hope Center topic', () => {
    const safety = EVIDENCE_LINKS.filter((l) => l.kind === 'safety_rule');
    const hope = EVIDENCE_LINKS.filter((l) => l.kind === 'hope_topic');
    expect(safety.length).toBeGreaterThanOrEqual(9);
    expect(hope.length).toBeGreaterThanOrEqual(5);
    safety.forEach((l) => expect(l.sourceIds.length, l.slug).toBeGreaterThan(0));
    hope.forEach((l) => expect(l.sourceIds.length, l.slug).toBeGreaterThan(0));
  });

  it('derives the reverse index consistently with the forward links', () => {
    for (const link of EVIDENCE_LINKS) {
      for (const id of link.sourceIds) {
        expect(relatedContent(id)[link.kind], `${id} → ${link.slug}`).toContain(link.slug);
      }
    }
  });

  it('resolves sources for a known slug and nothing for an unknown one', () => {
    expect(sourcesForContent('ms_birth_2m_gross_motor_1').length).toBeGreaterThan(0);
    expect(sourcesForContent('does_not_exist')).toEqual([]);
  });

  it('keeps unlinked reference records non-citable until a direct claim needs them', () => {
    // Valid publisher records may remain in the registry after a claim-scope
    // cleanup. They must not be approved or parent-citable merely to satisfy a
    // link-count invariant.
    const unused = unusedSourceIds();
    expect(unused).toEqual([
      'aota-early-intervention',
      'asha-speech-sound-disorders',
      'asha-spoken-language-disorders',
      'nice-ph40-social-emotional-2012',
      'tb-swaiman-7e-2025',
    ]);
    for (const id of unused) {
      expect(['evidence_required', 'awaiting_review', 'retired']).toContain(
        resolveReviewStatus(SOURCE_BY_ID.get(id)!),
      );
    }
  });

  it('keeps known-dead and retired sources out of every active safety rule', () => {
    const knownDeadSourceIds = new Set(['nhs-seriously-ill-2023']);
    expect(SOURCE_BY_ID.get('nhs-seriously-ill-2023')?.reviewStatus).toBe('retired');

    for (const [rule, ids] of Object.entries(SAFETY_RULE_SOURCES)) {
      expect(ids.some((id) => knownDeadSourceIds.has(id)), rule).toBe(false);
      const usable = ids.filter((id) => {
        const source = SOURCE_BY_ID.get(id);
        return source && source.reviewStatus !== 'retired' && source.reviewStatus !== 'evidence_required';
      });
      expect(usable.length, `${rule} needs a structurally usable public source`).toBeGreaterThan(0);
    }
  });

  it('binds the corrected safety and screen-time claims to current public pages', () => {
    expect(SAFETY_RULE_SOURCES.sudden_weakness).toContain('cdc-afm-signs-2024');
    expect(SOURCE_BY_ID.get('tb-swaiman-7e-2025')?.reviewStatus).toBe('awaiting_review');
    expect(SOURCE_BY_ID.get('nhs-sids-2025')?.url).toBe(
      'https://www.nhs.uk/baby/caring-for-a-newborn/sudden-infant-death-syndrome-sids/',
    );
    expect(SOURCE_BY_ID.get('hc-screen-time-5cs-2024')?.url).toBe(
      'https://www.healthychildren.org/English/family-life/Media/Pages/kids-and-screen-time-5-cs-questions-for-toddlers-and-preschoolers.aspx',
    );
    expect(SOURCE_BY_ID.get('hc-screen-time-5cs-2024')).toMatchObject({
      ageMonthsMin: 24,
      ageMonthsMax: 59,
      verifiedOn: '2026-08-18',
    });
    expect(SOURCE_BY_ID.get('hc-screen-time-5cs-overview-2026')).toMatchObject({
      year: 2026,
      ageMonthsMin: 0,
      ageMonthsMax: 216,
      reviewStatus: 'awaiting_review',
      verifiedOn: '2026-08-18',
    });
    expect(sourcesForContent('st_little_seed')).toContain('hc-choking-prevention-2026');
    expect(sourcesForContent('lsn_screen_time')).toContain('hc-screen-time-5cs-infants-2024');
    expect(sourcesForContent('lsn_screen_time')).toEqual(expect.arrayContaining([
      'aap-digital-ecosystems-policy-2026',
      'aap-digital-ecosystems-technical-2026',
      'hc-screen-time-5cs-overview-2026',
    ]));
    expect(sourcesForContent('lsn_screen_time')).not.toContain('aap-media-young-minds-2016');
    expect(SOURCE_BY_ID.get('aap-media-young-minds-2016')?.reviewStatus).toBe('retired');
  });

  it('links only to ids present in the registry map', () => {
    for (const link of EVIDENCE_LINKS) {
      for (const id of link.sourceIds) {
        expect(SOURCE_BY_ID.has(id), `${link.slug} → ${id}`).toBe(true);
      }
    }
  });
});

describe('governance reports', () => {
  const reports = buildReports(TODAY);

  it('reports zero content without references', () => {
    expect(reports.contentWithoutReferences).toEqual([]);
    expect(contentWithoutReferences()).toEqual([]);
  });

  it('counts every reference in exactly one review bucket', () => {
    const total = Object.values(reports.reviewStatusCounts).reduce((a, b) => a + b, 0);
    expect(total).toBe(EVIDENCE_SOURCES.length);
  });

  it('lists unreviewed content and unapproved references as awaiting review', () => {
    expect(reports.contentAwaitingReview.length).toBeGreaterThan(0);
    reports.contentAwaitingReview.forEach((r) => {
      expect(['content', 'reference']).toContain(r.scope);
      expect(r.status).not.toBe('approved');
    });
  });

  it('reports expired references with a due date and a dependent count', () => {
    reports.expiredReferences.forEach((r) => {
      expect(SOURCE_BY_ID.has(r.id)).toBe(true);
      expect(r.dependentContent).toBeGreaterThanOrEqual(0);
    });
  });

  it('reports outdated references with the rule that flagged them', () => {
    reports.outdatedReferences.forEach((r) => {
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.limitYears).toBeGreaterThan(0);
    });
  });

  it('reports every verification gap it finds, and only real ones', () => {
    const flagged = new Set(reports.verificationFailures.map((r) => r.id));
    for (const src of EVIDENCE_SOURCES) {
      expect(flagged.has(src.id), src.id).toBe(verificationProblems(src).length > 0);
    }
  });

  it('is deterministic for a fixed date', () => {
    expect(buildReports(TODAY)).toEqual(buildReports(TODAY));
  });
});

// The evidence library is an internal clinical-governance tool. Reviewer names,
// verification notes and unapproved references must never reach a parent, so
// every exported Convex function in convex/evidence.ts has to be staff-gated —
// authentication alone is not enough. `forContent` is the one deliberate
// exception: it is the parent-facing citation lookup and returns ONLY sources a
// human reviewer has approved.
const evidenceModule = import.meta.glob('../../../convex/evidence.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('convex/evidence.ts authorization', () => {
  const src = Object.values(evidenceModule)[0];

  it('is loaded', () => {
    expect(src).toBeTruthy();
  });

  it('gates every exported function on staff, except the parent citation lookup', () => {
    const lines = src.split('\n');
    const fns: { name: string; body: string }[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const m = lines[i].match(/export const (\w+) = (query|mutation|action)\(/);
      if (!m) continue;
      let body = '';
      for (let j = i; j < lines.length; j += 1) {
        if (j > i && /^export const \w+ = (query|mutation|action)\(/.test(lines[j])) break;
        body += `${lines[j]}\n`;
      }
      fns.push({ name: m[1], body });
    }
    expect(fns.length).toBeGreaterThan(3);
    for (const fn of fns) {
      if (fn.name === 'forContent') {
        expect(fn.body, 'forContent must only return approved references').toContain(
          "reviewStatus === 'approved'",
        );
        continue;
      }
      const staffGated =
        fn.body.includes('requireStaff') ||
        fn.body.includes('requireEvidenceEditor') ||
        fn.body.includes('requireProfessionalPublisher') ||
        fn.body.includes('hasStaffRole') ||
        fn.body.includes('isStaff(ctx');
      expect(staffGated, `${fn.name} is not staff-gated`).toBe(true);
    }
  });

  it('never lets an import assert approval', () => {
    expect(src).toContain("rest.reviewStatus === 'approved' ? 'awaiting_review'");
  });

  it('requires a named reviewer and blocks approving an unverified record', () => {
    expect(src).toContain('A named reviewer is required');
    expect(src).toContain("args.status === 'approved' && row.reviewStatus === 'evidence_required'");
  });

  // A sign-off is auditable only if the person signing states what they are
  // qualified to sign off. "Approved by Dr X" with no discipline attached is a
  // name, not a clinical decision — so the server refuses it outright.
  it('requires the reviewer to state a qualification', () => {
    expect(src).toContain('A reviewer qualification is required');
    expect(src).toContain('reviewerQualification: v.string()');
  });

  // Re-importing publisher metadata must not quietly wipe the qualification a
  // An identical re-import must retain the qualification the reviewer signed
  // with; a changed evidence payload must clear it alongside the stale review.
  it('preserves reviewer qualification only while the evidence payload is unchanged', () => {
    expect(src).toContain('const reviewFields = evidenceImportReviewFields(');
  });

  // The integrity probe returns live counts, dangling links and the identities
  // of unqualified approvals. Declared as `query` it would be world-readable to
  // any browser that knows the function name; as `internalQuery` it is not
  // routed to clients at all and needs an admin key. The distinction is one
  // keyword, so it is asserted rather than trusted.
  it('exposes the integrity probe as an internal function only', () => {
    expect(src).toContain('export const integrity = internalQuery(');
    expect(src).not.toMatch(/export const integrity = query\(/);
  });

  it('declares no public function that leaks the integrity probe', () => {
    const publicNames = [...src.matchAll(/export const (\w+) = (?:query|mutation|action)\(/g)].map((m) => m[1]);
    expect(publicNames).not.toContain('integrity');
  });
});
