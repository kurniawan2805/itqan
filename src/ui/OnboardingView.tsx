import { useEffect, useMemo, useState } from 'react';
import { db, type DailyTargetUnit, type MemorizationPath, type RangeType, type SettingsRecord } from '../lib/db';
import { reciters, wordTranslations, type ReciterId, type WordTranslationId } from '../lib/quranwbw/config';
import { progressFromPages, pagesFromMemorizedRanges, normalizeMemorizedRange, type DraftRange } from '../lib/rangeParser';

export default function OnboardingView({ settings, onDone }: { settings: SettingsRecord; onDone: () => void }) {
  const [name, setName] = useState(settings.display_name ?? '');
  const [path, setPath] = useState<MemorizationPath>(settings.memorization_path);
  const [targetUnit, setTargetUnit] = useState<DailyTargetUnit>(settings.daily_target_unit);
  const [targetAmount, setTargetAmount] = useState(settings.daily_target);
  const [finishDate, setFinishDate] = useState(settings.target_finish_date ?? '');
  const [fridayMode, setFridayMode] = useState(settings.friday_mode);
  const [sabaqReciter, setSabaqReciter] = useState<ReciterId>(settings.sabaq_reciter as ReciterId);
  const [reviewReciter, setReviewReciter] = useState<ReciterId>(settings.review_reciter as ReciterId);
  const [translation, setTranslation] = useState<WordTranslationId>(settings.word_translation);
  const [nextPage, setNextPage] = useState(settings.custom_next_page ?? (settings.memorization_path === 'back' ? 604 : 1));
  const [rangeType, setRangeType] = useState<RangeType>('page');
  const [rangeValue, setRangeValue] = useState('');
  const [ranges, setRanges] = useState<DraftRange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const quickSuggestedNextPage = useMemo(() => suggestNextPage(ranges, path, settings.custom_next_page), [ranges, path, settings.custom_next_page]);
  const [suggestedNextPage, setSuggestedNextPage] = useState(quickSuggestedNextPage);

  useEffect(() => {
    let cancelled = false;

    async function updateSuggestion() {
      try {
        const normalized = await Promise.all(ranges.map(({ type, raw_range }) => normalizeMemorizedRange({ type, raw_range })));
        const pages = await pagesFromMemorizedRanges(normalized);
        const next = suggestNextPageFromPages(pages, path, settings.custom_next_page);
        if (!cancelled) {
          setSuggestedNextPage(next);
          setNextPage(next);
        }
      } catch {
        if (!cancelled) {
          setSuggestedNextPage(quickSuggestedNextPage);
          setNextPage(quickSuggestedNextPage);
        }
      }
    }

    void updateSuggestion();
    return () => {
      cancelled = true;
    };
  }, [ranges, path, settings.custom_next_page, quickSuggestedNextPage]);

  function addRange() {
    const raw_range = rangeValue.trim();
    if (!raw_range) return;
    setRanges((value) => [...value, { id: `${Date.now()}-${Math.random()}`, type: rangeType, raw_range }]);
    setRangeValue('');
  }

  async function finish() {
    setSaving(true);
    setError(null);

    try {
      const normalized = await Promise.all(ranges.map(({ type, raw_range }) => normalizeMemorizedRange({ type, raw_range })));
      const pages = await pagesFromMemorizedRanges(normalized);
      const progress = progressFromPages(pages, path);

      await db.transaction('rw', db.settings, db.memorized_ranges, db.progress, async () => {
        await db.memorized_ranges.clear();
        if (normalized.length) await db.memorized_ranges.bulkAdd(normalized);
        await db.progress.clear();
        if (progress.length) await db.progress.bulkAdd(progress);
        await db.settings.put({
          ...settings,
          display_name: name.trim(),
          memorization_path: path,
          daily_target_unit: targetUnit,
          daily_target: Math.max(1, Number(targetAmount) || 1),
          custom_next_page: clampPage(nextPage),
          target_finish_date: finishDate,
          friday_mode: fridayMode,
          sabaq_reciter: sabaqReciter,
          review_reciter: reviewReciter,
          reciter: reviewReciter === 'husary' || reviewReciter === 'afasy' ? reviewReciter : 'husary',
          word_translation: translation,
          onboarding_complete: true
        });
      });

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan setup.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="onboarding-screen">
      <header className="hero">
        <div>
          <p className="eyebrow">Setup Awal</p>
          <h1>Siapkan jalur hafalan</h1>
          <p>Atur target, audio, dan hafalan yang sudah ada. Semua bisa diubah lagi nanti.</p>
        </div>
      </header>

      <div className="onboarding-grid">
        <label>
          Nama panggilan
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Ahmad" />
        </label>

        <label>
          Jalur hafalan
          <select value={path} onChange={(event) => setPath(event.target.value as MemorizationPath)}>
            <option value="front">Dari depan</option>
            <option value="back">Dari belakang</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label>
          Target harian
          <div className="inline-fields">
            <input type="number" min="1" value={targetAmount} onChange={(event) => setTargetAmount(Number(event.target.value))} />
            <select value={targetUnit} onChange={(event) => setTargetUnit(event.target.value as DailyTargetUnit)}>
              <option value="lines">Lines</option>
              <option value="half_page">1/2 page</option>
              <option value="page">Page</option>
            </select>
          </div>
        </label>

        <label>
          Target selesai (opsional)
          <input type="date" value={finishDate} onChange={(event) => setFinishDate(event.target.value)} />
        </label>

        <label>
          Mulai hafalan baru dari halaman
          <div className="inline-fields">
            <input type="number" min="1" max="604" value={nextPage} onChange={(event) => setNextPage(Number(event.target.value))} />
            <button type="button" className="secondary-inline" onClick={() => setNextPage(suggestedNextPage)}>Pakai saran {suggestedNextPage}</button>
          </div>
        </label>

        <label>
          Jumat
          <select value={fridayMode} onChange={(event) => setFridayMode(event.target.value as SettingsRecord['friday_mode'])}>
            <option value="review_only">Khusus murajaah dekat + jauh</option>
            <option value="review_or_new">Boleh hafalan baru kalau perlu</option>
          </select>
        </label>

        <label>
          Bahasa terjemahan
          <select value={translation} onChange={(event) => setTranslation(Number(event.target.value) as WordTranslationId)}>
            {Object.values(wordTranslations).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>

        <label>
          Qari hafalan baru
          <select value={sabaqReciter} onChange={(event) => setSabaqReciter(event.target.value as ReciterId)}>
            {Object.values(reciters).map((reciter) => <option value={reciter.id} key={reciter.id}>{reciter.label}</option>)}
          </select>
        </label>

        <label>
          Qari murajaah
          <select value={reviewReciter} onChange={(event) => setReviewReciter(event.target.value as ReciterId)}>
            {Object.values(reciters).map((reciter) => <option value={reciter.id} key={reciter.id}>{reciter.label}</option>)}
          </select>
        </label>
      </div>

      <section className="range-card">
        <div>
          <p className="eyebrow">Hafalan yang sudah ada</p>
          <h2>Tambah range</h2>
          <p>Masukkan beberapa range. Contoh page `111-200`, juz `29-30`, surah `92-114`, atau ayah `2:1-2:50`.</p>
        </div>
        <div className="range-form">
          <select value={rangeType} onChange={(event) => setRangeType(event.target.value as RangeType)}>
            <option value="page">Page</option>
            <option value="juz">Juz</option>
            <option value="surah">Surah</option>
            <option value="ayah">Ayah</option>
          </select>
          <input value={rangeValue} onChange={(event) => setRangeValue(event.target.value)} placeholder="111-200 atau 2:1-2:50" />
          <button onClick={addRange} type="button">+ Range</button>
        </div>
        <div className="range-list">
          {ranges.map((range) => (
            <button key={range.id} type="button" onClick={() => setRanges((value) => value.filter((item) => item.id !== range.id))}>
              {range.type}: {range.raw_range} remove
            </button>
          ))}
          {!ranges.length && <p>Belum ada range. Boleh kosong kalau mulai dari awal.</p>}
        </div>
      </section>

      {error && <p className="error-box">{error}</p>}
      <button className="primary-action" onClick={() => void finish()} disabled={saving}>{saving ? 'Menyimpan...' : 'Mulai Itqan'}</button>
    </section>
  );
}

function suggestNextPage(ranges: DraftRange[], path: MemorizationPath, fallback = 1) {
  const pageRanges = ranges.filter((range) => range.type === 'page').map((range) => parsePageRange(range.raw_range)).filter(Boolean) as Array<[number, number]>;
  if (!pageRanges.length) return path === 'back' ? 604 : clampPage(fallback || 1);

  const minPage = Math.min(...pageRanges.map(([start]) => start));
  const maxPage = Math.max(...pageRanges.map(([, end]) => end));
  if (path === 'back') return clampPage(minPage - 1);
  if (path === 'custom') return clampPage(fallback || 1);
  return clampPage(maxPage + 1);
}

function suggestNextPageFromPages(pages: number[], path: MemorizationPath, fallback = 1) {
  if (!pages.length) return path === 'back' ? 604 : clampPage(fallback || 1);
  const minPage = Math.min(...pages);
  const maxPage = Math.max(...pages);
  if (path === 'back') return clampPage(minPage - 1);
  if (path === 'custom') return clampPage(fallback || 1);
  return clampPage(maxPage + 1);
}

function parsePageRange(value: string): [number, number] | null {
  const match = value.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) return null;
  const start = clampPage(Number(match[1]));
  const end = clampPage(Number(match[2] ?? match[1]));
  return start <= end ? [start, end] : [end, start];
}

function clampPage(page: number) {
  return Math.min(604, Math.max(1, Number(page) || 1));
}
