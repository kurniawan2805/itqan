import type { ProgressRecord, SettingsRecord } from './db';

export type DailyTarget = {
  type: 'sabaq' | 'sabqi' | 'manzil';
  label: string;
  pages: number[];
};

export function calculateDailyTargets(progress: ProgressRecord[], settings: SettingsRecord, emergency = false): DailyTarget[] {
  const memorizedPages = Array.from(new Set(progress.map((item) => item.page_number))).sort((a, b) => a - b);
  const totalMemorized = memorizedPages.length;
  const lastPage = memorizedPages[memorizedPages.length - 1] ?? 1;
  const sabqiCount = settings.current_mode === 'academic' ? 5 : settings.current_mode === 'balanced' ? 10 : Math.min(20, totalMemorized);
  const sabqiPages = memorizedPages.slice(Math.max(0, totalMemorized - sabqiCount));

  if (emergency) {
    return [{ type: 'sabqi', label: 'Sabqi darurat', pages: sabqiPages.slice(-5) }];
  }

  const manzilPool = memorizedPages.slice(0, Math.max(0, totalMemorized - sabqiPages.length));
  const manzilSize = Math.max(1, Math.ceil(manzilPool.length / settings.cycle_days));

  return [
    { type: 'sabaq', label: 'Sabaq', pages: [Math.min(604, lastPage + settings.daily_target)] },
    { type: 'sabqi', label: 'Sabqi', pages: sabqiPages },
    { type: 'manzil', label: 'Manzil', pages: manzilPool.slice(0, manzilSize) }
  ];
}
