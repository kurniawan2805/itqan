import { useState } from 'react';
import { db, type DailyTargetUnit, type MemorizationPath, type SettingsRecord } from '../lib/db';
import { reciters, wordTranslations, type ReciterId, type WordTranslationId } from '../lib/quranwbw/config';

export default function SettingsView({ settings, onChanged }: { settings: SettingsRecord; onChanged: () => void }) {
  const [draft, setDraft] = useState(settings);

  async function save(next: SettingsRecord) {
    setDraft(next);
    await db.settings.put(next);
    onChanged();
  }

  return (
    <section className="settings-screen">
      <header>
        <p className="eyebrow">Settings</p>
        <h1>Preferensi Mushaf</h1>
      </header>

      <label>
        Nama panggilan
        <input value={draft.display_name ?? ''} onChange={(event) => void save({ ...draft, display_name: event.target.value })} />
      </label>

      <label>
        Jalur hafalan
        <select value={draft.memorization_path} onChange={(event) => void save({ ...draft, memorization_path: event.target.value as MemorizationPath })}>
          <option value="front">Dari depan</option>
          <option value="back">Dari belakang</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      <label>
        Target harian
        <div className="inline-fields">
          <input type="number" min="1" value={draft.daily_target} onChange={(event) => void save({ ...draft, daily_target: Number(event.target.value) })} />
          <select value={draft.daily_target_unit} onChange={(event) => void save({ ...draft, daily_target_unit: event.target.value as DailyTargetUnit })}>
            <option value="lines">Lines</option>
            <option value="half_page">1/2 page</option>
            <option value="page">Page</option>
          </select>
        </div>
      </label>

      <label>
        Mulai hafalan baru dari halaman
        <input type="number" min="1" max="604" value={draft.custom_next_page ?? 1} onChange={(event) => void save({ ...draft, custom_next_page: clampPage(Number(event.target.value)) })} />
      </label>

      <label>
        Jumat
        <select value={draft.friday_mode} onChange={(event) => void save({ ...draft, friday_mode: event.target.value as SettingsRecord['friday_mode'] })}>
          <option value="review_only">Khusus murajaah</option>
          <option value="review_or_new">Boleh hafalan baru kalau perlu</option>
        </select>
      </label>

      <label>
        Mode intensitas
        <select
          value={draft.current_mode}
          onChange={(event) => {
            const mode = event.target.value as SettingsRecord['current_mode'];
            const cycle_days = mode === 'academic' ? 30 : mode === 'balanced' ? 15 : 7;
            void save({ ...draft, current_mode: mode, cycle_days });
          }}
        >
          <option value="academic">Academic/Busy</option>
          <option value="balanced">Balanced</option>
          <option value="murattal">Murattal</option>
        </select>
      </label>

      <label>
        Ukuran font Arab
        <input type="range" min="24" max="44" value={draft.mushaf_font_size} onChange={(event) => void save({ ...draft, mushaf_font_size: Number(event.target.value) })} />
      </label>

      <label>
        Qari hafalan baru
        <select value={draft.sabaq_reciter} onChange={(event) => void save({ ...draft, sabaq_reciter: event.target.value as ReciterId })}>
          {Object.values(reciters).map((reciter) => (
            <option value={reciter.id} key={reciter.id}>
              {reciter.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Qari murajaah
        <select value={draft.review_reciter} onChange={(event) => void save({ ...draft, review_reciter: event.target.value as ReciterId, reciter: event.target.value })}>
          {Object.values(reciters).map((reciter) => (
            <option value={reciter.id} key={reciter.id}>
              {reciter.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Bahasa terjemahan
        <select value={draft.word_translation} onChange={(event) => void save({ ...draft, word_translation: Number(event.target.value) as WordTranslationId })}>
          {Object.values(wordTranslations).map((translation) => (
            <option value={translation.id} key={translation.id}>{translation.label}</option>
          ))}
        </select>
      </label>

      <label className="toggle-row">
        Tampilkan word translation
        <input type="checkbox" checked={draft.show_translation} onChange={(event) => void save({ ...draft, show_translation: event.target.checked })} />
      </label>

      <section className="source-note">
        <p>Data Mushaf: QuranWBW static CDN. Progres hafalan dan cache Quran disimpan di tabel Dexie terpisah.</p>
      </section>
    </section>
  );
}

function clampPage(page: number) {
  return Math.min(604, Math.max(1, Number(page) || 1));
}
