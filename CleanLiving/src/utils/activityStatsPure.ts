export type ActivityStats = {
  totalScans: number;
  weekCount: number;
  streakDays: number;
};

export function localDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function startOfLocalWeek(d: Date): number {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** Consecutive local days with scans, anchored on the most recent scan day */
export function streakFromRecentDay(sortedDesc: string[]): number {
  if (sortedDesc.length === 0) return 0;
  let streak = 1;
  let prev = new Date(sortedDesc[0] + 'T12:00:00').getTime();
  for (let i = 1; i < sortedDesc.length; i++) {
    const t = new Date(sortedDesc[i] + 'T12:00:00').getTime();
    const dayDiff = (prev - t) / 86400000;
    if (dayDiff === 1) {
      streak += 1;
      prev = t;
    } else {
      break;
    }
  }
  return streak;
}

export function computeActivityStats(rows: { createdAt: number }[]): ActivityStats {
  const totalScans = rows.length;
  const weekStart = startOfLocalWeek(new Date());
  const weekCount = rows.filter((r) => r.createdAt >= weekStart).length;
  const sortedDesc = [...new Set(rows.map((r) => localDayKey(r.createdAt)))].sort().reverse();
  const streakDays = streakFromRecentDay(sortedDesc);

  return { totalScans, weekCount, streakDays };
}
