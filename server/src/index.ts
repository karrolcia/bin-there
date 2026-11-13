import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { openStore } from './db.js';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const dbPath = process.env.BINTHERE_DB_PATH ?? './binthere.db';
const publicDir = process.env.BINTHERE_PUBLIC_DIR ?? './public';

const store = openStore(dbPath);
const app = createApp({ store, publicDir });

const server = serve({ fetch: app.fetch, port, hostname: host }, (info) => {
  console.log(`binthere listening on ${info.address}:${info.port}`);
});

const shutdown = () => {
  server.close(() => {
    store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
