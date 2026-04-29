import { Fragment, type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Maximize, Pause, Play, Star } from 'lucide-react';
import type { SettingsRecord } from '../lib/db';
import { db } from '../lib/db';
import { cacheAudio, getVerseAudioUrl } from '../lib/audio';
import { getMushafFontUrl } from '../lib/quranwbw/config';
import { loadMushafPage } from '../lib/quranwbw/mushafPageLoader';
import type { MushafPage, QuranVerse, VerseKey } from '../types/quran';

const loadedMushafFonts = new Map<number, Promise<void>>();

const CENTERED_PAGE_LINES = new Set([
  '1:9',
  '1:10',
  '1:11',
  '1:12',
  '1:13',
  '1:14',
  '1:15',
  '2:10',
  '2:11',
  '2:12',
  '2:13',
  '2:14',
  '2:15',
  '255:2',
  '528:9',
  '534:6',
  '545:6',
  '586:1',
  '593:2',
  '594:5',
  '600:10',
  '602:5',
  '602:11',
  '602:15',
  '603:10',
  '603:15',
  '604:4',
  '604:9',
  '604:14',
  '604:15'
]);

type Props = {
  page: number;
  settings: SettingsRecord;
  onPageChange: (page: number) => void;
  onProgressChanged: () => void;
};

