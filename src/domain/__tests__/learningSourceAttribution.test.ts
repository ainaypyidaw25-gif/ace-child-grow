import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CONTENT_SEED } from '../../content/seed';
import { SOURCE_BY_ID } from '../../evidence/sources';
import { buildEvidenceLinks } from '../../evidence/links';
import seedData from '../../../convex/seedData.json';
import proposal from '../../../docs/operations/learning-source-attribution-proposals-2026-09-10.json';

const TARGETS = ['act_board_book_point', 'act_lift_the_flap_book', 'act_first_words_book_share'];

describe('three infant book activities: non-executable publisher correction proposal', () => {
  it('resolves the historic hc identifier to AAP HealthyChildren, not Health Canada', () => {
    const source = SOURCE_BY_ID.get('hc-early-literacy-2023')!;
    expect(source.org).toBe(proposal.source.publisher);
    expect(source.url).toBe(proposal.source.url);
    expect(new URL(source.url).hostname).toBe('www.healthychildren.org');
    expect(source.title).toBe('Developmental Milestones of Early Literacy');
    expect(source.year).toBe(2023);
  });

  it('keeps exactly three truthful proposals separate from executable seed changes', () => {
    expect(proposal.status).toBe('proposal_only');
    expect(proposal.executable).toBe(false);
    expect(proposal.targets.map((target) => target.slug)).toEqual(TARGETS);
    expect(proposal.requiredWorkflow.join(' ')).toContain('increment current reviewRevision');
    expect(proposal.requiredWorkflow.join(' ')).toContain('preserving append-only decisions');
    for (const target of proposal.targets) {
      expect(target.field).toBe('data.evidenceSummary');
      expect(target.after).toContain('AAP HealthyChildren');
      expect(target.after).not.toMatch(/Health Canada|Canadian/);
      expect(target.after).not.toBe(target.before);
      expect(target.seedChangeApplied).toBe(false);
      expect(target.productionChangeApplied).toBe(false);
    }
  });

  it.each(TARGETS)('%s remains byte-identical to the pre-PR executable seed until a revision-invalidating workflow exists', (slug) => {
    const target = proposal.targets.find((entry) => entry.slug === slug)!;
    const item = CONTENT_SEED.find((entry) => entry.slug === slug)!;
    const generated = seedData.find((entry) => entry.slug === slug)!;
    // Pin the complete normalized target, not just version: changing either
    // evidenceSummary or derived searchText at version 1 would resurrect P1.
    const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
    expect(digest(item)).toBe(target.baselineGeneratedRecordSha256);
    expect(digest(generated)).toBe(target.baselineGeneratedRecordSha256);
    expect(item.version).toBe(target.seedVersion);
    expect((item.data as { evidenceSummary: string }).evidenceSummary).toBe(target.before);
    expect(buildEvidenceLinks().links.find((link) => link.kind === 'activity' && link.slug === slug)?.sourceIds)
      .toContain(proposal.source.sourceId);
  });
});
