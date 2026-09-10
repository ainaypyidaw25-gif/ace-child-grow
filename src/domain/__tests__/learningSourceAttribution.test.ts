import { describe, expect, it } from 'vitest';
import { CONTENT_SEED } from '../../content/seed';
import { SOURCE_BY_ID } from '../../evidence/sources';
import { buildEvidenceLinks } from '../../evidence/links';
import seedData from '../../../convex/seedData.json';

const TARGETS = ['act_board_book_point', 'act_lift_the_flap_book', 'act_first_words_book_share'];

describe('three infant book activities: publisher attribution only', () => {
  it('resolves the historic hc identifier to AAP HealthyChildren, not Health Canada', () => {
    const source = SOURCE_BY_ID.get('hc-early-literacy-2023')!;
    expect(source.org).toBe('HealthyChildren.org (American Academy of Pediatrics)');
    expect(new URL(source.url).hostname).toBe('www.healthychildren.org');
    expect(source.title).toBe('Developmental Milestones of Early Literacy');
    expect(source.year).toBe(2023);
  });

  it.each(TARGETS)('%s keeps its actual source link and agrees across source and generated seeds', (slug) => {
    const item = CONTENT_SEED.find((entry) => entry.slug === slug)!;
    const generated = seedData.find((entry) => entry.slug === slug)!;
    const summary = (item.data as { evidenceSummary: string }).evidenceSummary;
    expect(summary).toContain('AAP HealthyChildren');
    expect(summary).not.toMatch(/Health Canada|Canadian/);
    expect((generated.data as { evidenceSummary?: string }).evidenceSummary).toBe(summary);
    // normalize() derives searchText from every data string, including evidenceSummary.
    // Updating the prose alone would leave the CLI artifact stale.
    expect(generated.searchText).toBe(item.searchText);
    expect(generated.searchText).not.toMatch(/health canada|canadian/);
    expect(buildEvidenceLinks().links.find((link) => link.kind === 'activity' && link.slug === slug)?.sourceIds)
      .toContain('hc-early-literacy-2023');
  });
});
