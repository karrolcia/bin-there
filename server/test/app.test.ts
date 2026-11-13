import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { openStore } from '../src/db.js';

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'binthere-'));
  const pub = join(dir, 'public');
  mkdirSync(join(pub, 'assets'), { recursive: true });
  mkdirSync(join(pub, 'bins', 'sweden'), { recursive: true });
  writeFileSync(join(pub, 'index.html'), '<html>SPA</html>');
  writeFileSync(join(pub, 'assets', 'app-abc123.js'), 'console.log(1)');
  writeFileSync(join(pub, 'bins', 'sweden', 'index.html'), '<html>Sweden</html>');
  let t = 1_000_000;
  const now = () => t;
  const store = openStore(join(dir, 'test.db'));
  const app = createApp({ store, publicDir: pub, now });
  return { app, store, advance: (ms: number) => (t += ms) };
}

const bin = { osmId: 42, lat: 52.52, lng: 13.405, name: 'Alexanderplatz' };
const post = (app: ReturnType<typeof setup>['app'], body: unknown, ip = '1.1.1.1', type = 'application/json') =>
  app.request('/api/binned', {
    method: 'POST',
    headers: { 'content-type': type, 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
const popular = (app: ReturnType<typeof setup>['app'], qs = 'lat=52.52&lng=13.405', ip = '9.9.9.9') =>
  app.request(`/api/popular-bins?${qs}`, { headers: { 'x-forwarded-for': ip } });

test('health reports ok', async () => {
  const { app } = setup();
  const res = await app.request('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok', db: 'ok' });
});

test('binned counts once per person per bin within 6h, others still count', async () => {
  const { app, advance } = setup();
  assert.deepEqual(await (await post(app, bin)).json(), { ok: true, counted: true });
  assert.deepEqual(await (await post(app, bin)).json(), { ok: true, counted: false });
  await post(app, bin, '2.2.2.2');
  let rows = await (await popular(app)).json();
  assert.equal(rows[0].count, 2);
  advance(6 * 60 * 60_000 + 1);
  await post(app, bin);
  rows = await (await popular(app)).json();
  assert.equal(rows[0].count, 3);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['count', 'lat', 'lng', 'name', 'osmId']);
});

test('popular-bins only returns bins near the requested point, ordered by count', async () => {
  const { app } = setup();
  await post(app, bin);
  await post(app, { ...bin, osmId: 7, name: 'Other Berlin bin' }, '1.1.1.1');
  await post(app, { ...bin, osmId: 7, name: 'Other Berlin bin' }, '3.3.3.3');
  await post(app, { osmId: 99, lat: 51.5, lng: -0.12, name: 'London' }, '4.4.4.4');
  const rows = await (await popular(app)).json();
  assert.deepEqual(rows.map((r: { osmId: number }) => r.osmId), [7, 42]);
  assert.equal((await popular(app, 'lng=1')).status, 400);
});

test('rejects bad input', async () => {
  const { app } = setup();
  for (const body of [
    { ...bin, lat: 123 },
    { ...bin, osmId: -1 },
    { ...bin, name: '' },
    { ...bin, name: 'x'.repeat(121) },
    { ...bin, userLat: 1 }, // unknown fields are refused, so no personal data can sneak in
  ]) {
    assert.equal((await post(app, body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await post(app, 'not json')).status, 400);
  assert.equal((await post(app, bin, '1.1.1.1', 'text/plain')).status, 415);
  assert.equal((await post(app, { ...bin, name: 'x'.repeat(2000) })).status, 413);
});

test('rate limits writes per client', async () => {
  const { app, advance } = setup();
  for (let i = 1; i <= 10; i++) assert.equal((await post(app, { ...bin, osmId: i })).status, 200);
  const res = await post(app, { ...bin, osmId: 11 });
  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get('retry-after')) > 0);
  assert.equal((await post(app, { ...bin, osmId: 11 }, '5.5.5.5')).status, 200);
  advance(60_001);
  assert.equal((await post(app, { ...bin, osmId: 11 })).status, 200);
});

test('rate-limit key is the last X-Forwarded-For entry (the one Caddy adds)', async () => {
  const { app } = setup();
  for (let i = 1; i <= 10; i++) await post(app, { ...bin, osmId: i }, `spoof-${i}, 6.6.6.6`);
  assert.equal((await post(app, { ...bin, osmId: 11 }, 'another-spoof, 6.6.6.6')).status, 429);
});

test('serves the site: static files, directory index pages, SPA fallback, 404s', async () => {
  const { app } = setup();
  const root = await app.request('/');
  assert.equal(await root.text(), '<html>SPA</html>');

  const asset = await app.request('/assets/app-abc123.js');
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('cache-control') ?? '', /immutable/);

  const city = await app.request('/bins/sweden/');
  assert.equal(await city.text(), '<html>Sweden</html>');
  const cityNoSlash = await app.request('/bins/sweden');
  assert.equal(await cityNoSlash.text(), '<html>Sweden</html>');

  const spa = await app.request('/privacy');
  assert.equal(spa.status, 200);
  assert.equal(await spa.text(), '<html>SPA</html>');
  assert.equal(spa.headers.get('cache-control'), 'no-cache');

  assert.equal((await app.request('/missing.png')).status, 404);
  assert.equal((await app.request('/api/nope')).status, 404);
});
