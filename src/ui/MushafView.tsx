import { Fragment, type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Grid3X3, Home, Pause, Play, Repeat, Star } from 'lucide-react';
import type { SettingsRecord } from '../lib/db';
import { db } from '../lib/db';
import { cacheAudio, getVerseAudioUrl } from '../lib/audio';
import { getBismillahFontUrl, getChapterHeaderFontUrl, getMushafFontUrl } from '../lib/quranwbw/config';
import type { ReciterId } from '../lib/quranwbw/config';
import { loadMushafPage } from '../lib/quranwbw/mushafPageLoader';
import type { DailyTarget } from '../lib/scheduler';
import type { MushafPage, QuranVerse, VerseKey } from '../types/quran';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const loadedMushafFonts = new Map<number, Promise<void>>();
let loadedChapterHeaderFont: Promise<void> | null = null;
let loadedBismillahFont: Promise<void> | null = null;

const CHAPTER_HEADER_CODES = [
  '',
  'ﱅ ', 'ﱆ ', 'ﱇ ', 'ﱊ ', 'ﱋ ', 'ﱎ ', 'ﱏ ', 'ﱑ ', 'ﱒ ', 'ﱓ ', 'ﱕ ', 'ﱖ ', 'ﱘ ', 'ﱚ ', 'ﱛ ', 'ﱜ ', 'ﱝ ', 'ﱞ ', 'ﱡ ', 'ﱢ ', 'ﱤ ', 'ﭑ ', 'ﭒ ', 'ﭔ ', 'ﭕ ', 'ﭗ ', 'ﭘ ', 'ﭚ ', 'ﭛ ', 'ﭝ ', 'ﭞ ', 'ﭠ ', 'ﭡ ', 'ﭣ ', 'ﭤ ', 'ﭦ ', 'ﭧ ', 'ﭩ ', 'ﭪ ', 'ﭬ ', 'ﭭ ', 'ﭯ ', 'ﭰ ', 'ﭲ ', 'ﭳ ', 'ﭵ ', 'ﭶ ', 'ﭸ ', 'ﭹ ', 'ﭻ ', 'ﭼ ', 'ﭾ ', 'ﭿ ', 'ﮁ ', 'ﮂ ', 'ﮄ ', 'ﮅ ', 'ﮇ ', 'ﮈ ', 'ﮊ ', 'ﮋ ', 'ﮍ ', 'ﮎ ', 'ﮐ ', 'ﮑ ', 'ﮓ ', 'ﮔ ', 'ﮖ ', 'ﮗ ', 'ﮙ ', 'ﮚ ', 'ﮜ ', 'ﮝ ', 'ﮟ ', 'ﮠ ', 'ﮢ ', 'ﮣ ', 'ﮥ ', 'ﮦ ', 'ﮨ ', 'ﮩ ', 'ﮫ ', 'ﮬ ', 'ﮮ ', 'ﮯ ', 'ﮱ ', '﮲ ', '﮴ ', '﮵ ', '﮷ ', '﮸ ', '﮺ ', '﮻ ', '﮽ ', '﮾ ', '﯀ ', '﯁ ', 'ﯓ ', 'ﯔ ', 'ﯖ ', 'ﯗ ', 'ﯙ ', 'ﯚ ', 'ﯜ ', 'ﯝ ', 'ﯟ ', 'ﯠ ', 'ﯢ ', 'ﯣ ', 'ﯥ ', 'ﯦ ', 'ﯨ ', 'ﯩ ', 'ﯫ'
];

const BISMILLAH_BY_SURAH: Record<number, string> = {
  2: 'ﲚﲛﲞﲤ',
  95: 'ﭗﲫﲮﲴ',
  97: 'ﭗﲫﲮﲴ'
};

const DEFAULT_BISMILLAH = 'ﲪﲫﲮﲴ';

