import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { referralStatusLabel } from '../AdminBilling';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('admin and reviewer locale labels', () => {
  it('localises every referral status option', () => {
    expect(referralStatusLabel('registered', 'mm')).toBe('စာရင်းသွင်းထား');
    expect(referralStatusLabel('qualified', 'en')).toBe('Qualified');
    expect(referralStatusLabel('rewarded', 'mm')).toBe('အကျိုးခံစားခွင့်ပေးပြီး');
    expect(referralStatusLabel('rejected', 'en')).toBe('Rejected');
  });

  it('keeps reviewer field and workspace labels locale-aware', () => {
    const source = read('src/screens/ContentReviewWorkspace.tsx');
    expect(source).not.toContain('<span>English title</span>');
    expect(source).not.toContain('<span>English summary</span>');
    expect(source).toContain("L('မြန်မာခေါင်းစဉ်', 'Myanmar title')");
    expect(source).toContain("L('အင်္ဂလိပ်အနှစ်ချုပ်', 'English summary')");
    expect(source).toContain("L('ACE သုံးသပ်ရေးနေရာ', 'ACE Review Workspace')");
  });

  it('localises owner-priority and evidence report labels', () => {
    expect(read('src/screens/ownerPriority/OwnerPriorityView.tsx'))
      .toContain("L('အန္တရာယ်အုပ်စု', 'Risk class')");
    expect(read('src/screens/ownerPriority/ClassificationImportPreview.tsx'))
      .toContain("L('မူကွဲ', 'rev')");
    expect(read('src/screens/EvidenceAdmin.tsx'))
      .toContain("locale === 'mm' ? 'ခု ထပ်ရှိသည်' : 'more'");
  });

  it('localises CMS and billing form placeholders', () => {
    const library = read('src/screens/LibraryAdmin.tsx');
    const billing = read('src/screens/AdminBilling.tsx');
    expect(library).not.toContain('placeholder="English description *"');
    expect(library).not.toContain('placeholder="English transcript (optional)"');
    expect(library).toContain("L('အင်္ဂလိပ်အသံစာသား (မဖြည့်လည်းရ)', 'English transcript (optional)')");
    expect(billing).not.toContain('placeholder="English method name"');
    expect(billing).not.toContain('<th className="px-3 py-2">Status</th>');
    expect(billing).toContain("L('ဝန်ဆောင်မှုပေးသူ', 'Provider')");
  });
});
