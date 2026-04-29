import Dexie, { type Table } from 'dexie';

export type ProgressStatus = 'sabaq' | 'sabqi' | 'manzil';

export type ProgressRecord = {
  id?: number;
  page_number: number;
  surah_id?: number;
  status: ProgressStatus;
  last_reviewed?: string;
  quality_score?: number;
};

export type SettingsRecord = {
  id: 'main';
  current_mode: 'academic' | 'balanced' | 'murattal';
  cycle_days: number;
  daily_target: number;
  last_export_date?: string;
  mushaf_font_size: number;
  reciter: 'afasy' | 'husary';
  show_translation: boolean;
};

export type LogRecord = {
  id?: number;
  date: string;
  completed_parts: string[];
  duration_minutes: number;
};

export type QuranCacheRecord = {
  key: string;
  data: unknown;
  timestamp: number;
};

class ItqanDatabase extends Dexie {
  progress!: Table<ProgressRecord, number>;
  settings!: Table<SettingsRecord, string>;
  logs!: Table<LogRecord, number>;
  quran_cache!: Table<QuranCacheRecord, string>;

  constructor() {
    super('ItqanLocalDB');
    this.version(1).stores({
      progress: '++id, page_number, surah_id, status, last_reviewed, quality_score',
      settings: 'id, current_mode, cycle_days, last_export_date, daily_target',
      logs: '++id, date',
      quran_cache: 'key, timestamp'
    });
  }
}

export const db = new ItqanDatabase();

export const defaultSettings: SettingsRecord = {
  id: 'main',
  current_mode: 'academic',
  cycle_days: 30,
  daily_target: 1,
  mushaf_font_size: 36,
  reciter: 'afasy',
  show_translation: false
};

export async function getSettings() {
  const settings = await db.settings.get('main');
  if (settings) return settings;
  await db.settings.put(defaultSettings);
  return defaultSettings;
}