function getBismillahCode(surah: number) {
  if (surah === 2) return BISMILLAH_BY_SURAH[2];
  if (surah === 95 || surah === 97) return BISMILLAH_BY_SURAH[95];
  return DEFAULT_BISMILLAH;
}

const SURAH_NAMES = [
  '',
  'Al Faatiha',
  'Al Baqara',
  'Aal i Imraan',
  'An Nisaa',
  'Al Maaida',
  "Al An'aam",
  "Al A'raaf",
  'Al Anfaal',
  'At Tawba',
  'Yunus',
  'Hud',
  'Yusuf',
  "Ar Ra'd",
  'Ibrahim',
  'Al Hijr',
  'An Nahl',
  'Al Israa',
  'Al Kahf',
  'Maryam',
  'Taa Haa',
  'Al Anbiyaa',
  'Al Hajj',
  'Al Muminoon',
  'An Noor',
  'Al Furqaan',
  "Ash Shu'araa",
  'An Naml',
  'Al Qasas',
  'Al Ankaboot',
  'Ar Room',
  'Luqman',
  'As Sajda',
  'Al Ahzaab',
  'Saba',
  'Faatir',
  'Yaseen',
  'As Saaffaat',
  'Saad',
  'Az Zumar',
  'Al Ghaafir',
  'Fussilat',
  'Ash Shura',
  'Az Zukhruf',
  'Ad Dukhaan',
  'Al Jaathiya',
  'Al Ahqaf',
  'Muhammad',
  'Al Fath',
  'Al Hujuraat',
  'Qaaf',
  'Adh Dhaariyat',
  'At Tur',
  'An Najm',
  'Al Qamar',
  'Ar Rahmaan',
  'Al Waaqia',
  'Al Hadid',
  'Al Mujaadila',
  'Al Hashr',
  'Al Mumtahana',
  'As Saff',
  "Al Jumu'a",
  'Al Munaafiqoon',
  'At Taghaabun',
  'At Talaaq',
  'At Tahrim',
  'Al Mulk',
  'Al Qalam',
  'Al Haaqqa',
  "Al Ma'aarij",
  'Nooh',
  'Al Jinn',
  'Al Muzzammil',
  'Al Muddaththir',
  'Al Qiyaama',
  'Al Insaan',
  'Al Mursalaat',
  'An Naba',
  "An Naazi'aat",
  'Abasa',
  'At Takwir',
  'Al Infitaar',
  'Al Mutaffifin',
  'Al Inshiqaaq',
  'Al Burooj',
  'At Taariq',
  "Al A'laa",
  'Al Ghaashiya',
  'Al Fajr',
  'Al Balad',
  'Ash Shams',
  'Al Lail',
  'Ad Dhuhaa',
  'Ash Sharh',
  'At Tin',
  'Al Alaq',
  'Al Qadr',
  'Al Bayyina',
  'Az Zalzala',
  'Al Aadiyaat',
  "Al Qaari'a",
  'At Takaathur',
  'Al Asr',
  'Al Humaza',
  'Al Fil',
  'Quraish',
  "Al Maa'un",
  'Al Kawthar',
  'Al Kaafiroon',
  'An Nasr',
  'Al Masad',
  'Al Ikhlaas',
  'Al Falaq',
  'An Naas'
];

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
  reviewTarget?: DailyTarget | null;
  onPageChange: (page: number) => void;
  onHome: () => void;
  onMenu: () => void;
  onProgressChanged: () => void;
};

type ReviewVerse = { key: VerseKey; page: number; surah: number; ayah: number };

