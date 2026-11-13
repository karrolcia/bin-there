#!/usr/bin/env bash
# Nightly copy of binthere's SQLite (bin counts only, no personal data).
# Consistent snapshot via the SQLite backup API inside the running container,
# then copied out to /var/backups/binthere. Keeps the last 14.
set -euo pipefail

DEST=/var/backups/binthere
KEEP=14
STAMP=$(date -u +%Y-%m-%d-%H%M%S)

mkdir -p "$DEST"
docker exec -w /app binthere node -e '
  const Database = require("better-sqlite3");
  const db = new Database(process.env.BINTHERE_DB_PATH, { readonly: true });
  db.backup("/tmp/binthere-backup.db")
    .then(() => { db.close(); })
    .catch((e) => { console.error(e); process.exit(1); });
'
docker cp binthere:/tmp/binthere-backup.db "$DEST/binthere-$STAMP.db"
docker exec binthere rm -f /tmp/binthere-backup.db
ls -1t "$DEST"/binthere-*.db | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "binthere backup ok: $DEST/binthere-$STAMP.db"
