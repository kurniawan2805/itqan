export const QURANWBW_STATIC_ENDPOINT = 'https://static.quranwbw.com/data/v4';
export const QURANWBW_WORD_AUDIO_ENDPOINT = 'https://audios.quranwbw.com/words';

export const quranwbwUrls = {
  verseKeyData: `${QURANWBW_STATIC_ENDPOINT}/meta/verseKeyData.json?version=3`,
  arabicWords: `${QURANWBW_STATIC_ENDPOINT}/words-data/arabic/2.json?version=5`,
  englishWords: `${QURANWBW_STATIC_ENDPOINT}/words-data/translations/4.json?version=1`,
  transliterationWords: `${QURANWBW_STATIC_ENDPOINT}/words-data/transliterations/1.json?version=1`,
  mushafFont: `${QURANWBW_STATIC_ENDPOINT}/fonts/Hafs/KFGQPC-v4`
};

export function getMushafFontUrl(pageNumber: number) {
  const paddedPage = String(pageNumber).padStart(3, '0');
  return `${quranwbwUrls.mushafFont}/COLRv1/QCF4${paddedPage}_COLOR-Regular.woff2?version=12`;
}

export const reciters = {
  afasy: {
    id: 'afasy',
    label: 'Mishary Alafasy',
    baseUrl: 'https://everyayah.com/data/Alafasy_128kbps'
  },
  husary: {
    id: 'husary',
    label: 'Mahmoud Khalil Al-Husary',
    baseUrl: 'https://everyayah.com/data/Husary_128kbps'
  }
} as const;

export type ReciterId = keyof typeof reciters;
