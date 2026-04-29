import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db';
import { fetchAndCacheJson } from './quranProvider';

describe('fetchAndCacheJson', () => {
  beforeEach(async () => {
    await db.quran_cache.clear();
    vi.restoreAllMocks();
  });

  it('returns cached data before refreshing stale records', async () => {
    await db.quran_cache.put({
      key: '/data/v4/meta/verseKeyData.json?version=3',
      data: { cached: true },
      timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ fresh: true }), { status: 200 }))
    );

    await expect(fetchAndCacheJson('https://static.quranwbw.com/data/v4/meta/verseKeyData.json?version=3')).resolves.toEqual({ cached: true });
  });
});
