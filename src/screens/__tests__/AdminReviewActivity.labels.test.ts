import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The reviewer-activity screen is the owner's only cross-content view of review
// history, so two things are worth pinning: it must not become an English-only
// admin page (this product is bilingual by requirement), and it must not drift
// back into hiding history behind a permission the owner does not hold.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCREEN = resolve(REPO_ROOT, 'src/screens/AdminReviewActivity.tsx');
const source = readFileSync(SCREEN, 'utf8');

describe('reviewer activity screen', () => {
  it('labels every review dimension and decision in both languages', () => {
    for (const dimension of ['english', 'native_myanmar', 'evidence', 'safety', 'clinical']) {
      expect(source, `dimension ${dimension}`).toContain(`${dimension}: {`);
    }
    for (const decision of ['in_review', 'approved', 'changes_requested', 'not_applicable']) {
      expect(source, `decision ${decision}`).toContain(`${decision}: {`);
    }
    // Every label entry carries an mm and an en side.
    const labelEntries = source.match(/\{ mm: '[^']*', en: '[^']*' \}/g) ?? [];
    expect(labelEntries.length).toBeGreaterThanOrEqual(15);
  });

  it('names every staff role it can display, so a role never renders as a raw key', () => {
    for (const role of [
      'owner', 'content_editor', 'language_reviewer',
      'evidence_reviewer', 'clinical_reviewer', 'support',
    ]) {
      expect(source, `role ${role}`).toContain(`${role}: {`);
    }
  });

  it('renders the reviewer name, note, revision and timestamp for each decision', () => {
    expect(source).toContain('reviewerDisplayName');
    expect(source).toContain('reviewerQualification');
    expect(source).toContain('row.note');
    expect(source).toContain('contentVersion');
    expect(source).toContain('formatDateTime(row.reviewedAt, locale)');
    expect(source).toContain("timeZone: 'Asia/Yangon'");
    expect(source).toContain('Yangon');
  });

  it('reports a truncated window instead of silently capping the history', () => {
    expect(source).toContain('data.truncated');
    expect(source).toContain('totalScanned');
  });

  it('keeps the refusal server-side rather than hiding the page in the client', () => {
    expect(source).toContain('data.allowed');
    // No client-side role test decides what is shown; the server returns allowed.
    expect(source).not.toContain("access?.role === 'owner'");
  });

  it('gives every filter control an accessible label', () => {
    const selects = source.match(/<select/g) ?? [];
    const ariaLabels = source.match(/aria-label=\{L\(/g) ?? [];
    expect(selects.length).toBe(4);
    expect(ariaLabels.length).toBeGreaterThanOrEqual(selects.length);
  });
});
