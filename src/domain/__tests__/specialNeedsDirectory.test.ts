import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('convex/directory.ts', 'utf8');
const schema = readFileSync('convex/schema.ts', 'utf8');
const signIn = readFileSync('src/screens/SignIn.tsx', 'utf8');
const app = readFileSync('src/app/App.tsx', 'utf8');
const layout = readFileSync('src/components/Layout.tsx', 'utf8');

describe('special-needs directory and staff portal', () => {
  it('uses owner-managed database records rather than a hard-coded school list', () => {
    expect(source).not.toContain('seedVerifiedSpecialNeedsDirectory');
    expect(source).not.toContain("source: 'https://");
    expect(source).toContain('export const create = mutation');
    expect(source).toContain('export const update = mutation');
    expect(source).toContain('export const verify = mutation');
    expect(source).toContain('await requireOwner(ctx)');
    expect(schema).toContain('nextVerificationAt: v.optional(v.number())');
  });

  it('keeps public reads bounded and exposes a distinct staff sign-in choice', () => {
    expect(source).toContain('.take(200)');
    expect(source).not.toContain("query('healthcareFacilities').collect()");
    expect(signIn).toContain('အဖွဲ့ဝင်/ပညာရှင်ဝင်ရန်');
    expect(signIn).toContain('setPortalMode(portal)');
    expect(app).toContain("getPortalMode() === 'staff'");
    expect(app).not.toContain('<ClearStaffDestination>');
    expect(layout).toContain("setPortalMode(inStaffWorkspace ? 'parent' : 'staff')");
    expect(layout).toContain("to={inStaffWorkspace ? '/home' : '/admin'}");
  });

  it('automatically deactivates owner-managed entries after their verification period', () => {
    expect(source).toContain('expireOverdue = internalMutation');
    expect(source).toContain('180 * 24 * 60 * 60 * 1000');
    expect(source).toContain('nextVerificationAt <= now');
  });
});
