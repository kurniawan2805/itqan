import { describe, expect, it, vi } from 'vitest';
import { getPageVerseKeys } from './segmentKeys';

vi.mock('./quranProvider', () => ({
  fetchAndCacheJson: vi.fn(async () => ({
    '1:1': { page: 1, juz: 1, hizb: 1, words: 4 },
    '1:2': { page: 1, juz: 1, hizb: 1, words: 4 },
    '2:1': { page: 2, juz: 1, hizb: 1, words: 5 },
    '18:75': { page: 255, juz: 15, hizb: 30, words: 9 },
    '114:6': { page: 604, juz: 30, hizb: 60, words: 4 }
  }))
}));

describe('getPageVerseKeys', () => {
  it('returns sorted keys for known Mushaf pages', async () => {
    await expect(getPageVerseKeys(1)).resolves.toEqual(['1:1', '1:2']);
    await expect(getPageVerseKeys(2)).resolves.toEqual(['2:1']);
    await expect(getPageVerseKeys(255)).resolves.toEqual(['18:75']);
    await expect(getPageVerseKeys(604)).resolves.toEqual(['114:6']);
  });

  it('rejects invalid pages', async () => {
    await expect(getPageVerseKeys(0)).rejects.toThrow('between 1 and 604');
    await expect(getPageVerseKeys(605)).rejects.toThrow('between 1 and 604');
  });
});