export default function MushafView({ page, settings, reviewTarget, onPageChange, onHome, onMenu, onProgressChanged }: Props) {
  const [mushafPage, setMushafPage] = useState<MushafPage | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<VerseKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<VerseKey | null>(null);
  const [reviewPlaylist, setReviewPlaylist] = useState<ReviewVerse[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewPlaying, setReviewPlaying] = useState(false);
  const [reviewRepeat, setReviewRepeat] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [pageInput, setPageInput] = useState(String(page));
  const [fontReady, setFontReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const reviewRunRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setMushafPage(null);
    setError(null);

    loadMushafPage(page, settings.word_translation)
      .then((data) => {
        if (!cancelled) setMushafPage(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat Mushaf.');
      });

    return () => {
      cancelled = true;
    };
  }, [page, settings.word_translation]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (!pageDialogOpen) return;

    requestAnimationFrame(() => {
      pageInputRef.current?.focus();
      pageInputRef.current?.select();
    });
  }, [pageDialogOpen]);

  useEffect(() => {
    setFontReady(false);
    if (!mushafPage) return;

    let cancelled = false;

    Promise.all([loadMushafFont(page), loadChapterHeaderFont(), loadBismillahFont()])
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

  useEffect(() => {
    let cancelled = false;
    setReviewPlaylist([]);
    setReviewIndex(0);
    setReviewPlaying(false);
    setReviewDone(false);

    if (!reviewTarget) return;

    Promise.all(reviewTarget.pages.map((targetPage) => loadMushafPage(targetPage, settings.word_translation)))
      .then((pages) => {
        if (cancelled) return;
        setReviewPlaylist(
          pages.flatMap((mushaf) =>
            mushaf.verses.map((verse) => ({ key: verse.key, page: mushaf.pageNumber, surah: verse.meta.surah, ayah: verse.meta.ayah }))
          )
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat target murajaah.');
      });

    return () => {
      cancelled = true;
      reviewRunRef.current += 1;
      audioRef.current?.pause();
    };
  }, [reviewTarget, settings.word_translation]);

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

  const pageSummary = useMemo(() => {
    if (!mushafPage) return null;
    const surahs = Array.from(new Set(mushafPage.verses.map((verse) => verse.meta.surah)));
    const surahLabel = surahs.map((surah) => SURAH_NAMES[surah] ?? `Surah ${surah}`).join(' / ');
    const juz = mushafPage.verses[0]?.meta.juz;

    return { surahLabel, juz };
  }, [mushafPage]);

  async function playVerse(key: VerseKey) {
    if (playing === key) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    const src = await cacheAudio(getVerseAudioUrl(key, settings.review_reciter as ReciterId), 'verse');
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

  async function playReviewRange(startIndex = reviewIndex) {
    if (!reviewPlaylist.length) return;
    const runId = reviewRunRef.current + 1;
    reviewRunRef.current = runId;
    setReviewPlaying(true);
    setReviewDone(false);

    let cursor = startIndex;
    while (cursor < reviewPlaylist.length && reviewRunRef.current === runId) {
      const verse = reviewPlaylist[cursor];
      setReviewIndex(cursor);
      if (verse.page !== page) onPageChange(verse.page);

      const src = await cacheAudio(getVerseAudioUrl(verse.key, settings.review_reciter as ReciterId), 'verse');
      if (!audioRef.current) break;
      audioRef.current.src = src;
      await audioRef.current.play();
      await new Promise<void>((resolve) => {
        if (!audioRef.current) return resolve();
        audioRef.current.onended = () => resolve();
        audioRef.current.onerror = () => resolve();
        audioRef.current.onpause = () => resolve();
      });
      if (reviewRunRef.current !== runId || audioRef.current.paused) break;
      cursor += 1;

      if (cursor >= reviewPlaylist.length && reviewRepeat) cursor = 0;
      if (!reviewRepeat && cursor >= reviewPlaylist.length) break;
    }

    setReviewPlaying(false);
  }

  function pauseReview() {
    reviewRunRef.current += 1;
    audioRef.current?.pause();
    setReviewPlaying(false);
  }

  async function markReviewDone() {
    if (!reviewTarget) return;
    const now = new Date().toISOString();

    for (const targetPage of reviewTarget.pages) {
      const existing = await db.progress.where('page_number').equals(targetPage).first();
      const payload = { page_number: targetPage, status: reviewTarget.type, last_reviewed: now, quality_score: 4 } as const;
      if (existing?.id) await db.progress.update(existing.id, payload);
      else await db.progress.add(payload);
    }

    setReviewDone(true);
    onProgressChanged();
  }

  function goReviewPage(direction: 1 | -1) {
    if (!reviewTarget?.pages.length) return;
    const currentTargetIndex = Math.max(0, reviewTarget.pages.indexOf(page));
    const nextTargetIndex = Math.min(reviewTarget.pages.length - 1, Math.max(0, currentTargetIndex + direction));
    onPageChange(reviewTarget.pages[nextTargetIndex]);
  }

  function submitPageNavigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPage = Math.min(604, Math.max(1, Number(pageInput) || page));
    onPageChange(nextPage);
    setPageDialogOpen(false);
  }

  return (
    <section className="mushaf-screen">
      <header className="mushaf-topbar">
        <button className="mushaf-top-pill" onClick={onHome} aria-label="Kembali ke dashboard">
          <Home size={15} />
          Home
        </button>
        <button className="mushaf-page-title" onClick={() => setPageDialogOpen(true)} aria-label="Navigasi cepat halaman">
          Page {page}
          <ChevronDown size={13} />
        </button>
        <button className="mushaf-top-pill" onClick={onMenu} aria-label="Buka menu pengaturan">
          Menu
          <Grid3X3 size={15} />
        </button>
      </header>

      {pageSummary && (
        <div className="mushaf-page-meta">
          <span>{reviewTarget ? `${reviewTarget.label} · ${formatPages(reviewTarget.pages)} · ${reviewPlaylist.length} ayat` : pageSummary.surahLabel}</span>
          <span>{reviewTarget ? `Ayat ${reviewIndex + 1}/${reviewPlaylist.length || 0}` : `Juz ${pageSummary.juz}`}</span>
        </div>
      )}

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
              const chapterName = startsChapter ? SURAH_NAMES[startsChapter.surah] ?? `Surah ${startsChapter.surah}` : null;
              const showBismillah = startsChapter && startsChapter.surah !== 1 && startsChapter.surah !== 9;
              return (
                <div key={line}>
                  {startsChapter && (
                    <div className="mushaf-chapter-start">
                      <div
                        className={cn("amaly-chapter-header", !fontReady && "font-serif text-[0.52em] font-bold leading-tight")}
                        style={fontReady ? { fontFamily: "chapter-headers" } : undefined}
                      >
                        {fontReady ? CHAPTER_HEADER_CODES[startsChapter.surah] : `سورة ${chapterName}`}
                      </div>
                      {showBismillah ? (
                        <div
                          className={cn("bismillah", !fontReady && "font-arabic")}
                          style={fontReady ? { fontFamily: "bismillah" } : undefined}
                        >
                          {fontReady ? getBismillahCode(startsChapter.surah) : "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                        </div>
                      ) : null}
                    </div>
                  )}
                  <div className={`mushaf-line ${centered ? 'centered' : ''}`}>
                    <LineWords
                      page={mushafPage}
                      line={line}
                      selectedVerse={selectedVerse}
                      playing={playing}
                      activeReviewVerse={reviewPlaylist[reviewIndex]?.key ?? null}
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

      {reviewDone && <p className="review-done-toast">Murajaah selesai. Progres diperbarui.</p>}

      {pageDialogOpen && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setPageDialogOpen(false)}>
          <form className="page-dialog" onSubmit={submitPageNavigation} role="dialog" aria-modal="true" aria-label="Navigasi cepat halaman" onClick={(event) => event.stopPropagation()}>
            <label>
              Buka halaman
              <input ref={pageInputRef} autoFocus inputMode="numeric" min={1} max={604} type="number" value={pageInput} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setPageInput(event.target.value)} />
            </label>
            <div className="page-dialog-actions">
              <button type="button" onClick={() => setPageDialogOpen(false)}>Batal</button>
              <button type="submit">Buka</button>
            </div>
          </form>
        </div>
      )}

      <div className="mushaf-audio-toolbar" aria-label={reviewTarget ? 'Kontrol murajaah' : 'Kontrol Mushaf'}>
        <button disabled={reviewTarget ? page === reviewTarget.pages[reviewTarget.pages.length - 1] : page >= 604} onClick={() => (reviewTarget ? goReviewPage(1) : onPageChange(page + 1))} aria-label="Halaman berikutnya">
          <ChevronLeft size={18} />
        </button>
        {reviewTarget ? <button className={reviewRepeat ? 'active' : ''} onClick={() => setReviewRepeat((value) => !value)} aria-label="Ulangi range"><Repeat size={18} /></button> : <button onClick={onHome} aria-label="Kembali ke dashboard"><Home size={18} /></button>}
        <button className="primary" onClick={() => (reviewTarget ? (reviewPlaying ? pauseReview() : void playReviewRange()) : selectedVerse && playVerse(selectedVerse))} disabled={reviewTarget ? !reviewPlaylist.length : !selectedVerse} aria-label="Putar audio">
          {reviewPlaying || playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={() => (reviewTarget ? void markReviewDone() : onMenu())} aria-label={reviewTarget ? 'Tandai murajaah selesai' : 'Buka menu'}>{reviewTarget ? <Check size={18} /> : <Grid3X3 size={18} />}</button>
        <button disabled={reviewTarget ? page === reviewTarget.pages[0] : page <= 1} onClick={() => (reviewTarget ? goReviewPage(-1) : onPageChange(page - 1))} aria-label="Halaman sebelumnya">
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
  activeReviewVerse,
  onSelect
}: {
  page: MushafPage;
  line: number;
  selectedVerse: VerseKey | null;
  playing: VerseKey | null;
  activeReviewVerse: VerseKey | null;
  onSelect: (key: VerseKey) => void;
}) {
  const words = getLineWords(page, line);

  return (
    <>
      {words.map(({ verse, word, index }) => (
        <Fragment key={`${verse.key}-${line}-${index}`}>
          <button
            className={`word-button ${selectedVerse === verse.key ? 'selected' : ''} ${playing === verse.key || activeReviewVerse === verse.key ? 'playing' : ''}`}
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

function Bismillah({ surah }: { surah: number }) {
  if (surah === 1 || surah === 9) return null;

  return <div className={`bismillah ${surah === 2 ? 'bismillah-wide' : ''}`}>{BISMILLAH_BY_SURAH[surah] ?? DEFAULT_BISMILLAH}</div>;
}

function getLineWords(page: MushafPage, line: number) {
  return page.verses.flatMap((verse) =>
    verse.words
      .map((word, index) => ({ verse, word, index }))
      .filter((item) => item.word.line === line)
  );
}

function formatPages(pages: number[]) {
  if (!pages.length) return 'Tidak ada halaman';
  if (pages.length === 1) return `Halaman ${pages[0]}`;
  return `Halaman ${pages[0]}-${pages[pages.length - 1]}`;
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

function loadChapterHeaderFont() {
  if (loadedChapterHeaderFont) return loadedChapterHeaderFont;

  loadedChapterHeaderFont = new FontFace('chapter-headers', `url(${getChapterHeaderFontUrl()})`)
    .load()
    .then((font) => {
      document.fonts.add(font);
    });

  return loadedChapterHeaderFont;
}

function loadBismillahFont() {
  if (loadedBismillahFont) return loadedBismillahFont;

  loadedBismillahFont = new FontFace('bismillah', `url(${getBismillahFontUrl()})`)
    .load()
    .then((font) => {
      document.fonts.add(font);
    });

  return loadedBismillahFont;
}
