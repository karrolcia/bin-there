import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { serveStatic } from '@hono/node-server/serve-static';
import { getConnInfo } from '@hono/node-server/conninfo';
import { z } from 'zod';
import type { BinStore } from './db.js';
import { FixedWindowLimiter, RecentSet } from './limits.js';

export interface AppOptions {
  store: BinStore;
  /** Directory with the built site (Vite `dist/`). Omit to run the API only. */
  publicDir?: string;
  now?: () => number;
}

const binnedSchema = z
  .object({
    osmId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    name: z.string().trim().min(1).max(120),
  })
  .strict();

const popularSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(50).default(5),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

/**
 * Client address, used only as an in-memory rate-limit key. Caddy on the
 * host is the only thing that can reach this port (it binds 127.0.0.1) and it
 * sets X-Forwarded-For to the real client, so the LAST entry is trustworthy.
 */
function clientKey(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export function createApp({ store, publicDir, now = Date.now }: AppOptions) {
  const app = new Hono();

  const writeLimiter = new FixedWindowLimiter(10, 60_000, 50_000, now);
  const readLimiter = new FixedWindowLimiter(60, 60_000, 50_000, now);
  // One count per person per bin per 6 hours, so nobody can pump a bin.
  const recentBinned = new RecentSet(6 * 60 * 60_000, 100_000, now);

  const tooMany = (c: Context, retryAfter: number) => {
    c.header('Retry-After', String(retryAfter));
    return c.json({ error: 'Too many requests' }, 429);
  };

  // ---------------------------------------------------------------- API
  const api = new Hono();

  api.get('/health', (c) => {
    const ok = store.healthy();
    return c.json({ status: ok ? 'ok' : 'error', db: ok ? 'ok' : 'error' }, ok ? 200 : 503);
  });

  api.get('/popular-bins', (c) => {
    const wait = readLimiter.hit(clientKey(c));
    if (wait) return tooMany(c, wait);

    const parsed = popularSchema.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: 'lat and lng are required' }, 400);
    const { lat, lng, radiusKm, limit } = parsed.data;

    c.header('Cache-Control', 'public, max-age=60');
    return c.json(store.popularNear(lat, lng, radiusKm, limit));
  });

  api.post(
    '/binned',
    bodyLimit({ maxSize: 1024, onError: (c) => c.json({ error: 'Body too large' }, 413) }),
    async (c) => {
      // Requiring JSON forces a CORS preflight from other sites' pages, which
      // this API never answers, so a third-party page can't drive-by count.
      if (!c.req.header('content-type')?.toLowerCase().startsWith('application/json')) {
        return c.json({ error: 'Expected application/json' }, 415);
      }
      const key = clientKey(c);
      const wait = writeLimiter.hit(key);
      if (wait) return tooMany(c, wait);

      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: 'Invalid JSON' }, 400);
      }
      const parsed = binnedSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Invalid bin' }, 400);

      const counted = recentBinned.firstSeen(`${key}|${parsed.data.osmId}`);
      if (counted) store.increment(parsed.data);
      return c.json({ ok: true, counted });
    },
  );

  api.all('*', (c) => c.json({ error: 'Not found' }, 404));
  app.route('/api', api);

  // ------------------------------------------------------------- website
  if (publicDir) {
    const indexPath = join(publicDir, 'index.html');
    const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : null;

    // Vite's hashed bundles never change, so browsers may keep them forever.
    app.use('/assets/*', async (c, next) => {
      await next();
      if (c.res.status === 200) c.header('Cache-Control', 'public, max-age=31536000, immutable');
    });

    app.use(
      '*',
      serveStatic({
        root: publicDir,
        onFound: (path, c) => {
          if (path.endsWith('.html')) c.header('Cache-Control', 'no-cache');
        },
      }),
    );

    // Single-page app: client-side routes (/faq, /privacy, ...) get index.html.
    // Paths that look like files (have an extension) stay real 404s.
    app.get('*', (c) => {
      if (!indexHtml || /\.[a-z0-9]+$/i.test(c.req.path)) return c.text('Not found', 404);
      c.header('Cache-Control', 'no-cache');
      return c.html(indexHtml);
    });
  }

  return app;
}
