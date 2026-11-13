/**
 * In-memory abuse limits. Nothing here is written to disk or logged: client
 * addresses only live in these maps for the length of a window and are gone
 * on restart. Both maps are size-capped so a flood of distinct addresses
 * cannot exhaust memory (when full, the oldest entries are dropped first).
 */

export class FixedWindowLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly maxKeys = 50_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns seconds until reset if the key is over the limit, otherwise 0. */
  hit(key: string): number {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= t) {
      this.evictIfFull(t);
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      return 0;
    }
    entry.count += 1;
    return entry.count > this.max ? Math.ceil((entry.resetAt - t) / 1000) : 0;
  }

  private evictIfFull(t: number) {
    if (this.hits.size < this.maxKeys) return;
    for (const [k, v] of this.hits) if (v.resetAt <= t) this.hits.delete(k);
    while (this.hits.size >= this.maxKeys) {
      const oldest = this.hits.keys().next().value;
      if (oldest === undefined) break;
      this.hits.delete(oldest);
    }
  }
}

/** Remembers "seen key" for ttlMs so the same person can't pump one bin's count. */
export class RecentSet {
  private seen = new Map<string, number>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxKeys = 100_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** True the first time a key is seen within the TTL, false on repeats. */
  firstSeen(key: string): boolean {
    const t = this.now();
    const expires = this.seen.get(key);
    if (expires !== undefined && expires > t) return false;
    if (this.seen.size >= this.maxKeys) {
      for (const [k, v] of this.seen) if (v <= t) this.seen.delete(k);
      while (this.seen.size >= this.maxKeys) {
        const oldest = this.seen.keys().next().value;
        if (oldest === undefined) break;
        this.seen.delete(oldest);
      }
    }
    this.seen.delete(key); // re-insert so Map order stays oldest-first
    this.seen.set(key, t + this.ttlMs);
    return true;
  }
}
