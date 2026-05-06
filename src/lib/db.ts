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

export type MemorizationPath = 'front' | 'back' | 'custom';
export type DailyTargetUnit = 'lines' | 'half_page' | 'page';
export type FridayMode = 'review_only' | 'review_or_new';
export type RangeType = 'page' | 'juz' | 'surah' | 'ayah';

export type SettingsRecord = {
  id: 'main';
  display_name?: string;
  current_mode: 'academic' | 'balanced' | 'murattal';
  cycle_days: number;
  daily_target: number;
  daily_target_unit: DailyTargetUnit;
  target_finish_date?: string;
  memorization_path: MemorizationPath;
  custom_next_page?: number;
  friday_mode: FridayMode;
  last_export_date?: string;
  mushaf_font_size: number;
  reciter: string;
  sabaq_reciter: string;
  review_reciter: string;
  word_translation: 1 | 4;
  show_translation: boolean;
  onboarding_complete: boolean;
};

export type MemorizedRangeRecord = {
  id?: number;
  type: RangeType;
  raw_range: string;
  start_page?: number;
  end_page?: number;
  start_juz?: number;
  end_juz?: number;
  start_surah?: number;
  start_ayah?: number;
  end_surah?: number;
  end_ayah?: number;
  created_at: string;
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
  memorized_ranges!: Table<MemorizedRangeRecord, number>;
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
    this.version(2).stores({
      progress: '++id, page_number, surah_id, status, last_reviewed, quality_score',
      settings: 'id, current_mode, cycle_days, last_export_date, daily_target, memorization_path, onboarding_complete',
      memorized_ranges: '++id, type, start_page, end_page, start_juz, end_juz, start_surah, end_surah, created_at',
      logs: '++id, date',
      quran_cache: 'key, timestamp'
    });
  }
}

export const db = new ItqanDatabase();

export const defaultSettings: SettingsRecord = {
  id: 'main',
  display_name: '',
  current_mode: 'academic',
  cycle_days: 30,
  daily_target: 1,
  daily_target_unit: 'page',
  target_finish_date: '',
  memorization_path: 'front',
  custom_next_page: 1,
  friday_mode: 'review_only',
  mushaf_font_size: 36,
  reciter: 'afasy',
  sabaq_reciter: 'husary-muallim',
  review_reciter: 'minshawi-murattal',
  word_translation: 4,
  show_translation: false,
  onboarding_complete: false
};

export async function getSettings() {
  const settings = await db.settings.get('main');
  if (settings) {
    const merged = { ...defaultSettings, ...settings };
    if (JSON.stringify(merged) !== JSON.stringify(settings)) await db.settings.put(merged);
    return merged;
  }
  await db.settings.put(defaultSettings);
  return defaultSettings;
}
