import type { VerseKey } from '../../types/quran';
import { quranwbwUrls } from './config';
import { fetchAndCacheJson } from './quranProvider';

type VerseMeta = {
  page: number;
  juz: number;
  hizb: number;
  words: number;
};

export type VerseKeyData = Record<VerseKey, VerseMeta>;

export async function getVerseKeyData() {
  return fetchAndCacheJson<VerseKeyData>(quranwbwUrls.verseKeyData);
}

export async function getPageVerseKeys(pageNumber: number) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 604) {
    throw new RangeError('Mushaf page must be between 1 and 604.');
  }

  const data = await getVerseKeyData();
  return Object.entries(data)
    .filter(([, meta]) => meta.page === pageNumber)
    .sort(([a], [b]) => compareVerseKeys(a as VerseKey, b as VerseKey))
    .map(([key]) => key as VerseKey);
}

export function compareVerseKeys(a: VerseKey, b: VerseKey) {
  const [surahA, ayahA] = a.split(':').map(Number);
  const [surahB, ayahB] = b.split(':').map(Number);
  return surahA - surahB || ayahA - ayahB;
}
