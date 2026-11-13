// "My bins" and streaks live only in this browser (localStorage).
// Nothing about the visitor is sent to a server.

export interface LocalStats {
  totalBins: number;
  streakDays: number;
  lastBinnedAt: string | null;
}

const KEY = 'binthere:stats:v1';
const EMPTY: LocalStats = { totalBins: 0, streakDays: 0, lastBinnedAt: null };

export function readStats(): LocalStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<LocalStats>;
    return {
      totalBins: Number.isFinite(parsed.totalBins) ? Number(parsed.totalBins) : 0,
      streakDays: Number.isFinite(parsed.streakDays) ? Number(parsed.streakDays) : 0,
      lastBinnedAt: typeof parsed.lastBinnedAt === 'string' ? parsed.lastBinnedAt : null,
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Same streak rule the old server used: a second bin on the same calendar day
 * keeps the streak, a bin within 48h of the last one extends it, anything
 * longer restarts it at 1.
 */
export function nextStats(prev: LocalStats, now: Date): LocalStats {
  const last = prev.lastBinnedAt ? new Date(prev.lastBinnedAt) : null;
  let streakDays: number;
  if (!last || Number.isNaN(last.getTime())) {
    streakDays = 1;
  } else if (last.toDateString() === now.toDateString()) {
    streakDays = Math.max(prev.streakDays, 1);
  } else if (now.getTime() - last.getTime() < 48 * 60 * 60 * 1000) {
    streakDays = prev.streakDays + 1;
  } else {
    streakDays = 1;
  }
  return { totalBins: prev.totalBins + 1, streakDays, lastBinnedAt: now.toISOString() };
}

export function recordBin(now = new Date()): LocalStats {
  const stats = nextStats(readStats(), now);
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Private mode or storage blocked: show this session's numbers anyway.
  }
  return stats;
}
