import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SourceTransparency copy', () => {
  const source = readFileSync('src/components/SourceTransparency.tsx', 'utf8');

  it('leads with included value and keeps attribution without defensive product claims', () => {
    expect(source).toContain('ACE Premium တွင် ပါဝင်သည့် ဝန်ဆောင်မှုများ');
    expect(source).toContain('CDC Milestone Tracker');
    expect(source).not.toContain('အတည်ပြုထောက်ခံထားခြင်း မရှိပါ');
    expect(source).not.toContain('We do not use CDC branding');
  });
});
