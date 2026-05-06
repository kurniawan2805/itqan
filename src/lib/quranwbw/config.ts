export const QURANWBW_STATIC_ENDPOINT = 'https://static.quranwbw.com/data/v4';
export const QURANWBW_WORD_AUDIO_ENDPOINT = 'https://audios.quranwbw.com/words';

export const quranwbwUrls = {
  verseKeyData: `${QURANWBW_STATIC_ENDPOINT}/meta/verseKeyData.json?version=3`,
  arabicWords: `${QURANWBW_STATIC_ENDPOINT}/words-data/arabic/2.json?version=5`,
  englishWords: `${QURANWBW_STATIC_ENDPOINT}/words-data/translations/1.json?version=4`,
  indonesianWords: `${QURANWBW_STATIC_ENDPOINT}/words-data/translations/4.json?version=1`,
  transliterationWords: `${QURANWBW_STATIC_ENDPOINT}/words-data/transliterations/1.json?version=1`,
  mushafFont: `${QURANWBW_STATIC_ENDPOINT}/fonts/Hafs/KFGQPC-v4`
};

export const wordTranslations = {
  4: { id: 4, label: 'Indonesian', url: quranwbwUrls.indonesianWords },
  1: { id: 1, label: 'English', url: quranwbwUrls.englishWords }
} as const;

export type WordTranslationId = keyof typeof wordTranslations;

export function getWordTranslationUrl(id: WordTranslationId) {
  return wordTranslations[id].url;
}

export function getMushafFontUrl(pageNumber: number) {
  const paddedPage = String(pageNumber).padStart(3, '0');
  return `${quranwbwUrls.mushafFont}/COLRv1/QCF4${paddedPage}_COLOR-Regular.woff2?version=12`;
}

export function getChapterHeaderFontUrl() {
  return `${QURANWBW_STATIC_ENDPOINT}/fonts/Extras/chapter-headers/NeoHeader_COLOR-Regular.woff2?version=12`;
}

export function getBismillahFontUrl() {
  return `${QURANWBW_STATIC_ENDPOINT}/fonts/Extras/bismillah/QCF_Bismillah_COLOR-Regular.woff2?version=13`;
}

export const reciters = {
  'husary-muallim': {
    id: 'husary-muallim',
    label: 'Husary Muallim',
    category: 'Hafalan',
    baseUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps'
  },
  'minshawi-teacher': {
    id: 'minshawi-teacher',
    label: 'Minshawi Muallim with Kids',
    category: 'Hafalan',
    baseUrl: 'https://everyayah.com/data/Minshawy_Teacher_128kbps'
  },
  'minshawi-murattal': {
    id: 'minshawi-murattal',
    label: 'Minshawi Murattal',
    category: 'Hafalan',
    baseUrl: 'https://everyayah.com/data/Minshawy_Murattal_128kbps'
  },
  'ayman-sowaid': {
    id: 'ayman-sowaid',
    label: 'Ayman Sowaid',
    category: 'Hafalan',
    baseUrl: 'https://everyayah.com/data/Ayman_Sowaid_64kbps'
  },
  afasy: {
    id: 'afasy',
    label: 'Mishary Alafasy',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Alafasy_128kbps'
  },
  husary: {
    id: 'husary',
    label: 'Mahmoud Khalil Al-Husary',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Husary_128kbps'
  },
  'maher-muaiqly': {
    id: 'maher-muaiqly',
    label: 'Maher Al-Muaiqly',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Maher_AlMuaiqly_64kbps'
  },
  'saad-ghamdi': {
    id: 'saad-ghamdi',
    label: 'Saad Al-Ghamdi',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Ghamadi_40kbps'
  },
  shuraim: {
    id: 'shuraim',
    label: 'Saud Al-Shuraim',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Saood_ash-Shuraym_64kbps'
  },
  sudais: {
    id: 'sudais',
    label: 'Abdurrahman As-Sudais',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_64kbps'
  },
  hudhaify: {
    id: 'hudhaify',
    label: 'Hudhaify',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Hudhaify_64kbps'
  },
  'abu-bakr-shatri': {
    id: 'abu-bakr-shatri',
    label: 'Abu Bakr Ash-Shatri',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps'
  },
  'yasser-dussary': {
    id: 'yasser-dussary',
    label: 'Yasser Ad-Dussary',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps'
  },
  'abdul-basit-murattal': {
    id: 'abdul-basit-murattal',
    label: 'Abdul Basit Murattal',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_64kbps'
  },
  'abdul-basit-mujawwad': {
    id: 'abdul-basit-mujawwad',
    label: 'Abdul Basit Mujawwad',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps'
  },
  'minshawi-mujawwad': {
    id: 'minshawi-mujawwad',
    label: 'Minshawi Mujawwad',
    category: 'Murajaah',
    baseUrl: 'https://everyayah.com/data/Minshawy_Mujawwad_192kbps'
  }
} as const;

export type ReciterId = keyof typeof reciters;
