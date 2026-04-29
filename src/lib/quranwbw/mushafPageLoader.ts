import type { MushafPage, QuranVerse, VerseKey } from '../../types/quran';
import { quranwbwUrls } from './config';
import { fetchAndCacheJson } from './quranProvider';
import { getPageVerseKeys, getVerseKeyData } from './segmentKeys';

type RawWordData = Record<string, Record<string, [string[], number[], string[]?]>>;
type RawAuxData = Record<string, Record<string, [string[]]>>;

export async function loadMushafPage(pageNumber: number): Promise<MushafPage> {
  const [keys, verseKeyData, arabicData, translationData, transliterationData] = await Promise.all([
    getPageVerseKeys(pageNumber),
    getVerseKeyData(),
    fetchAndCacheJson<RawWordData>(quranwbwUrls.arabicWords),
    fetchAndCacheJson<RawAuxData>(quranwbwUrls.englishWords),
    fetchAndCacheJson<RawAuxData>(quranwbwUrls.transliterationWords)
  ]);

  const verses = keys.map((key): QuranVerse => {
    const [surah, ayah] = key.split(':').map(Number);
    const rawArabic = arabicData[surah]?.[ayah];
    const rawTranslation = translationData[surah]?.[ayah]?.[0] ?? [];
    const rawTransliteration = transliterationData[surah]?.[ayah]?.[0] ?? [];
    const [arabic = [], lines = [], endIcons = []] = rawArabic ?? [];
    const meta = verseKeyData[key];

    return {
      key,
      meta: {
        surah,
        ayah,
        page: meta.page,
        juz: meta.juz,
        hizb: meta.hizb,
        words: meta.words
      },
      words: arabic.map((word, index) => ({
        arabic: word,
        translation: rawTranslation[index],
        transliteration: rawTransliteration[index],
        line: lines[index] ?? 1,
        end: index === arabic.length - 1 ? endIcons[0] : undefined
      }))
    };
  });

  const allLines = verses.flatMap((verse) => verse.words.map((word) => word.line));
  const startingLine = Math.min(...allLines);
  const endingLine = Math.max(...allLines);
  const chapters = findChapterStarts(verses);

  return { pageNumber, verses, chapters, startingLine, endingLine };
}

function findChapterStarts(verses: QuranVerse[]) {
  const starts: MushafPage['chapters'] = [];
  const seen = new Set<number>();

  for (const verse of verses) {
    if (seen.has(verse.meta.surah)) continue;
    seen.add(verse.meta.surah);
    starts.push({
      surah: verse.meta.surah,
      firstAyah: verse.meta.ayah,
      line: verse.words[0]?.line ?? 1
    });
  }

  return starts;
}

export function getVerseKeysFromPage(page: MushafPage): VerseKey[] {
  return page.verses.map((verse) => verse.key);
}
