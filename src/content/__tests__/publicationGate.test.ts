import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const librarySource = readFileSync('convex/library.ts', 'utf8');
const workflowSource = readFileSync('convex/content.ts', 'utf8');

describe('clinical publication gate', () => {
  it('requires a reviewer qualification before library content can be published', () => {
    expect(librarySource).toContain("args.clinicalStatus === 'published'");
    expect(librarySource).toContain('Publishing requires a qualified clinical reviewer');
  });

  it('requires a reviewer qualification before workflow approval or publishing', () => {
    expect(workflowSource).toContain("['approved', 'published'].includes(to)");
    expect(workflowSource).toContain('Approval and publishing require a qualified clinical reviewer');
  });
});
