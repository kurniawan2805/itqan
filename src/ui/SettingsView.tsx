import { useState } from 'react';
import { db, type SettingsRecord } from '../lib/db';
import { reciters, type ReciterId } from '../lib/quranwbw/config';

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
        Reciter
        <select value={draft.reciter} onChange={(event) => void save({ ...draft, reciter: event.target.value as ReciterId })}>
          {Object.values(reciters).map((reciter) => (
            <option value={reciter.id} key={reciter.id}>
              {reciter.label}
            </option>
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
