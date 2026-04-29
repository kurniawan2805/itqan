import { describe, expect, it } from 'vitest';
import { calculateDailyTargets } from './scheduler';
import { defaultSettings, type ProgressRecord } from './db';

describe('calculateDailyTargets', () => {
  it('uses page_number as the target unit', () => {
    const progress: ProgressRecord[] = Array.from({ length: 12 }, (_, index) => ({
      page_number: index + 1,
      status: 'manzil'
    }));

    const targets = calculateDailyTargets(progress, { ...defaultSettings, cycle_days: 30, daily_target: 1 });

    expect(targets.find((target) => target.type === 'sabaq')?.pages).toEqual([13]);
    expect(targets.find((target) => target.type === 'sabqi')?.pages).toEqual([8, 9, 10, 11, 12]);
    expect(targets.find((target) => target.type === 'manzil')?.pages).toEqual([1]);
  });

  it('keeps emergency mode to sabqi only', () => {
    const progress: ProgressRecord[] = [1, 2, 3, 4, 5, 6].map((page_number) => ({ page_number, status: 'sabqi' }));
    expect(calculateDailyTargets(progress, defaultSettings, true)).toEqual([{ type: 'sabqi', label: 'Sabqi darurat', pages: [2, 3, 4, 5, 6] }]);
  });
});
