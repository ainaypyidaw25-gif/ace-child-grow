import { describe, it, expect } from 'vitest';

// Regression guard for the P0 rule: no child/parent data may be readable or
// writable without authenticated ownership. Rather than relying only on a live
// two-account test (which needs a running Convex backend), this test statically
// asserts that every exported query/mutation handler derives the caller with
// getAuthUserId — the single choke point that scopes every read/write to the
// signed-in user. A new function that forgets this will fail CI here.
//
// Source files are loaded via Vite's raw-glob (no Node fs) so this runs in the
// same environment as the rest of the vitest suite.
const modules = import.meta.glob('../../../convex/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const SKIP_FILES = ['schema.ts', 'auth.ts', 'auth.config.ts', 'http.ts'];

// Cross-file helpers that themselves derive the caller via getAuthUserId (defined
// in convex/lib/auth.ts). A handler delegating to one of these is authed.
const KNOWN_AUTH_CALLS = [
  'getAuthUserId',
  'requireUser',
  'requireStaff',
  'requireOwner',
  'requireContentEditor',
  'requireEvidenceEditor',
  'requireClinicalReviewer',
  'requireProfessionalPublisher',
  'requireReviewEditor',
  'hasStaffRole',
];

// Functions that are INTENTIONALLY public. Each must only expose data that is
// safe for anonymous callers. Keep this list tiny and justified.
const PUBLIC_ALLOWLIST: Record<string, string> = {
  'directory.ts:listPublic':
    'returns only active + clinically-verified facilities — no personal data',
};

function fileName(path: string): string {
  return path.split('/').pop() ?? path;
}

// Local helper functions in a module that themselves establish the authenticated
// caller (they call getAuthUserId inside their own body). A handler delegating to
// one of these is as safe as calling getAuthUserId directly.
function authHelperNames(src: string): string[] {
  const names: string[] = [];
  const re = /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)[^{]*\{([\s\S]*?)\n\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m[2].includes('getAuthUserId')) names.push(m[1]);
  }
  return names;
}

function extractExports(src: string): { name: string; body: string }[] {
  const lines = src.split('\n');
  const out: { name: string; body: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/export const (\w+) = (query|mutation|action)\(/);
    if (!m) continue;
    let body = '';
    for (let j = i; j < lines.length; j++) {
      if (j > i && /^export const \w+ = (query|mutation|action)\(/.test(lines[j])) break;
      body += lines[j] + '\n';
    }
    out.push({ name: m[1], body });
  }
  return out;
}

describe('Convex authorization guard (P0 regression)', () => {
  const entries = Object.entries(modules)
    .map(([p, src]) => ({ file: fileName(p), src }))
    .filter((e) => !SKIP_FILES.includes(e.file));

  it('finds convex function modules to scan', () => {
    expect(entries.length).toBeGreaterThan(5);
  });

  for (const { file, src } of entries) {
    const helpers = authHelperNames(src);
    for (const fn of extractExports(src)) {
      const key = `${file}:${fn.name}`;
      it(`${key} enforces authentication (or is an allowlisted public endpoint)`, () => {
        const usesAuth =
          KNOWN_AUTH_CALLS.some((c) => fn.body.includes(c)) ||
          helpers.some((h) => fn.body.includes(`${h}(ctx`));
        const allowed = key in PUBLIC_ALLOWLIST;
        expect(
          usesAuth || allowed,
          `${key} does not call getAuthUserId and is not on the public allowlist — ` +
            'every data function must scope to the signed-in user.',
        ).toBe(true);
      });
    }
  }

  it('every allowlisted public endpoint still exists (no stale exemptions)', () => {
    for (const key of Object.keys(PUBLIC_ALLOWLIST)) {
      const [file, name] = key.split(':');
      const entry = entries.find((e) => e.file === file);
      expect(entry, `allowlist file ${file}`).toBeDefined();
      expect(entry!.src, `stale allowlist entry ${key}`).toContain(`export const ${name} =`);
    }
  });
});
