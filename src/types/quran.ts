export type VerseKey = `${number}:${number}`;

export type QuranWord = {
  arabic: string;
  translation?: string;
  transliteration?: string;
  line: number;
  end?: string;
};

export type QuranVerse = {
  key: VerseKey;
  meta: {
    surah: number;
    ayah: number;
    page: number;
    juz: number;
    hizb: number;
    words: number;
  };
  words: QuranWord[];
};

export type MushafPage = {
  pageNumber: number;
  verses: QuranVerse[];
  chapters: Array<{ surah: number; firstAyah: number; line: number }>;
  startingLine: number;
  endingLine: number;
};
