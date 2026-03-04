import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface City {
  slug: string;
  name: string;
  country: string;
  countryName: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

interface CityStats {
  totalBins: number;
  dogBins: number;
  densityPerKm2: number;
  nearbyCities: string[];
  lastUpdated: string;
}

type StatsMap = Record<string, CityStats>;

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CITIES_PATH = join(__dirname, "..", "data", "cities.json");
const STATS_PATH = join(__dirname, "..", "data", "city-stats.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Haversine distance in km between two lat/lng points. */
function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Return 3-5 nearest city slugs sorted by distance. */
function findNearbyCities(target: City, allCities: City[]): string[] {
  const distances = allCities
    .filter((c) => c.slug !== target.slug)
    .map((c) => ({
      slug: c.slug,
      dist: haversine(target.lat, target.lng, c.lat, c.lng),
    }))
    .sort((a, b) => a.dist - b.dist);

  // Take up to 5, but at least 3 if available
  const maxNearby = Math.min(5, distances.length);
  const count = Math.max(3, maxNearby);
  return distances.slice(0, count).map((d) => d.slug);
}

/** Sleep for ms milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Today as YYYY-MM-DD. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Check if an entry is still fresh (less than 7 days old). */
function isFresh(lastUpdated: string): boolean {
  const updated = new Date(lastUpdated).getTime();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return now - updated < sevenDays;
}

// ---------------------------------------------------------------------------
// Overpass API
// ---------------------------------------------------------------------------

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

async function fetchBinsForCity(
  city: City,
  retries = 3
): Promise<{ totalBins: number; dogBins: number }> {
  const radiusMeters = city.radiusKm * 1000;
  const query = `[out:json][timeout:30];(node["amenity"="waste_basket"](around:${radiusMeters},${city.lat},${city.lng}););out body;`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (response.status === 429 || response.status === 504) {
      if (attempt < retries) {
        const backoff = attempt * 10000; // 10s, 20s, 30s
        console.log(`         [retry ${attempt}/${retries}] ${response.status}, waiting ${backoff / 1000}s...`);
        await sleep(backoff);
        continue;
      }
    }

    if (!response.ok) {
      throw new Error(
        `Overpass API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as OverpassResponse;
    const elements = data.elements;

    const totalBins = elements.length;
    const dogBins = elements.filter(
      (el) => el.tags?.waste && el.tags.waste.toLowerCase().includes("dog")
    ).length;

    return { totalBins, dogBins };
  }

  throw new Error("Max retries exhausted");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Read cities
  const cities: City[] = JSON.parse(readFileSync(CITIES_PATH, "utf-8"));
  console.log(`Loaded ${cities.length} cities from cities.json`);

  // Load existing stats (cache)
  let existingStats: StatsMap = {};
  if (existsSync(STATS_PATH)) {
    try {
      existingStats = JSON.parse(readFileSync(STATS_PATH, "utf-8"));
    } catch {
      console.warn("Could not parse existing city-stats.json, starting fresh.");
    }
  }

  const stats: StatsMap = { ...existingStats };
  let fetched = 0;
  let cached = 0;
  let errors = 0;

  for (const city of cities) {
    // Check cache
    const existing = existingStats[city.slug];
    if (existing && existing.lastUpdated && isFresh(existing.lastUpdated)) {
      console.log(`  [cache] ${city.name} — last updated ${existing.lastUpdated}`);
      // Recalculate nearbyCities in case the city list changed
      stats[city.slug] = {
        ...existing,
        nearbyCities: findNearbyCities(city, cities),
      };
      cached++;
      continue;
    }

    // Fetch from Overpass
    try {
      console.log(`  [fetch] ${city.name} (${city.country})...`);
      const { totalBins, dogBins } = await fetchBinsForCity(city);
      const areaKm2 = Math.PI * city.radiusKm ** 2;
      const densityPerKm2 = Math.round((totalBins / areaKm2) * 10) / 10;

      stats[city.slug] = {
        totalBins,
        dogBins,
        densityPerKm2,
        nearbyCities: findNearbyCities(city, cities),
        lastUpdated: todayISO(),
      };

      console.log(`         ${totalBins} bins, ${dogBins} dog bins, ${densityPerKm2}/km2`);
      fetched++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [error] ${city.name}: ${message}`);
      errors++;
    }

    // Rate limit: 1 request per 5 seconds
    await sleep(5000);
  }

  // Write results
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${STATS_PATH}`);
  console.log(
    `Fetched data for ${fetched} cities, ${cached} from cache, ${errors} errors.`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
