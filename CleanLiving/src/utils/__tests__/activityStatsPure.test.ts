import {
  computeActivityStats,
  localDayKey,
  streakFromRecentDay,
} from '../activityStatsPure';

describe('activityStatsPure', () => {
  it('localDayKey formats Y-M-D', () => {
    const t = new Date(2026, 4, 3, 15, 0, 0).getTime();
    expect(localDayKey(t)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('streakFromRecentDay counts consecutive days', () => {
    expect(streakFromRecentDay(['2026-05-03', '2026-05-02', '2026-05-01'])).toBe(3);
    expect(streakFromRecentDay(['2026-05-03', '2026-05-01'])).toBe(1);
  });

  it('computeActivityStats aggregates rows', () => {
    const now = Date.now();
    // Use two timestamps within the same hour to avoid week-boundary edge cases
    // (e.g. running on Sunday, where "yesterday" is the prior week).
    const stats = computeActivityStats([{ createdAt: now }, { createdAt: now - 3600000 }]);
    expect(stats.totalScans).toBe(2);
    expect(stats.weekCount).toBeGreaterThanOrEqual(2);
  });
});
