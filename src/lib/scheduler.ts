import type { ProgressRecord, SettingsRecord } from './db';

export type DailyTarget = {
  type: 'sabaq' | 'sabqi' | 'manzil';
  label: string;
  pages: number[];
  unit?: SettingsRecord['daily_target_unit'];
  amount?: number;
};

export function calculateDailyTargets(progress: ProgressRecord[], settings: SettingsRecord, emergency = false, date = new Date()): DailyTarget[] {
  const memorizedPages = Array.from(new Set(progress.map((item) => item.page_number))).sort((a, b) => a - b);
  const totalMemorized = memorizedPages.length;
  const pathOrderedPages = settings.memorization_path === 'back' ? [...memorizedPages].sort((a, b) => b - a) : memorizedPages;
  const nextPage = getNextSabaqPage(memorizedPages, settings);
  const sabqiCount = settings.current_mode === 'academic' ? 5 : settings.current_mode === 'balanced' ? 10 : Math.min(20, totalMemorized);
  const sabqiPages = pathOrderedPages.slice(Math.max(0, totalMemorized - sabqiCount)).sort((a, b) => a - b);

  if (emergency) {
    return [{ type: 'sabqi', label: 'Sabqi darurat', pages: sabqiPages.slice(-5) }];
  }

  const manzilPool = pathOrderedPages.slice(0, Math.max(0, totalMemorized - sabqiPages.length)).sort((a, b) => a - b);
  const manzilSize = Math.max(1, Math.ceil(manzilPool.length / settings.cycle_days));
  const reviewTargets: DailyTarget[] = [
    { type: 'sabqi', label: 'Sabqi', pages: sabqiPages },
    { type: 'manzil', label: 'Manzil', pages: manzilPool.slice(0, manzilSize) }
  ];

  if (date.getDay() === 5 && settings.friday_mode === 'review_only') return reviewTargets;

  return [
    { type: 'sabaq', label: 'Sabaq', pages: [nextPage], unit: settings.daily_target_unit, amount: settings.daily_target },
    ...reviewTargets
  ];
}

function getNextSabaqPage(memorizedPages: number[], settings: SettingsRecord) {
  if (settings.custom_next_page) return clampPage(settings.custom_next_page);
  if (!memorizedPages.length) return settings.memorization_path === 'back' ? 604 : 1;
  if (settings.memorization_path === 'back') return clampPage(memorizedPages[0] - pageStep(settings));
  if (settings.memorization_path === 'custom') return 1;
  return Math.min(604, memorizedPages[memorizedPages.length - 1] + pageStep(settings));
}

function pageStep(settings: SettingsRecord) {
  if (settings.daily_target_unit === 'page') return Math.max(1, Math.floor(settings.daily_target));
  return 1;
}

function clampPage(page: number) {
  return Math.min(604, Math.max(1, page));
}
