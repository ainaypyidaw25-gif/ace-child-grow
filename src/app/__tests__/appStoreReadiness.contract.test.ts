import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('native store review readiness contract', () => {
  it('keeps staff, unfinished and external-payment routes out of both native store builds', () => {
    const app = read('src/app/App.tsx');
    const distribution = read('src/app/distribution.ts');
    expect(distribution).toContain("import.meta.env.VITE_DISTRIBUTION === 'app-store'");
    expect(distribution).toContain("import.meta.env.VITE_DISTRIBUTION === 'play-store'");
    for (const component of [
      'AdminReviewQueue', 'ContentReviewWorkspace', 'SubscriptionPlans', 'PaymentStatus',
      'OfflineDownloads', 'Report', 'Appointments', 'WeeklyPlan', 'HopeCenter',
    ]) {
      expect(app).toContain(`const ${component} = NATIVE_STORE_DISTRIBUTION ? null`);
    }
    expect(app).toContain('const wantsStaffPortal = !isNativeStoreBuild()');
    const legal = read('src/screens/LegalPage.tsx');
    expect(legal).toContain('if (NATIVE_STORE_DISTRIBUTION)');
    expect(legal).toContain("GOOGLE_PLAY_DISTRIBUTION ? 'Google Play' : 'App Store'");
  });

  it('does not show links to excluded routes in either native store build', () => {
    for (const path of [
      'src/components/Layout.tsx',
      'src/components/DesktopNav.tsx',
      'src/screens/Home.tsx',
      'src/screens/ChildProfile.tsx',
      'src/screens/Profile.tsx',
      'src/screens/Learn.tsx',
      'src/screens/SignIn.tsx',
    ]) {
      const source = read(path);
      expect(source, path).toContain('isNativeStoreBuild');
      expect(source, path).not.toContain('isAppleAppStoreBuild');
    }
  });

  it('declares Sign in with Apple, Universal Links, and the exact production AASA identity', () => {
    const entitlements = read('ios/App/App/App.entitlements');
    const project = read('ios/App/App.xcodeproj/project.pbxproj');
    const aasa = JSON.parse(read('public/.well-known/apple-app-site-association')) as {
      applinks: { details: Array<{ appID: string; paths: string[] }> };
    };
    const vercel = read('vercel.json');

    expect(entitlements).toContain('com.apple.developer.applesignin');
    expect(entitlements).toContain('applinks:child.acegroup.com.mm');
    expect(project).toContain('CODE_SIGN_ENTITLEMENTS = App/App.entitlements;');
    expect(project).toContain('CURRENT_PROJECT_VERSION = 10;');
    expect(aasa.applinks.details).toEqual([{
      appID: 'QK8ZAZ4RHW.mm.com.acegroup.acechildgrow',
      paths: ['/'],
    }]);
    expect(vercel).toContain('/.well-known/apple-app-site-association');
    expect(vercel).toContain('application/json');
  });

  it('forces parent screens through the parent-audience catalogue gate', () => {
    expect(read('src/app/useOfflineLibrary.ts')).toContain("audience: 'parent'");
    expect(read('src/screens/ContentDetail.tsx')).toContain("audience: 'parent'");
    const library = read('convex/library.ts');
    expect(library).toContain("const parentAudience = args.audience === 'parent'");
    expect(library).toContain('staff: parentAudience ? false : staff');
  });
});
