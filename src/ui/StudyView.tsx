import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Link, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { cacheAudio, getVerseAudioUrl, getWordAudioUrl } from '../lib/audio';
import { db, type SettingsRecord } from '../lib/db';
import type { DailyTarget } from '../lib/scheduler';
import { getMushafFontUrl } from '../lib/quranwbw/config';
import { loadMushafPage } from '../lib/quranwbw/mushafPageLoader';
import type { ReciterId } from '../lib/quranwbw/config';
import { getSurahName } from '../lib/quranMeta';
import type { VerseKey } from '../types/quran';

type StudyItem = {
  id: string;
  label: string;
  arabic: string;
  translation: string;
  words: Array<{ arabic: string; translation?: string; key?: `${number}:${number}:${number}`; verseKey?: VerseKey; end?: string }>;
  verseKeys: VerseKey[];
  wordKeys?: `${number}:${number}:${number}`[];
  page: number;
  surah: number;
  ayahLabel: string;
  ayahEnd?: string;
  juz: number;
};

const loadedStudyFonts = new Map<number, Promise<void>>();
type AudioMode = 'verse' | 'word';

export default function StudyView({ target, settings, onBack, onDone }: { target: DailyTarget; settings: SettingsRecord; onBack: () => void; onDone: () => void }) {
  const [items, setItems] = useState<StudyItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>(target.type === 'sabaq' && settings.daily_target_unit === 'lines' ? 'word' : 'verse');
  const [activeWordKey, setActiveWordKey] = useState<string | null>(null);
  const [activeVerseKeys, setActiveVerseKeys] = useState<Set<VerseKey>>(new Set());
  const [activeTab, setActiveTab] = useState<'meaning' | 'context' | 'connected' | 'similar'>('meaning');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIndex(0);
    setCompletedItemIds(new Set());
    setFinished(false);
    setActiveWordKey(null);
    setActiveVerseKeys(new Set());
    setAudioMode(target.type === 'sabaq' && settings.daily_target_unit === 'lines' ? 'word' : 'verse');

    buildStudyItems(target, settings)
      .then((nextItems) => {
        if (!cancelled) setItems(nextItems);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat target.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, [target, settings]);

  const item = items[index];
  const progress = items.length ? ((index + 1) / items.length) * 100 : 0;
  const reciter = (target.type === 'sabaq' ? settings.sabaq_reciter : settings.review_reciter) as ReciterId;

  useEffect(() => {
    if (item) void loadStudyFont(item.page);
  }, [item]);

  async function playCurrent(repeats = target.type === 'sabaq' ? 5 : 1) {
    if (!item || playing) return;
    setPlaying(true);
    try {
      await playItem(item, repeats);
    } finally {
      setPlaying(false);
    }
  }

  async function playRange() {
    setPlaying(true);
    for (let current = index; current < items.length; current += 1) {
      setIndex(current);
      await playItem(items[current], 1);
    }
    setPlaying(false);
  }

  async function playItem(nextItem: StudyItem, repeats: number) {
    for (let repeat = 0; repeat < repeats; repeat += 1) {
      if (audioMode === 'word' && nextItem.wordKeys?.length) {
        setActiveVerseKeys(new Set());
        for (const wordKey of nextItem.wordKeys) {
          setActiveWordKey(wordKey);
          await playUrl(getWordAudioUrl(wordKey), 'word');
        }
        setActiveWordKey(null);
      } else {
        setActiveWordKey(null);
        for (const verseKey of nextItem.verseKeys) {
          setActiveVerseKeys(new Set([verseKey]));
          await playUrl(getVerseAudioUrl(verseKey, reciter), 'verse');
        }
        setActiveVerseKeys(new Set());
      }
    }
  }

  async function playUrl(url: string, type: 'verse' | 'word') {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = await cacheAudio(url, type);
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
    });
  }

  async function markDone() {
    if (!item) return;
    const nextCompleted = new Set(completedItemIds);
    nextCompleted.add(item.id);
    setCompletedItemIds(nextCompleted);

    if (index < items.length - 1) {
      setIndex((value) => value + 1);
      return;
    }

    await upsertProgressForTarget(items, target.type);
    setFinished(true);
    onDone();
  }

  return (
    <section className="study-screen">
      <header className="study-header">
        <button className="icon-command" onClick={onBack} aria-label="Kembali"><ChevronLeft size={18} /></button>
        <div className="study-progress"><span style={{ width: `${progress}%` }} /></div>
        <span>{items.length ? `${index + 1}/${items.length}` : '0/0'}</span>
      </header>

      {loading && <p className="loading">Memuat target...</p>}
      {error && <p className="error-box">{error}</p>}

      {item && (
        <>
          <div className="study-title">
            <p>{getSurahName(item.surah)}</p>
            <h1>{target.type === 'sabaq' ? 'Ready to Memorize' : target.label}</h1>
            <p>{getSurahName(item.surah)} · {item.ayahLabel} · {item.label}</p>
          </div>

          <article className="study-arabic-card" style={{ '--mushaf-font-family': `p${item.page}` } as CSSProperties}>
            <style>{`
              @font-palette-values --itqan-study-words-${item.page}{font-family:p${item.page};base-palette:3;}
              @font-palette-values --itqan-study-ayah-${item.page}{font-family:p${item.page};base-palette:0;override-colors:10 #008000,11 #b78b14,12 #f8efd3,13 #000000;}
              .study-arabic-card p{font-palette:--itqan-study-words-${item.page};}
              .study-ayah-end{font-palette:--itqan-study-ayah-${item.page};}
            `}</style>
            <p>
              {item.words.map((word, wordIndex) => (
                <button
                  className={`study-word ${word.key === activeWordKey || (word.verseKey && activeVerseKeys.has(word.verseKey)) ? 'active' : ''}`}
                  key={`${word.key ?? word.arabic}-${wordIndex}`}
                  onClick={() => word.key && void playUrl(getWordAudioUrl(word.key), 'word')}
                  title={word.translation || undefined}
                  aria-label={word.translation ? `${word.arabic}: ${word.translation}` : word.arabic}
                >
                  {word.arabic}
                  {word.end && <span className="study-ayah-end">{word.end}</span>}
                </button>
              ))}
            </p>
          </article>

          <div className="study-tabs">
            <button className={activeTab === 'meaning' ? 'selected' : ''} onClick={() => setActiveTab('meaning')}><BookOpen size={15} /> Meaning</button>
            <button className={activeTab === 'context' ? 'selected' : ''} onClick={() => setActiveTab('context')}>Context</button>
            <button className={activeTab === 'connected' ? 'selected' : ''} onClick={() => setActiveTab('connected')}><Link size={15} /> Connected</button>
            <button className={activeTab === 'similar' ? 'selected' : ''} onClick={() => setActiveTab('similar')}>Similar</button>
          </div>

          <article className="study-info-card">
            {activeTab === 'meaning' && (
              <>
                <b>Arti Ayat</b>
                <p>{item.translation}</p>
              </>
            )}
            {activeTab === 'context' && <p>Ayat sekitar: {items[index - 1]?.label ?? '-'} | {items[index + 1]?.label ?? '-'}</p>}
            {activeTab === 'connected' && <p>Terhubung dengan target hari ini: {item.verseKeys.join(', ')}</p>}
            {activeTab === 'similar' && <p>Deteksi ayat mirip akan dipakai frasa Arab dari data lokal. Versi awal belum menampilkan daftar lengkap.</p>}
          </article>

          <article className="method-card">
            <Sparkles size={18} />
            <div>
              <b>Metode 5x</b>
              <p>Dengarkan, baca sambil melihat, lalu coba ulangi tanpa melihat.</p>
            </div>
          </article>

          <div className="audio-mode-toggle" aria-label="Mode audio">
            <button className={audioMode === 'verse' ? 'selected' : ''} onClick={() => setAudioMode('verse')} type="button">Ayah audio</button>
            <button className={audioMode === 'word' ? 'selected' : ''} onClick={() => setAudioMode('word')} type="button">Word audio</button>
          </div>

          {finished && <p className="success-box">Target selesai. Progres sudah diperbarui.</p>}

          <div className="study-actions">
            <button onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}><ChevronLeft size={16} /> Prev</button>
            <button onClick={() => setIndex((value) => Math.min(items.length - 1, value + 1))} disabled={index >= items.length - 1}>Next <ChevronRight size={16} /></button>
            <button onClick={() => void playCurrent()}>{playing ? <Pause size={16} /> : <Play size={16} />} Repeat 5x</button>
            <button onClick={() => void playRange()}><RotateCcw size={16} /> Play range</button>
            <button className="primary" onClick={() => void markDone()}>{index >= items.length - 1 ? 'Finish target' : 'Mark done'}</button>
          </div>
        </>
      )}

      <audio ref={audioRef} />
    </section>
  );
}

