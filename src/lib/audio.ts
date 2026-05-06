import type { ReciterId } from './quranwbw/config';
import { QURANWBW_WORD_AUDIO_ENDPOINT, reciters } from './quranwbw/config';
import type { VerseKey } from '../types/quran';

const VERSE_AUDIO_CACHE = 'quran-verse-audio';
const WORD_AUDIO_CACHE = 'quran-word-audio';

export function getVerseAudioUrl(key: VerseKey, reciterId: ReciterId) {
  const [surah, ayah] = key.split(':').map(Number);
  const filename = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  const reciter = reciters[reciterId] ?? reciters['husary-muallim'];
  return `${reciter.baseUrl}/${filename}`;
}

export function getWordAudioUrl(key: `${number}:${number}:${number}`) {
  const [surah, ayah, word] = key.split(':').map(Number);
  return `${QURANWBW_WORD_AUDIO_ENDPOINT}/${surah}/${String(surah).padStart(3, '0')}_${String(ayah).padStart(3, '0')}_${String(word).padStart(3, '0')}.mp3?version=2`;
}

export async function cacheAudio(url: string, type: 'verse' | 'word' = 'verse') {
  if (!('caches' in window)) return url;
  const cache = await caches.open(type === 'verse' ? VERSE_AUDIO_CACHE : WORD_AUDIO_CACHE);
  const cached = await cache.match(url);
  if (cached) return URL.createObjectURL(await cached.blob());

  const response = await fetch(url);
  if (!response.ok) throw new Error('Audio unavailable.');
  await cache.put(url, response.clone());
  return URL.createObjectURL(await response.blob());
}
