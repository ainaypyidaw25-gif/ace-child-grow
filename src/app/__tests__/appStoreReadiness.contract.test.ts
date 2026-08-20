import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('App Store review readiness contract', () => {
  it('keeps staff, unfinished and external-payment routes out of the App Store build', () => {
    const app = read('src/app/App.tsx');
    expect(app).toContain("const APP_STORE_DISTRIBUTION = import.meta.env.VITE_DISTRIBUTION === 'app-store'");
    for (const component of [
      'AdminReviewQueue', 'ContentReviewWorkspace', 'SubscriptionPlans', 'PaymentStatus',
      'OfflineDownloads', 'Report', 'Appointments', 'WeeklyPlan', 'HopeCenter',
    ]) {
      expect(app).toContain(`const ${component} = APP_STORE_DISTRIBUTION ? null`);
    }
    expect(app).toContain('const wantsStaffPortal = !isAppleAppStoreBuild()');
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
    expect(project).toContain('CURRENT_PROJECT_VERSION = 11;');
    expect(aasa.applinks.details).toEqual([{
      appID: 'QK8ZAZ4RHW.mm.com.acegroup.acechildgrow',
      paths: ['/'],
    }]);
    expect(vercel).toContain('/.well-known/apple-app-site-association');
    expect(vercel).toContain('application/json');
  });

  it('opens native OAuth inside Safari View Controller instead of the external browser', () => {
    const platform = read('src/app/platform.ts');
    const packageJson = JSON.parse(read('package.json')) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies['@capacitor/browser']).toBeTruthy();
    expect(platform).toContain("import { Browser } from '@capacitor/browser'");
    expect(platform).toContain('await options.openBrowser(result.redirect)');
    expect(platform).toContain('Browser.open({');
    expect(platform).toContain('Browser.close()');
    expect(platform).not.toContain('window.location.href =');
  });

  it('forces parent screens through the parent-audience catalogue gate', () => {
    expect(read('src/app/useOfflineLibrary.ts')).toContain("audience: 'parent'");
    expect(read('src/screens/ContentDetail.tsx')).toContain("audience: 'parent'");
    const library = read('convex/library.ts');
    expect(library).toContain("const parentAudience = args.audience === 'parent'");
    expect(library).toContain('staff: parentAudience ? false : staff');
  });
});
