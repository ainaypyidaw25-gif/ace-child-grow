import { describe, expect, it } from 'vitest';
import {
  findReviewContentMatches,
  formatReviewFieldReference,
  normalizeReviewSearchText,
  type ReviewSearchRow,
} from '../../../convex/lib/reviewSearch';

const readingLesson: ReviewSearchRow = {
  slug: 'lsn_reading_together',
  type: 'lesson',
  titleMm: 'အတူတူ စာဖတ်ခြင်း',
  titleEn: 'Reading together',
  summaryMm: 'နေ့စဉ်စာဖတ်ရန်',
  summaryEn: 'Read every day',
  category: 'language_development',
  clinicalStatus: 'clinical_review',
  reviewRevision: 2,
  searchText: 'အတူတူ စာဖတ်ခြင်း reading together အနှစ်သက်ဆုံးကို ထပ်ခါဖတ် re-read favorites',
  data: {
    quiz: [{
      options: [
        { mm: 'အနှစ်သက်ဆုံးကို ထပ်ခါဖတ်', en: 're-read favorites' },
        { mm: 'အသစ်များစွာ ဝယ်', en: 'buy many new books' },
      ],
    }],
  },
};

describe('paper review field lookup', () => {
  it('finds Myanmar wording inside a nested field and returns its exact editor path', () => {
    const results = findReviewContentMatches([readingLesson], 'ထပ်ခါဖတ်');

    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('lsn_reading_together');
    expect(results[0].matches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'data.quiz.0.options.0.mm',
        reference: 'quiz[1].options[1].mm',
        language: 'mm',
        value: 'အနှစ်သက်ဆုံးကို ထပ်ခါဖတ်',
      }),
    ]));
  });

  it('accepts the human PDF field reference without zero-based array numbers', () => {
    const results = findReviewContentMatches([readingLesson], '4 quiz 1 options 1');

    expect(results[0].matches.map((match) => match.reference)).toEqual([
      'quiz[1].options[1].mm',
      'quiz[1].options[1].en',
    ]);
  });

  it('ranks an exact slug lookup and still returns the record when no field text matches', () => {
    const other = { ...readingLesson, slug: 'lsn_reading_together_extra', titleMm: 'အခြား', titleEn: 'Other' };
    const results = findReviewContentMatches([other, readingLesson], 'lsn_reading_together');

    expect(results.map((result) => result.slug)).toEqual(['lsn_reading_together']);
    expect(results[0].matches).toEqual([]);
  });

  it('normalizes punctuation, PDF separators, underscores, and invisible characters', () => {
    expect(normalizeReviewSearchText(' quiz·1.options[1]\u200b ')).toBe('quiz 1 options 1');
    expect(normalizeReviewSearchText('lsn_reading_together')).toBe('lsn reading together');
    expect(formatReviewFieldReference(['data', 'quiz', '0', 'options', '1', 'mm']))
      .toBe('quiz[1].options[2].mm');
  });
});
