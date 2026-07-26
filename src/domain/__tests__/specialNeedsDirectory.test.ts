import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('convex/directory.ts', 'utf8');
const schema = readFileSync('convex/schema.ts', 'utf8');
const signIn = readFileSync('src/screens/SignIn.tsx', 'utf8');

describe('special-needs directory and staff portal', () => {
  it('seeds only source-traceable active directory entries through an internal mutation', () => {
    expect(source).toContain('seedVerifiedSpecialNeedsDirectory = internalMutation');
    expect(source.match(/source: 'https:\/\//g)).toHaveLength(5);
    expect(source).toContain("isActive: true, lastVerifiedAt: now");
    expect(source).toContain("withIndex('by_name'");
    expect(schema).toContain(".index('by_name', ['name'])");
  });

  it('keeps public reads bounded and exposes a distinct staff sign-in choice', () => {
    expect(source).toContain('.take(200)');
    expect(source).not.toContain("query('healthcareFacilities').collect()");
    expect(signIn).toContain('အဖွဲ့ဝင်/ပညာရှင်ဝင်ရန်');
    expect(signIn).toContain("localStorage.setItem('ace-login-destination', 'staff')");
  });
});
