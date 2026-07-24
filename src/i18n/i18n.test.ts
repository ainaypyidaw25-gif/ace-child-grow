import { describe, it, expect } from 'vitest';
import { mm } from './mm';
import { en } from './en';
import { translate, allKeys } from './index';

describe('translation completeness', () => {
  it('English defines every Myanmar key', () => {
    const missing = Object.keys(mm).filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });
  it('Myanmar defines every English key', () => {
    const missing = Object.keys(en).filter((k) => !(k in mm));
    expect(missing).toEqual([]);
  });
  it('has no empty translation values', () => {
    for (const k of allKeys()) {
      expect(mm[k]?.trim().length, `mm[${k}]`).toBeGreaterThan(0);
      expect(en[k]?.trim().length, `en[${k}]`).toBeGreaterThan(0);
    }
  });
  it('defaults to Myanmar and can switch to English', () => {
    expect(translate('mm', 'nav.home')).toBe('ပင်မ');
    expect(translate('en', 'nav.home')).toBe('Home');
  });
  it('non-diagnostic disclaimer exists in both languages', () => {
    expect(translate('mm', 'result.disclaimer.nonDiagnostic')).toContain('မဟုတ်ပါ');
    expect(translate('en', 'result.disclaimer.nonDiagnostic')).toMatch(/not a diagnosis/i);
  });
});