async function upsertProgressForTarget(items: StudyItem[], type: DailyTarget['type']) {
  const pages = new Map<number, StudyItem>();
  for (const item of items) pages.set(item.page, item);

  for (const item of pages.values()) {
    const existing = await db.progress.where('page_number').equals(item.page).first();
    const status = type === 'sabaq' ? 'sabqi' : type;
    const payload = { page_number: item.page, surah_id: item.surah, status, last_reviewed: new Date().toISOString(), quality_score: 4 } as const;

    if (existing?.id) await db.progress.update(existing.id, payload);
    else await db.progress.add(payload);
  }
}

function loadStudyFont(page: number) {
  const cached = loadedStudyFonts.get(page);
  if (cached) return cached;

  const family = `p${page}`;
  const request = new FontFace(family, `url(${getMushafFontUrl(page)})`)
    .load()
    .then((font) => {
      document.fonts.add(font);
    });

  loadedStudyFonts.set(page, request);
  return request;
}

async function buildStudyItems(target: DailyTarget, settings: SettingsRecord): Promise<StudyItem[]> {
  const pages = await Promise.all(target.pages.map((page) => loadMushafPage(page, settings.word_translation)));

  if (target.type === 'sabaq') {
    const lineItems = pages.flatMap((page) => {
      const lines = Array.from({ length: page.endingLine - page.startingLine + 1 }, (_, index) => page.startingLine + index);
      return lines.map((line): StudyItem => {
        const words = page.verses.flatMap((verse) => verse.words.map((word, wordIndex) => ({ verse, word, wordIndex })).filter((item) => item.word.line === line));
        const verseKeys = Array.from(new Set(words.map(({ verse }) => verse.key)));
        const firstVerse = words[0]?.verse;
        return {
          id: `${page.pageNumber}:${line}`,
          label: `Line ${line}`,
          arabic: words.map(({ word }) => word.arabic).join(' '),
          translation: verseKeys.map((key) => page.verses.find((verse) => verse.key === key)?.words.map((word) => word.translation).filter(Boolean).join(' ')).filter(Boolean).join(' '),
          words: words.map(({ verse, word, wordIndex }) => ({
            arabic: word.arabic,
            translation: word.translation,
            key: `${verse.meta.surah}:${verse.meta.ayah}:${wordIndex + 1}` as `${number}:${number}:${number}`,
            verseKey: verse.key,
            end: word.end
          })),
          verseKeys,
          wordKeys: words.map(({ verse, wordIndex }) => `${verse.meta.surah}:${verse.meta.ayah}:${wordIndex + 1}` as `${number}:${number}:${number}`),
          page: page.pageNumber,
          surah: firstVerse?.meta.surah ?? page.verses[0]?.meta.surah ?? 1,
          ayahLabel: formatAyahLabel(verseKeys),
          ayahEnd: getLineAyahEnd(page, verseKeys, line),
          juz: firstVerse?.meta.juz ?? page.verses[0]?.meta.juz ?? 1
        };
      });
    });

    if (settings.daily_target_unit === 'lines') return lineItems.slice(0, settings.daily_target);
    if (settings.daily_target_unit === 'half_page') return lineItems.slice(0, Math.ceil(lineItems.length / 2));
    return lineItems;
  }

  return pages.flatMap((page) =>
    page.verses.map((verse): StudyItem => ({
      id: verse.key,
      label: `Ayah ${verse.meta.ayah}`,
      arabic: verse.words.map((word) => word.arabic).join(' '),
      translation: verse.words.map((word) => word.translation).filter(Boolean).join(' '),
      words: verse.words.map((word, wordIndex) => ({
        arabic: word.arabic,
        translation: word.translation,
        key: `${verse.meta.surah}:${verse.meta.ayah}:${wordIndex + 1}` as `${number}:${number}:${number}`,
        verseKey: verse.key,
        end: word.end
      })),
      verseKeys: [verse.key],
      page: page.pageNumber,
      surah: verse.meta.surah,
      ayahLabel: `Ayah ${verse.meta.ayah}`,
      ayahEnd: verse.words.at(-1)?.end,
      juz: verse.meta.juz
    }))
  );
}

function formatAyahLabel(keys: VerseKey[]) {
  const ayahs = keys.map((key) => Number(key.split(':')[1]));
  if (!ayahs.length) return 'Ayah -';
  if (ayahs.length === 1) return `Ayah ${ayahs[0]}`;
  return `Ayah ${ayahs[0]}-${ayahs[ayahs.length - 1]}`;
}

function getLineAyahEnd(page: Awaited<ReturnType<typeof loadMushafPage>>, verseKeys: VerseKey[], line: number) {
  const lastKey = verseKeys[verseKeys.length - 1];
  const verse = page.verses.find((item) => item.key === lastKey);
  const lastWordOnLine = [...(verse?.words ?? [])].reverse().find((word) => word.line === line);
  return lastWordOnLine?.end;
}
