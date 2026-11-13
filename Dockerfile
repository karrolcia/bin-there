# binthere.online: the built website + the tiny bin-count API in one image.
# Runs on the hippo box next to Hippocampus, in its own container, network and
# volume. See deploy/README.md.

# ---- 1. Build the website (Vite) ------------------------------------------
FROM node:22-slim AS web
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json \
     tailwind.config.ts postcss.config.js components.json ./
COPY public ./public
COPY data ./data
COPY src ./src
# Public Mapbox token (pk.). Comes from /opt/bin-there/.env via docker-compose.
ARG VITE_MAPBOX_TOKEN
RUN test -n "$VITE_MAPBOX_TOKEN" || { echo "VITE_MAPBOX_TOKEN is not set" >&2; exit 1; }
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

# ---- 2. Build and test the API (Hono + SQLite) ------------------------------
FROM node:22-slim AS api
WORKDIR /srv
# Toolchain only in case better-sqlite3 has no prebuilt binary for this arch.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/test ./test
# Tests run on every build, so a failing test stops the deploy.
RUN npm test && npm prune --omit=dev

# ---- 3. Runtime --------------------------------------------------------------
FROM node:22-slim
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    BINTHERE_DB_PATH=/data/binthere.db \
    BINTHERE_PUBLIC_DIR=/app/public
WORKDIR /app
# Own non-root user (uid 1002; Hippocampus uses 1001).
RUN groupadd -g 1002 binthere \
    && useradd -u 1002 -g binthere -s /usr/sbin/nologin -M binthere \
    && mkdir /data && chown binthere:binthere /data
COPY --from=api /srv/package.json ./
COPY --from=api /srv/node_modules ./node_modules
COPY --from=api /srv/dist/src ./dist
COPY --from=web /web/dist ./public
USER binthere
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
