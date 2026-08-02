import { describe, expect, it } from 'vitest';
import { matchesSearchQuery, normalizeSearchText } from '../search';

describe('shared client-side search', () => {
  it('normalizes case, compatibility characters and repeated whitespace', () => {
    expect(normalizeSearchText('  ＡＣＥ   Child  ')).toBe('ace child');
  });

  it('finds Myanmar and English content in the same record', () => {
    const values = ['ကလေးဖွံ့ဖြိုးမှု', 'Child development', 'sn-development'];
    expect(matchesSearchQuery('ဖွံ့ဖြိုး', values)).toBe(true);
    expect(matchesSearchQuery('DEVELOPMENT', values)).toBe(true);
    expect(matchesSearchQuery('sn-development', values)).toBe(true);
  });

  it('requires every query word but allows them to come from different fields', () => {
    expect(matchesSearchQuery('activity safety', ['activity', ['clinical', 'safety']])).toBe(true);
    expect(matchesSearchQuery('activity medication', ['activity', ['clinical', 'safety']])).toBe(false);
  });

  it('matches an empty query without excluding any record', () => {
    expect(matchesSearchQuery('   ', [])).toBe(true);
  });
});
