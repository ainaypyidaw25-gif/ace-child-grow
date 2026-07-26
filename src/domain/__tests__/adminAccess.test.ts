import { describe, expect, it } from 'vitest';

const modules = import.meta.glob('../../../convex/{schema,admin,subscriptions,lib/auth}.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function source(name: string): string {
  const entry = Object.entries(modules).find(([path]) => path.endsWith(`/${name}`));
  if (!entry) throw new Error(`Missing ${name}`);
  return entry[1];
}

describe('admin team and subscription security', () => {
  const schema = source('schema.ts');
  const admin = source('admin.ts');
  const subscriptions = source('subscriptions.ts');
  const auth = source('auth.ts');

  it('defines explicit staff roles and invite indexes', () => {
    for (const role of ['owner', 'content_editor', 'clinical_reviewer', 'support']) {
      expect(schema).toContain(`v.literal('${role}')`);
    }
    expect(schema).toContain(".index('by_code_hash', ['codeHash'])");
    expect(schema).not.toContain('inviteCode: v.string()');
  });

  it('stores only the invitation digest and requires email plus code to claim', () => {
    expect(admin).toContain("crypto.subtle.digest('SHA-256'");
    expect(admin).toContain("email !== invite.email");
    expect(admin).toContain('userId !== invite.targetUserId');
    expect(admin).toContain(".withIndex('email'");
    expect(admin).toContain("invite.status !== 'pending'");
    expect(admin).toContain('invite.expiresAt < Date.now()');
  });

  it('does not let an owner impersonate a clinical reviewer', () => {
    expect(auth).toContain("requireOneOf(ctx, ['clinical_reviewer'])");
    expect(auth).toContain('Clinical reviewer qualification is required');
  });

  it('keeps provider subscription updates internal', () => {
    expect(subscriptions).toContain('export const syncProviderSubscription = internalMutation({');
    expect(subscriptions).not.toContain('export const syncProviderSubscription = mutation({');
    expect(subscriptions).toContain("provider: 'manual'");
  });
});
