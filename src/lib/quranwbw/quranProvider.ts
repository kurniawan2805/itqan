import { db } from '../db';

const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;
const inFlight = new Map<string, Promise<unknown>>();

function cacheKeyFromUrl(url: string) {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export async function fetchAndCacheJson<T>(url: string): Promise<T> {
  const key = cacheKeyFromUrl(url);
  const cached = await db.quran_cache.get(key);

  if (cached) {
    if (Date.now() - cached.timestamp > MAX_CACHE_AGE && !inFlight.has(key)) {
      inFlight.set(key, refreshJson(url, key));
    }
    return cached.data as T;
  }

  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;

  const request = refreshJson(url, key);
  inFlight.set(key, request);
  return request as Promise<T>;
}

async function refreshJson(url: string, key: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch QuranWBW data: ${response.status}`);
    const data = await response.json();
    await db.quran_cache.put({ key, data, timestamp: Date.now() });
    return data;
  } finally {
    inFlight.delete(key);
  }
}

export async function getQuranCacheStatus(keyIncludes: string) {
  const records = await db.quran_cache.where('key').startsWith('/data/v4').toArray();
  return records.some((record) => record.key.includes(keyIncludes));
}
