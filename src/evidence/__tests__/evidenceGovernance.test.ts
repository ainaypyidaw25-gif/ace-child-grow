// Governance tests for the live evidence path: invalid review transitions,
// audit completeness, and the staleness rules the live integrity probe uses.
//
// These read the deployed server source rather than the browser code, because
// the guarantees they protect are server-side. A hidden button is not a
// control; the mutation refusing the write is the control.
import { describe, it, expect } from 'vitest';
import {
  OUTDATED_AFTER_YEARS as LOCAL_OUTDATED_AFTER_YEARS,
  REVIEW_CADENCE_MONTHS as LOCAL_REVIEW_CADENCE_MONTHS,
} from '../types';
import {
  OUTDATED_AFTER_YEARS as SERVER_OUTDATED_AFTER_YEARS,
  REVIEW_CADENCE_MONTHS as SERVER_REVIEW_CADENCE_MONTHS,
} from '../../../convex/lib/evidenceFreshness';
import {
  evidenceDependencyInvalidationPatch,
  reviewRefusal as reviewRefusalPolicy,
} from '../../../convex/evidence';

const raw = (glob: Record<string, string>) => Object.values(glob)[0] ?? '';

const evidenceSrc = raw(
  import.meta.glob('../../../convex/evidence.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>,
);
const auditSrc = raw(
  import.meta.glob('../../../convex/audit.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>,
);
const schemaSrc = raw(
  import.meta.glob('../../../convex/schema.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>,
);

const CONVEX_FN = /^export const \w+ = \w+\(/;
const PLAIN_FN = /^(export )?(async )?function \w+\(/;

/**
 * The body of one top-level function, from its declaration to the next.
 *
 * Both forms are accepted because an import that two callers must run
 * identically — the admin screen and the activation CLI — belongs in a plain
 * function that both wrap, and these guarantees follow the logic rather than
 * the wrapper it happens to live behind today.
 */
function functionBody(src: string, name: string): string {
  const lines = src.split('\n');
  const start = lines.findIndex(
    (l) =>
      new RegExp(
        `^export const ${name} = (query|mutation|action|internalQuery|internalMutation)\\(`,
      ).test(l) || new RegExp(`^(export )?(async )?function ${name}\\(`).test(l),
  );
  expect(start, `${name} is not a top-level function in this module`).toBeGreaterThan(-1);
  let body = '';
  for (let j = start; j < lines.length; j += 1) {
    if (j > start && (CONVEX_FN.test(lines[j]) || PLAIN_FN.test(lines[j]))) break;
    body += `${lines[j]}\n`;
  }
  return body;
}

describe('invalid review transitions', () => {
  const setReview = functionBody(evidenceSrc, 'setReview');
  // The policy itself lives apart from the write that applies it, so that the
  // gate a release check reads and the gate a reviewer meets cannot drift into
  // disagreeing. The refusal codes are asserted where the decision is made.
  const reviewRefusal = functionBody(evidenceSrc, 'reviewRefusal');
  const reviewGate = functionBody(evidenceSrc, 'reviewGate');

  // Every one of these is a way a review decision could be recorded that a
  // clinician did not actually make. Each must be refused by the server.
  const refusals = [
    ['an unknown review status', 'unknown_status'],
    ['an approval with no named reviewer', 'reviewer_required'],
    ['an approval with no stated qualification', 'qualification_required'],
    ['a decision with no review date', 'review_date_required'],
    ['a decision with a malformed review date', 'review_date_invalid'],
    ['a decision with a future review date', 'review_date_future'],
    ['a decision with a malformed next review date', 'next_review_date_invalid'],
    ['a decision on a reference that does not exist', 'not_found'],
    ['approving a record held at evidence_required', 'evidence_required'],
    ['approving an old source without a justification note', 'outdated_note_required'],
    ['recording an overlong reviewer note', 'note_too_long'],
  ] as const;

  it.each(refusals)('refuses %s', (_case, code) => {
    expect(reviewRefusal, `no refusal path for ${code}`).toContain(`'${code}'`);
  });

  it('decides the policy in exactly one place', () => {
    // Both callers must consult reviewRefusal rather than re-implementing it.
    // A second copy of these rules is how a gate starts answering a reviewer
    // and a release check differently.
    expect(setReview).toContain('reviewRefusal(reviewArgs, row)');
    expect(reviewGate).toContain('reviewRefusal(args, row)');
  });

  it('reports the decision without taking it', () => {
    // reviewGate exists so invalid transitions can be probed against a live
    // deployment without anything being approved to prove the gate works.
    expect(evidenceSrc).toContain('export const reviewGate = internalQuery(');
    expect(reviewGate).not.toMatch(/ctx\.db\.(patch|insert|delete|replace)\(/);
  });

  it('refuses in-band so the refusal survives to be audited', () => {
    // Convex discards the writes of a mutation that throws. A refusal that
    // threw would erase its own audit record, so the attempt would leave no
    // trace at all — the opposite of what an audit trail is for.
    expect(setReview).toContain('return refuse(');
    expect(setReview).toContain("result: 'rejected'");
    expect(setReview).not.toMatch(/throw new Error\(/);
  });

  it('writes nothing on a refusal', () => {
    // Every refusal returns before the patch; the patch appears once, after
    // the last guard.
    const patchAt = setReview.indexOf('ctx.db.patch');
    const lastRefuse = setReview.lastIndexOf('return refuse(');
    expect(patchAt).toBeGreaterThan(lastRefuse);
    expect(setReview.split('ctx.db.patch').length - 1).toBe(1);
  });

  it('keeps approval the only status that evidence_required blocks', () => {
    expect(reviewRefusal).toContain(
      "args.status === 'approved' && row.reviewStatus === 'evidence_required'",
    );
  });

  it('records the review date and supports a next review date', () => {
    expect(setReview).toContain('reviewDate: args.reviewDate');
    expect(setReview).toContain('nextReviewDate: row.nextReviewDate ?? args.nextReviewDate ?? null');
  });

  it('rejects invalid, future and reversed review dates in the executable policy', () => {
    const row = {
      reviewStatus: 'awaiting_review',
      evidenceLevel: 'guideline',
      year: 2025,
      verifiedOn: '2026-08-01',
      reviewDate: null,
      nextReviewDate: null,
    };
    const base = {
      status: 'approved',
      reviewer: 'Dr Reviewer',
      reviewerQualification: 'MBBS',
      reviewDate: '2026-08-18',
    };
    expect(reviewRefusalPolicy({ ...base, reviewDate: 'not-a-date' }, row)?.code)
      .toBe('review_date_invalid');
    expect(reviewRefusalPolicy({ ...base, reviewDate: '2099-01-01' }, row)?.code)
      .toBe('review_date_future');
    expect(reviewRefusalPolicy({ ...base, nextReviewDate: '2026-02-30' }, row)?.code)
      .toBe('next_review_date_invalid');
    expect(reviewRefusalPolicy({ ...base, nextReviewDate: '2026-08-17' }, row)?.code)
      .toBe('next_review_date_before_anchor');
  });

  it('does not allow a reviewer to revive an overdue publisher source', () => {
    expect(reviewRefusalPolicy({
      status: 'approved', reviewer: 'Dr Reviewer', reviewerQualification: 'MBBS',
      reviewDate: '2026-08-18', nextReviewDate: '2028-01-01',
    }, {
      reviewStatus: 'awaiting_review', evidenceLevel: 'parent_education', year: 2023,
      verifiedOn: '2026-08-18', reviewDate: null, nextReviewDate: '2026-02-17',
    })?.code).toBe('source_review_overdue');
  });

  it('requires an auditable note for old evidence but does not reject age alone', () => {
    const row = {
      reviewStatus: 'awaiting_review', evidenceLevel: 'guideline', year: 2017,
      verifiedOn: '2026-08-18', reviewDate: null, nextReviewDate: '2027-08-18',
    };
    const args = {
      status: 'approved', reviewer: 'Dr Reviewer', reviewerQualification: 'MBBS',
      reviewDate: '2026-08-18', nextReviewDate: '2027-08-18',
    };
    expect(reviewRefusalPolicy(args, row)?.code).toBe('outdated_note_required');
    expect(reviewRefusalPolicy({
      ...args,
      note: 'Publisher confirms this remains the current standard; no replacement edition exists.',
    }, row)).toBeNull();
    expect(reviewRefusalPolicy({ ...args, note: 'x'.repeat(2_001) }, row)?.code)
      .toBe('note_too_long');
  });

  it('passes reviewer notes through the UI and preserves them in append-only audit details', () => {
    const admin = raw(
      import.meta.glob('../../screens/EvidenceAdmin.tsx', {
        query: '?raw', import: 'default', eager: true,
      }) as Record<string, string>,
    );
    expect(admin).toContain('reviewerNote.trim()');
    expect(admin).toContain("res.code === 'outdated_note_required'");
    expect(functionBody(evidenceSrc, 'setReview')).toContain('` / note: ${reviewNote}`');
  });

  it('makes the caller check the outcome instead of assuming success', () => {
    const admin = raw(
      import.meta.glob('../../screens/EvidenceAdmin.tsx', {
        query: '?raw',
        import: 'default',
        eager: true,
      }) as Record<string, string>,
    );
    expect(admin).toContain('if (!res.ok)');
  });
});

describe('audit trail', () => {
  it('records actor, action, target, result and a before/after summary', () => {
    for (const field of [
      'actorId',
      'action',
      'entityTable',
      'entityId',
      'summary',
      'result',
      'before',
      'after',
    ]) {
      expect(auditSrc, `audit entry has no ${field}`).toContain(field);
    }
    // _creationTime is the timestamp; Convex sets it on every row, so an
    // entry cannot be written without one.
    expect(schemaSrc).toContain('auditLogs: defineTable({');
    expect(schemaSrc).toContain('result: v.optional(v.string())');
  });

  it('audits every evidence write, refused or carried out', () => {
    for (const fn of ['applySources', 'applyLinks', 'setReview']) {
      expect(functionBody(evidenceSrc, fn), `${fn} is not audited`).toContain('logAudit(');
    }
  });

  it('audits a failed import distinctly from a clean one', () => {
    expect(functionBody(evidenceSrc, 'applySources')).toContain(
      "failed.length > 0 ? 'failed' : 'ok'",
    );
    expect(functionBody(evidenceSrc, 'applyLinks')).toContain(
      "failed.length > 0 ? 'failed' : 'ok'",
    );
  });

  // A CLI import has no signed-in user. Recording it as an anonymous action
  // that names its own channel is honest; borrowing a staff member's id to
  // fill the column would put a name on something they did not do.
  it('names the channel an import came through', () => {
    expect(functionBody(evidenceSrc, 'applySources')).toContain('(via ${via})');
    expect(evidenceSrc).toContain("'admin screen'");
    expect(evidenceSrc).toContain("'deploy key (CLI)'");
  });
});

// The import body is shared by a staff-authenticated mutation and a CLI-only
// internal mutation. That is only safe while the browser-reachable one still
// goes through requireStaff and the unauthenticated one stays unreachable from
// a browser — so both halves are asserted here.
describe('import entry points', () => {
  it.each([
    ['importSources', 'applySources'],
    ['importLinks', 'applyLinks'],
  ])('%s stays staff-gated', (fn, apply) => {
    const body = functionBody(evidenceSrc, fn);
    expect(body).toContain('await requireEvidenceEditor(ctx)');
    expect(body).toContain(apply);
  });

  it.each(['importSourcesFromCli', 'importLinksFromCli'])(
    '%s is internal, so no browser can reach the unauthenticated path',
    (fn) => {
      expect(evidenceSrc).toContain(`export const ${fn} = internalMutation(`);
      expect(evidenceSrc).not.toContain(`export const ${fn} = mutation(`);
    },
  );

  it('keeps the audit log staff-only', () => {
    expect(auditSrc).toContain("hasStaffRole(ctx, userId, ['owner'])");
    expect(auditSrc).toContain('allowed: false');
  });
});

describe('import result reporting', () => {
  const importSources = functionBody(evidenceSrc, 'applySources');
  const importLinks = functionBody(evidenceSrc, 'applyLinks');

  it.each([
    ['created', 'created'],
    ['updated', 'updated'],
    ['unchanged', 'unchanged'],
    ['skipped', 'skipped'],
    ['failed', 'failed'],
  ])('reports %s for both imports', (_label, key) => {
    expect(importSources, `importSources does not report ${key}`).toContain(key);
    expect(importLinks, `importLinks does not report ${key}`).toContain(key);
  });

  // An idempotent re-import that reports 90 updates looks identical to a run
  // that rewrote all 90 records. Distinguishing unchanged from updated is what
  // makes "safe to re-run" observable rather than asserted.
  it('separates an unchanged row from a rewritten one', () => {
    expect(importSources).toContain('sameSource(existing, next)');
    expect(importLinks).toContain('unchanged += 1');
  });

  it('never lets an import assert approval and invalidates review on changed evidence', () => {
    expect(importSources).toContain("rest.reviewStatus === 'approved' ? 'awaiting_review'");
    expect(importSources).toContain('evidenceImportReviewPolicy(');
    expect(importSources).toContain('evidenceImportReviewFields(');
    expect(importSources).toContain('reviewReset += 1');
  });

  it('makes retired source rows immutable and invalidates dependent content revisions', () => {
    expect(importSources).toContain("if (existing.reviewStatus === 'retired')");
    expect(importSources).toContain('invalidateDependentContentReviews(');
    expect(importLinks).toContain('invalidateDependentContentReviews(');
    expect(evidenceDependencyInvalidationPatch(7, 123)).toEqual({
      reviewRevision: 8,
      clinicalStatus: 'clinical_review',
      reviewerId: undefined,
      reviewerQualification: undefined,
      reviewerDisplayName: undefined,
      reviewScope: undefined,
      reviewedAt: undefined,
      nextReviewAt: undefined,
      reviewNote: undefined,
      updatedAt: 123,
    });
  });

  it('validates import statuses and declares the expanded result contract', () => {
    expect(evidenceSrc).toContain("v.literal('evidence_required')");
    expect(evidenceSrc).toContain("v.literal('awaiting_review')");
    expect(evidenceSrc).toContain('returns: sourceImportResultValidator');
    expect(evidenceSrc).toContain('returns: linkImportResultValidator');
  });

  it('shows approval resets and stops links after a source-import failure', () => {
    const admin = raw(
      import.meta.glob('../../screens/EvidenceAdmin.tsx', {
        query: '?raw',
        import: 'default',
        eager: true,
      }) as Record<string, string>,
    );
    expect(admin).toContain('src.reviewResetIds.join');
    expect(admin).toContain('if (src.failed > 0)');
    expect(admin.indexOf('if (src.failed > 0)')).toBeLessThan(admin.indexOf('await importLinks'));
  });
});

// The live probe classifies a stored row; the reports classify the same record
// from the local registry. If the two tables ever disagree, an operator gets
// two different answers to "is this reference expired" depending on where they
// looked — so the duplication is allowed, but only under this test.
describe('staleness rules match between the server and the local reports', () => {
  it('uses the same review cadence', () => {
    expect(SERVER_REVIEW_CADENCE_MONTHS).toEqual(LOCAL_REVIEW_CADENCE_MONTHS);
  });

  it('uses the same outdated-after thresholds', () => {
    expect(SERVER_OUTDATED_AFTER_YEARS).toEqual(LOCAL_OUTDATED_AFTER_YEARS);
  });

  it('treats a record with no review anchor as due, not as fresh', () => {
    expect(functionBody(evidenceSrc, 'integrity')).toContain('evidenceIsExpired(s, today)');
  });

  it('reports outdated separately from expired, and neither as an error', () => {
    const integrity = functionBody(evidenceSrc, 'integrity');
    expect(integrity).toContain('expired');
    expect(integrity).toContain('outdated');
    expect(integrity).not.toMatch(/throw new Error/);
  });
});

// The live checker is the only thing that speaks to the deployment, so its
// verdict is the only signal an operator gets about it. What that verdict is
// allowed to say — and which states may fail a build — is a policy decision,
// and policy decisions belong under test.
describe('live check state machine', () => {
  const liveSrc = raw(
    import.meta.glob('../../../scripts/evidence-live-check.mjs', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  );

  /** exit code declared for each state in the STATES table. */
  const exits = (): Record<string, number> => {
    const table = liveSrc.slice(liveSrc.indexOf('const STATES = {'));
    const out: Record<string, number> = {};
    const re = /(\w+):\s*\{\s*\n\s*exit:\s*(\d)/g;
    let m: RegExpExecArray | null = re.exec(table);
    while (m) {
      out[m[1]] = Number(m[2]);
      m = re.exec(table);
    }
    return out;
  };

  it.each([
    ['module not deployed', 'not_deployed'],
    ['unauthorized', 'unauthorized'],
    ['empty registry', 'empty_registry'],
    ['partial import', 'partial_import'],
    ['a valid live registry', 'live_registry_valid'],
    ['integrity failure', 'integrity_failure'],
  ])('names %s as its own state', (_label, state) => {
    expect(exits(), `${state} is not a declared state`).toHaveProperty(state);
  });

  it('fails the build only for deployment, authorization or integrity problems', () => {
    const e = exits();
    for (const state of [
      'not_deployed',
      'unauthorized',
      'authorization_failure',
      'empty_registry',
      'partial_import',
      'integrity_failure',
    ]) {
      expect(e[state], `${state} must exit non-zero`).toBe(1);
    }
    expect(e.live_registry_valid, 'a valid live registry must exit 0').toBe(0);
    // A missing key on this machine is a fact about the machine, not about the
    // deployment — but it is reported as unverified, never as passed.
    expect(e.unverified, 'a missing deploy key must not fail the build').toBe(0);
    expect(liveSrc).toContain('UNVERIFIED —');
  });

  // A guideline is not wrong because it is old, and a build that breaks on the
  // passage of time trains people to ignore it.
  it('treats outdated and expired references as advisories, never as failures', () => {
    // Whitespace-tolerant: the formatter is free to break these calls across
    // lines, and a governance test that a reformat can break is a test people
    // learn to edit rather than to read.
    expect(liveSrc).toMatch(/advise\(\s*L,\s*'no reference is old enough to need a newer edition'/);
    expect(liveSrc).toMatch(/advise\(\s*L,\s*'no reference is past its review date'/);
    expect(liveSrc).not.toMatch(
      /check\(\s*L,\s*'no reference is (past its review date|old enough)/,
    );
    // and neither may reach the state that fails the run
    const broken = liveSrc.slice(
      liveSrc.indexOf('const broken ='),
      liveSrc.indexOf('return { state: broken'),
    );
    expect(broken).not.toContain('outdated');
    expect(broken).not.toContain('expired');
    expect(broken).not.toContain('unusedSources');
  });

  it('fails closed when the deployed probe cannot report approved parent citations', () => {
    const broken = liveSrc.slice(
      liveSrc.indexOf('const broken ='),
      liveSrc.indexOf("return { state: broken"),
    );
    expect(broken).toContain('!Array.isArray(live.publishedWithoutApprovedEvidence)');
    expect(broken).toContain('(live.publishedWithoutApprovedEvidence?.length ?? 0) > 0');
  });

  it('compares the registry with active links while preserving archived audit history', () => {
    const broken = liveSrc.slice(
      liveSrc.indexOf('const broken ='),
      liveSrc.indexOf("return { state: broken"),
    );
    expect(broken).toContain('!Number.isInteger(live.activeLinks)');
    expect(broken).toContain('!Number.isInteger(live.activeLinkedSlugs)');
    expect(broken).toContain('!Array.isArray(live.preservedArchivedLinks)');
    expect(broken).toContain('live.activeLinks !== expect.links');
    expect(broken).not.toContain('live.links !== expect.links');
  });

  it('never lets an absent function pass as a working authorization gate', () => {
    expect(liveSrc).toContain('const NOT_DEPLOYED =');
    expect(liveSrc).toContain('const UNAUTHORIZED =');
    // presence is established before any refusal is credited as a gate
    expect(liveSrc.indexOf('isModuleDeployed')).toBeLessThan(
      liveSrc.indexOf('evidence:list refuses'),
    );
  });

  it('reports every live count requirement 3 asks for', () => {
    for (const key of [
      'sources',
      'links',
      'activeLinks',
      'activeLinkedSlugs',
      'preservedArchivedLinks',
      'orphanLinks',
      'danglingLinks',
      'duplicateIdentifier',
      'duplicateTitle',
      'unusedSources',
      'expired',
      'outdated',
      'evidenceRequired',
      'awaitingReview',
      'approved',
    ]) {
      expect(liveSrc, `the live check does not report ${key}`).toContain(`live.${key}`);
    }
  });
});

// The activation script is the one thing in this repository that holds a deploy
// key and writes to a live deployment. What it is allowed to do is therefore
// worth stating as a test rather than as a comment in its own header.
describe('activation script safety', () => {
  const activateSrc = raw(
    import.meta.glob('../../../scripts/evidence-activate.mjs', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  );

  // Asserted on what the script actually invokes, not on what its comments
  // claim: a prose promise not to publish is not a control.
  it('calls only the three functions activation needs', () => {
    const invoked = [
      ...activateSrc.matchAll(/(?:runFunction|importBatched)\(\s*\n?\s*'([^']+)'/g),
    ].map((m) => m[1]);
    expect(new Set(invoked)).toEqual(
      new Set([
        'evidence:importSourcesFromCli',
        'evidence:importLinksFromCli',
        'evidence:integrity',
      ]),
    );
    // in particular, nothing that records a review decision or publishes
    expect(invoked.join(' ')).not.toMatch(/setReview|publish|content:/);
  });

  it('runs no destructive Convex CLI command', () => {
    const cli = [...activateSrc.matchAll(/convex\(\s*\[([^\]]*)\]/g)].map((m) => m[1]);
    expect(cli.length).toBeGreaterThan(0);
    for (const args of cli) {
      expect(args, `unexpected convex CLI invocation: ${args}`).toMatch(/'deploy'|'run'/);
      expect(args).not.toMatch(/import|--replace|--clear|data|env|logs\s*remove/);
    }
  });

  // A key for a different project would activate the wrong backend, and that
  // is not a thing to find out afterwards.
  it('refuses a key that targets a different deployment', () => {
    expect(activateSrc).toContain('The deploy key targets');
    expect(activateSrc).toContain('Nothing was changed.');
  });

  it('never prints the key it was given', () => {
    expect(activateSrc).not.toMatch(/say\([^)]*found\.key/);
    expect(activateSrc).not.toMatch(/console\.log\([^)]*key\b/);
  });

  it('reads the live counts back instead of reporting what it submitted', () => {
    expect(activateSrc).toContain("runFunction('evidence:integrity'");
    expect(activateSrc).toContain('LIVE COUNTS (queried from the deployment, not assumed)');
  });

  it('reports reset ids and refuses to continue after a partial source import', () => {
    expect(activateSrc).toContain('reviewResetIds');
    expect(activateSrc).toContain('invalidatedContentKeys');
    expect(activateSrc).toContain('link import was NOT started');
    expect(activateSrc).toContain(
      "link import partially failed. Failed keys: ${linkResult.failedIds.join(', ')}",
    );
  });
});

describe('live integrity probe coverage', () => {
  const integrity = functionBody(evidenceSrc, 'integrity');

  it.each([
    'sources',
    'links',
    'danglingLinks',
    'orphanLinks',
    'unusedSources',
    'duplicateIdentifier',
    'duplicateTitle',
    'expired',
    'outdated',
    'evidenceRequired',
    'awaitingReview',
    'approved',
    'approvedWithoutReviewer',
    'publishedWithoutEvidence',
    'indexProbe',
  ])('reports %s', (key) => {
    expect(integrity, `integrity does not report ${key}`).toContain(key);
  });

  it('stays internal so no browser can reach it', () => {
    expect(evidenceSrc).toContain('export const integrity = internalQuery(');
    expect(evidenceSrc).not.toMatch(/export const integrity = query\(/);
  });
});
