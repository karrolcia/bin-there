import Database from 'better-sqlite3';

/**
 * The only thing this database stores: how many times each public bin
 * (an OpenStreetMap node) has been used. No user ids, no IPs, no user
 * locations, no timestamps per person. Bin coordinates and names are public
 * OpenStreetMap data.
 */
export interface BinCount {
  osmId: number;
  lat: number;
  lng: number;
  name: string;
  count: number;
}

export interface BinStore {
  increment(bin: Omit<BinCount, 'count'>): void;
  popularNear(lat: number, lng: number, radiusKm: number, limit: number): BinCount[];
  healthy(): boolean;
  close(): void;
}

export function openStore(path: string): BinStore {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');

  db.exec(`
    CREATE TABLE IF NOT EXISTS bin_counts (
      osm_id     INTEGER PRIMARY KEY CHECK (osm_id > 0),
      lat        REAL    NOT NULL CHECK (lat BETWEEN -90 AND 90),
      lng        REAL    NOT NULL CHECK (lng BETWEEN -180 AND 180),
      name       TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
      count      INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
      updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS bin_counts_lat_lng ON bin_counts (lat, lng);
  `);

  const upsert = db.prepare(`
    INSERT INTO bin_counts (osm_id, lat, lng, name, count)
    VALUES (@osmId, @lat, @lng, @name, 1)
    ON CONFLICT (osm_id) DO UPDATE SET
      count = count + 1,
      lat = excluded.lat,
      lng = excluded.lng,
      name = excluded.name,
      updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
  `);

  const near = db.prepare(`
    SELECT osm_id AS osmId, lat, lng, name, count
    FROM bin_counts
    WHERE lat BETWEEN @minLat AND @maxLat
      AND lng BETWEEN @minLng AND @maxLng
      AND count > 0
    ORDER BY count DESC, osm_id
    LIMIT @limit
  `);

  const ping = db.prepare('SELECT 1 AS ok');

  return {
    increment(bin) {
      upsert.run(bin);
    },
    popularNear(lat, lng, radiusKm, limit) {
      // Bounding box is close enough for "bins around me"; no PostGIS needed.
      const dLat = radiusKm / 111.32;
      const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
      const dLng = Math.min(radiusKm / (111.32 * cos), 180);
      return near.all({
        minLat: lat - dLat,
        maxLat: lat + dLat,
        minLng: lng - dLng,
        maxLng: lng + dLng,
        limit,
      }) as BinCount[];
    },
    healthy() {
      try {
        return (ping.get() as { ok: number }).ok === 1;
      } catch {
        return false;
      }
    },
    close() {
      db.close();
    },
  };
}
