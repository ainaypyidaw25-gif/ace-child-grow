import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { diffEditableContent } from '../../../convex/lib/contentEditDiff';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('content edit diff', () => {
  it('records nested text leaves with before and after values', () => {
    const result = diffEditableContent(
      { titleEn: 'Old title', data: { intro: 'Old intro', nested: { tip: 'Keep' } } },
      { titleEn: 'New title', data: { intro: 'New intro', nested: { tip: 'Keep' } } },
    );

    expect(result).toEqual({
      totalChanges: 2,
      logTruncated: false,
      changes: [
        { path: 'data.intro', before: 'Old intro', after: 'New intro', truncated: false },
        { path: 'titleEn', before: 'Old title', after: 'New title', truncated: false },
      ],
    });
  });

  it('keeps arrays atomic so reordering does not create misleading paths', () => {
    const result = diffEditableContent(
      { data: { steps: ['One', 'Two'] } },
      { data: { steps: ['Two', 'One'] } },
    );

    expect(result.totalChanges).toBe(1);
    expect(result.changes[0]?.path).toBe('data.steps');
    expect(result.changes[0]?.before).toBe('["One","Two"]');
    expect(result.changes[0]?.after).toBe('["Two","One"]');
  });

  it('returns an empty change list for an identical save', () => {
    expect(diffEditableContent({ title: 'Same' }, { title: 'Same' })).toEqual({
      changes: [],
      totalChanges: 0,
      logTruncated: false,
    });
  });

  it('marks long values and oversized edits as truncated', () => {
    const long = 'x'.repeat(1_500);
    const before = Object.fromEntries(Array.from({ length: 90 }, (_, index) => ['field' + index, 'before']));
    const after = Object.fromEntries(Array.from({ length: 90 }, (_, index) => [
      'field' + index,
      index === 0 ? long : 'after',
    ]));
    const result = diffEditableContent(before, after);

    expect(result.totalChanges).toBe(90);
    expect(result.changes).toHaveLength(80);
    expect(result.logTruncated).toBe(true);
    expect(result.changes.some((change) => change.truncated)).toBe(true);
  });
});

describe('content edit history integration', () => {
  it('writes the edit log from the same mutation that patches content', () => {
    const library = readFileSync(resolve(REPO_ROOT, 'convex/library.ts'), 'utf8');
    const patchPosition = library.indexOf("await ctx.db.patch(item._id");
    const logPosition = library.indexOf("await ctx.db.insert('contentEditLogs'");

    expect(patchPosition).toBeGreaterThan(-1);
    expect(logPosition).toBeGreaterThan(patchPosition);
    expect(library).toContain('diffEditableContent');
  });

  it('shows editor, timestamp, revisions, and field-level before/after values', () => {
    const screen = readFileSync(resolve(REPO_ROOT, 'src/screens/AdminReviewActivity.tsx'), 'utf8');

    expect(screen).toContain('Content edit history');
    expect(screen).toContain('View changed fields');
    expect(screen).toContain('edit.editorDisplayName');
    expect(screen).toContain('edit.editedAt');
    expect(screen).toContain('edit.fromVersion');
    expect(screen).toContain('change.before');
    expect(screen).toContain('change.after');
  });
});
