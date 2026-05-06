import type { MemorizationPath, MemorizedRangeRecord, ProgressRecord, RangeType } from './db';
import { getVerseKeyData, compareVerseKeys } from './quranwbw/segmentKeys';
import type { VerseKey } from '../types/quran';

export type DraftRange = {
  id: string;
  type: RangeType;
  raw_range: string;
};

export async function normalizeMemorizedRange(input: Omit<DraftRange, 'id'>): Promise<MemorizedRangeRecord> {
  const created_at = new Date().toISOString();

  if (input.type === 'page') {
    const [start_page, end_page] = parseNumberRange(input.raw_range, 1, 604);
    return { type: input.type, raw_range: input.raw_range, start_page, end_page, created_at };
  }

  if (input.type === 'juz') {
    const [start_juz, end_juz] = parseNumberRange(input.raw_range, 1, 30);
    return { type: input.type, raw_range: input.raw_range, start_juz, end_juz, created_at };
  }

  if (input.type === 'surah') {
    const [start_surah, end_surah] = parseNumberRange(input.raw_range, 1, 114);
    return { type: input.type, raw_range: input.raw_range, start_surah, end_surah, created_at };
  }

  const [start, end] = parseAyahRange(input.raw_range);
  return {
    type: input.type,
    raw_range: input.raw_range,
    start_surah: start.surah,
    start_ayah: start.ayah,
    end_surah: end.surah,
    end_ayah: end.ayah,
    created_at
  };
}

export async function pagesFromMemorizedRanges(ranges: MemorizedRangeRecord[]) {
  const data = await getVerseKeyData();
  const pages = new Set<number>();

  for (const range of ranges) {
    if (range.type === 'page') {
      for (let page = range.start_page ?? 1; page <= (range.end_page ?? range.start_page ?? 1); page += 1) pages.add(page);
      continue;
    }

    for (const [key, meta] of Object.entries(data) as Array<[VerseKey, (typeof data)[VerseKey]]>) {
      if (range.type === 'juz' && meta.juz >= (range.start_juz ?? 1) && meta.juz <= (range.end_juz ?? range.start_juz ?? 1)) pages.add(meta.page);
      if (range.type === 'surah') {
        const surah = Number(key.split(':')[0]);
        if (surah >= (range.start_surah ?? 1) && surah <= (range.end_surah ?? range.start_surah ?? 1)) pages.add(meta.page);
      }
      if (range.type === 'ayah' && isVerseInAyahRange(key, range)) pages.add(meta.page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function progressFromPages(pages: number[], path: MemorizationPath): ProgressRecord[] {
  const ordered = [...pages].sort((a, b) => a - b);
  const sabqiPages = path === 'back' ? ordered.slice(0, Math.min(5, ordered.length)) : ordered.slice(-Math.min(5, ordered.length));
  const sabqi = new Set(sabqiPages);
  const now = new Date().toISOString();

  return pages.map((page_number) => ({
    page_number,
    status: sabqi.has(page_number) ? 'sabqi' : 'manzil',
    last_reviewed: now,
    quality_score: 3
  }));
}

function parseNumberRange(value: string, min: number, max: number): [number, number] {
  const match = value.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) throw new Error('Format range harus seperti 1 atau 1-5.');
  const start = clamp(Number(match[1]), min, max);
  const end = clamp(Number(match[2] ?? match[1]), min, max);
  return start <= end ? [start, end] : [end, start];
}

function parseAyahRange(value: string) {
  const match = value.trim().match(/^(\d+)\s*:\s*(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?$/);
  if (!match) throw new Error('Format ayat harus seperti 2:1-2:50 atau 2:1-50.');

  const start = { surah: Number(match[1]), ayah: Number(match[2]) };
  const end = { surah: Number(match[3] ?? match[1]), ayah: Number(match[4] ?? match[2]) };
  const startKey = `${start.surah}:${start.ayah}` as VerseKey;
  const endKey = `${end.surah}:${end.ayah}` as VerseKey;
  return compareVerseKeys(startKey, endKey) <= 0 ? [start, end] : [end, start];
}

function isVerseInAyahRange(key: VerseKey, range: MemorizedRangeRecord) {
  const start = `${range.start_surah ?? 1}:${range.start_ayah ?? 1}` as VerseKey;
  const end = `${range.end_surah ?? range.start_surah ?? 1}:${range.end_ayah ?? range.start_ayah ?? 1}` as VerseKey;
  return compareVerseKeys(key, start) >= 0 && compareVerseKeys(key, end) <= 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