export default function MushafView({ page, settings, onPageChange, onProgressChanged }: Props) {
  const [mushafPage, setMushafPage] = useState<MushafPage | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<VerseKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<VerseKey | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    setMushafPage(null);
    setError(null);

    loadMushafPage(page)
      .then((data) => {
        if (!cancelled) setMushafPage(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat Mushaf.');
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    setFontReady(false);
    if (!mushafPage) return;

    let cancelled = false;

    loadMushafFont(page)
      .then(() => {
        if (!cancelled) setFontReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat font Mushaf.');
      });

    return () => {
      cancelled = true;
    };
  }, [mushafPage, page]);

  const lines = useMemo(() => {
    if (!mushafPage) return [];
    return Array.from({ length: mushafPage.endingLine - mushafPage.startingLine + 1 }, (_, index) => mushafPage.startingLine + index);
  }, [mushafPage]);

  const selectedVerseDetails = useMemo(() => {
    if (!mushafPage || !selectedVerse) return null;
    const verse = mushafPage.verses.find((item) => item.key === selectedVerse);
    if (!verse) return null;
    return {
      verse,
      translation: verse.words
        .map((word) => word.translation)
        .filter(Boolean)
        .join(' ')
    };
  }, [mushafPage, selectedVerse]);

  async function playVerse(key: VerseKey) {
    if (playing === key) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    const src = await cacheAudio(getVerseAudioUrl(key, settings.reciter), 'verse');
    if (!audioRef.current) return;
    audioRef.current.src = src;
    await audioRef.current.play();
    setPlaying(key);
  }

  async function markDifficult(verse: QuranVerse) {
    await db.progress.put({
      page_number: verse.meta.page,
      surah_id: verse.meta.surah,
      status: 'sabqi',
      last_reviewed: new Date().toISOString(),
      quality_score: 2
    });
    onProgressChanged();
    setSelectedVerse(null);
  }

  return (
    <section className="mushaf-screen">
      <header className="mushaf-topbar">
        <button className="icon-command" disabled={page >= 604} onClick={() => onPageChange(page + 1)} aria-label="Halaman berikutnya">
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">Mushaf</p>
          <h1>Halaman {page}</h1>
        </div>
        <button className="icon-command" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronRight size={20} />
        </button>
      </header>

      {error && <p className="error-box">{error}</p>}
      {!mushafPage && !error && <p className="loading">Memuat data QuranWBW...</p>}

      {mushafPage && (
        <div className={`mushaf-page ${fontReady ? 'font-ready' : 'font-loading'}`} style={{ '--mushaf-font-size': 'min(36px, 5.4vw)', '--mushaf-font-family': `p${page}` } as CSSProperties}>
          <style>{`
            @font-palette-values --itqan-mushaf-words-${page}{font-family:p${page};base-palette:3;}
            @font-palette-values --itqan-mushaf-ayah-${page}{font-family:p${page};base-palette:0;override-colors:10 #008000,11 #b78b14,12 #f8efd3,13 #000000;}
            .mushaf-page-${page} .word.v4-word{font-palette:--itqan-mushaf-words-${page};}
            .mushaf-page-${page} .ayah-end.v4-word{font-palette:--itqan-mushaf-ayah-${page};}
          `}</style>
          <div className={`mushaf-page-inner mushaf-page-${page}`}>
            {lines.map((line) => {
              const startsChapter = mushafPage.chapters.find((chapter) => chapter.line === line && chapter.firstAyah === 1);
              const centered = CENTERED_PAGE_LINES.has(`${page}:${line}`);

              return (
                <div className="mushaf-line-group" key={line}>
                  {startsChapter && <div className="chapter-break">Surah {startsChapter.surah}</div>}
                  <div className={`mushaf-line ${centered ? 'centered' : ''}`}>
                    <LineWords
                      page={mushafPage}
                      line={line}
                      selectedVerse={selectedVerse}
                      playing={playing}
                      onSelect={(key) => setSelectedVerse((value) => (value === key ? null : key))}
                    />
                  </div>
                </div>
              );
            })}
            <div className="page-divider">
              <span />
              <b>{page}</b>
              <span />
            </div>
          </div>
        </div>
      )}

      {selectedVerse && selectedVerseDetails && (
        <div className="verse-menu">
          <span>
            {selectedVerse}
            {settings.show_translation && selectedVerseDetails.translation && <small>{selectedVerseDetails.translation}</small>}
          </span>
          <button onClick={() => playVerse(selectedVerse)}>{playing === selectedVerse ? <Pause size={16} /> : <Play size={16} />} Play</button>
          <button onClick={() => markDifficult(selectedVerseDetails.verse)}><Star size={16} /> Tandai sulit</button>
        </div>
      )}

      <div className="mushaf-audio-toolbar" aria-label="Kontrol Mushaf">
        <button disabled={page >= 604} onClick={() => onPageChange(page + 1)} aria-label="Halaman berikutnya">
          <ChevronLeft size={18} />
        </button>
        <button aria-label="Mode lihat">
          <Eye size={18} />
        </button>
        <button className="primary" onClick={() => selectedVerse && playVerse(selectedVerse)} disabled={!selectedVerse} aria-label="Putar ayat terpilih">
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button aria-label="Layar penuh">
          <Maximize size={18} />
        </button>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronRight size={18} />
        </button>
      </div>

      <audio ref={audioRef} onEnded={() => setPlaying(null)} />
    </section>
  );
}

function LineWords({
  page,
  line,
  selectedVerse,
  playing,
  onSelect
}: {
  page: MushafPage;
  line: number;
  selectedVerse: VerseKey | null;
  playing: VerseKey | null;
  onSelect: (key: VerseKey) => void;
}) {
  const words = getLineWords(page, line);

  return (
    <>
      {words.map(({ verse, word, index }) => (
        <Fragment key={`${verse.key}-${line}-${index}`}>
          <button
            className={`word-button ${selectedVerse === verse.key ? 'selected' : ''} ${playing === verse.key ? 'playing' : ''}`}
            onClick={() => onSelect(verse.key)}
            aria-label={`Ayat ${verse.key}`}
          >
            <span className="word v4-word">{word.arabic}</span>
          </button>
          {word.end && (
            <button className="ayah-end-button" onClick={() => onSelect(verse.key)} aria-label={`Akhir ayat ${verse.key}`}>
              <span className="ayah-end v4-word">{word.end}</span>
            </button>
          )}
        </Fragment>
      ))}
    </>
  );
}

function getLineWords(page: MushafPage, line: number) {
  return page.verses.flatMap((verse) =>
    verse.words
      .map((word, index) => ({ verse, word, index }))
      .filter((item) => item.word.line === line)
  );
}

function loadMushafFont(page: number) {
  const cached = loadedMushafFonts.get(page);
  if (cached) return cached;

  const family = `p${page}`;
  const request = new FontFace(family, `url(${getMushafFontUrl(page)})`)
    .load()
    .then((font) => {
      document.fonts.add(font);
    });

  loadedMushafFonts.set(page, request);
  return request;
}
