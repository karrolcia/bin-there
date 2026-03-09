import { readFileSync, writeFileSync, mkdirSync } from "fs";
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CITIES_PATH = join(__dirname, "..", "data", "cities.json");
const STATS_PATH = join(__dirname, "..", "data", "city-stats.json");
const PUBLIC_DIR = join(__dirname, "..", "public");
const BINS_DIR = join(PUBLIC_DIR, "bins");
const SITEMAP_PATH = join(PUBLIC_DIR, "sitemap.xml");

const BASE_URL = "https://binthere.online";
const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

const cities: City[] = JSON.parse(readFileSync(CITIES_PATH, "utf-8"));
const stats: StatsMap = JSON.parse(readFileSync(STATS_PATH, "utf-8"));

// Build lookup maps
const cityBySlug = new Map<string, City>();
for (const city of cities) {
  cityBySlug.set(city.slug, city);
}

// Group cities by country
const countryCities = new Map<string, City[]>();
for (const city of cities) {
  const list = countryCities.get(city.country) || [];
  list.push(city);
  countryCities.set(city.country, list);
}

// Track which cities we actually generate (totalBins >= 10)
const generatedCities: City[] = [];
const skippedCities: string[] = [];

for (const city of cities) {
  const s = stats[city.slug];
  if (!s || s.totalBins < 10) {
    skippedCities.push(city.slug);
  } else {
    generatedCities.push(city);
  }
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function htmlHead(
  title: string,
  description: string,
  canonical: string,
): string {
  const ogImage = `${BASE_URL}/og-image.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="theme-color" content="hsl(150, 18%, 45%)">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>`;
}

// ---------------------------------------------------------------------------
// City page generation
// ---------------------------------------------------------------------------

function buildCityPage(city: City, s: CityStats): string {
  const { name, country, countryName, lat, lng } = city;
  const { totalBins, dogBins, densityPerKm2, nearbyCities } = s;

  const title = `Public Bins in ${name}, ${countryName} | bin there`;
  const description = `Find ${totalBins} public trash cans in ${name}. Walking directions to the nearest bin. Dog waste bins, recycling points, and more.`;
  const canonical = `${BASE_URL}/bins/${country}/${city.slug}/`;

  const dogBinsSentence =
    dogBins > 0
      ? `, including ${dogBins} dedicated dog waste bins`
      : "";

  const dogBinsCard =
    dogBins > 0
      ? `
      <div style="background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; text-align:center">
        <div style="font-size:28px; font-weight:700; color:#5d7a6a">${dogBins}</div>
        <div style="font-size:14px; color:#6b7280; margin-top:4px">Dog Waste Bins</div>
      </div>`
      : "";

  const dogFaqAnswer =
    dogBins > 0
      ? `Yes, ${name} has ${dogBins} dedicated dog waste bins mapped on OpenStreetMap. These are specifically designated for dog waste disposal. Use the bin there map to locate the nearest dog waste bin to your walking route.`
      : `While ${name} doesn't have specifically marked dog waste bins in OpenStreetMap, most public bins accept dog waste bags. Use the bin there map to find the nearest public bin on your walk.`;

  const relatedCityLinks = (nearbyCities || [])
    .map((slug) => {
      const c = cityBySlug.get(slug);
      if (!c) return "";
      const cs = stats[slug];
      if (!cs || cs.totalBins < 10) return "";
      return `<a href="/bins/${c.country}/${c.slug}/" style="display:inline-block; background:white; border:1px solid #e5e5e5; border-radius:8px; padding:8px 16px; text-decoration:none; color:#1a1c1a; font-size:14px">${escapeHtml(c.name)}</a>`;
    })
    .filter(Boolean)
    .join("\n        ");

  // JSON-LD schemas
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL + "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bins",
        item: BASE_URL + "/bins/",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: countryName,
        item: `${BASE_URL}/bins/${country}/`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: name,
        item: canonical,
      },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Where are the most bins in ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Public bins in ${name} are concentrated in the city center, parks, and along major pedestrian areas. Use the bin there map to see the exact distribution and find the nearest bin to your location.`,
        },
      },
      {
        "@type": "Question",
        name: `Are there dog waste bins in ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: dogFaqAnswer,
        },
      },
      {
        "@type": "Question",
        name: `How do I find the nearest bin in ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Open bin there and click "Bin It" to see all nearby bins on a map. The app uses your GPS location to show the closest bins and provides walking directions. It works anywhere in ${name} with mobile data.`,
        },
      },
    ],
  };

  const placeLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: name,
    address: {
      "@type": "PostalAddress",
      addressLocality: name,
      addressCountry: countryName,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
  };

  const jsonLd = JSON.stringify([breadcrumbLd, faqLd, placeLd]);

  const head = htmlHead(title, description, canonical);

  return `${head}
<body style="margin:0; font-family:Inter,system-ui,sans-serif; background:#fafaf8; color:#1a1c1a">
  <div style="max-width:800px; margin:0 auto; padding:24px 16px">
    <!-- Breadcrumb nav -->
    <nav style="font-size:14px; color:#6b7280; margin-bottom:24px">
      <a href="/" style="color:#5d7a6a; text-decoration:none">bin there</a>
      <span> / </span>
      <a href="/bins/" style="color:#5d7a6a; text-decoration:none">Bins</a>
      <span> / </span>
      <a href="/bins/${country}/" style="color:#5d7a6a; text-decoration:none">${escapeHtml(countryName)}</a>
      <span> / </span>
      <span>${escapeHtml(name)}</span>
    </nav>

    <!-- H1 -->
    <h1 style="font-size:32px; font-weight:700; margin:0 0 8px">Public Bins in ${escapeHtml(name)}</h1>
    <p style="font-size:18px; color:#6b7280; margin:0 0 32px">Find and navigate to ${totalBins} public trash cans</p>

    <!-- Answer capsule for LLM/featured snippet -->
    <section style="background:white; border:1px solid #e5e5e5; border-radius:12px; padding:24px; margin-bottom:24px">
      <h2 style="font-size:20px; font-weight:600; margin:0 0 12px">How many public bins are in ${escapeHtml(name)}?</h2>
      <p style="line-height:1.7; margin:0">${escapeHtml(name)} has approximately ${totalBins} public waste bins mapped on OpenStreetMap${dogBinsSentence}. The city averages ${densityPerKm2} bins per square kilometer. bin there shows all these bins on an interactive map with walking directions to the nearest one, so you never have to search for a place to dispose of waste.</p>
    </section>

    <!-- Stats grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:16px; margin-bottom:32px">
      <div style="background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; text-align:center">
        <div style="font-size:28px; font-weight:700; color:#5d7a6a">${totalBins}</div>
        <div style="font-size:14px; color:#6b7280; margin-top:4px">Public Bins</div>
      </div>${dogBinsCard}
      <div style="background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; text-align:center">
        <div style="font-size:28px; font-weight:700; color:#5d7a6a">${densityPerKm2}</div>
        <div style="font-size:14px; color:#6b7280; margin-top:4px">Bins per km&sup2;</div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center; margin-bottom:40px">
      <a href="/?lat=${lat}&lng=${lng}" style="display:inline-block; background:#5d7a6a; color:white; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:16px">
        Open Map in ${escapeHtml(name)}
      </a>
    </div>

    <!-- FAQ section -->
    <section style="margin-bottom:40px">
      <h2 style="font-size:24px; font-weight:600; margin-bottom:20px">Frequently Asked Questions</h2>

      <div style="background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; margin-bottom:12px">
        <h3 style="font-size:16px; font-weight:600; margin:0 0 8px">Where are the most bins in ${escapeHtml(name)}?</h3>
        <p style="margin:0; color:#6b7280; line-height:1.6">Public bins in ${escapeHtml(name)} are concentrated in the city center, parks, and along major pedestrian areas. Use the bin there map to see the exact distribution and find the nearest bin to your location.</p>
      </div>

      <div style="background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; margin-bottom:12px">
        <h3 style="font-size:16px; font-weight:600; margin:0 0 8px">Are there dog waste bins in ${escapeHtml(name)}?</h3>
        <p style="margin:0; color:#6b7280; line-height:1.6">${dogFaqAnswer}</p>
      </div>

      <div style="background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; margin-bottom:12px">
        <h3 style="font-size:16px; font-weight:600; margin:0 0 8px">How do I find the nearest bin in ${escapeHtml(name)}?</h3>
        <p style="margin:0; color:#6b7280; line-height:1.6">Open bin there and click &quot;Bin It&quot; to see all nearby bins on a map. The app uses your GPS location to show the closest bins and provides walking directions. It works anywhere in ${escapeHtml(name)} with mobile data.</p>
      </div>
    </section>

    <!-- Related cities -->
    <section style="margin-bottom:40px">
      <h2 style="font-size:20px; font-weight:600; margin-bottom:16px">Nearby Cities</h2>
      <div style="display:flex; flex-wrap:wrap; gap:8px">
        ${relatedCityLinks}
      </div>
    </section>

    <!-- Footer links -->
    <div style="text-align:center; padding:20px 0; border-top:1px solid #e5e5e5; font-size:14px; color:#6b7280">
      <a href="/bins/${country}/" style="color:#5d7a6a; text-decoration:none">All cities in ${escapeHtml(countryName)}</a>
      <span style="margin:0 8px">&bull;</span>
      <a href="/bins/" style="color:#5d7a6a; text-decoration:none">All countries</a>
      <span style="margin:0 8px">&bull;</span>
      <a href="/" style="color:#5d7a6a; text-decoration:none">bin there</a>
    </div>
  </div>

  <!-- JSON-LD -->
  <script type="application/ld+json">
  ${jsonLd}
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Country hub page generation
// ---------------------------------------------------------------------------

function buildCountryPage(
  countrySlug: string,
  countryName: string,
  citiesInCountry: City[]
): string {
  const title = `Public Bins in ${countryName} | bin there`;
  const description = `Find public trash cans across ${citiesInCountry.length} cities in ${countryName}. Interactive maps with walking directions to the nearest bin.`;
  const canonical = `${BASE_URL}/bins/${countrySlug}/`;

  const head = htmlHead(title, description, canonical);

  // Sort cities alphabetically
  const sorted = [...citiesInCountry].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const cityCards = sorted
    .map((city) => {
      const s = stats[city.slug];
      if (!s || s.totalBins < 10) return "";
      return `
      <a href="/bins/${city.country}/${city.slug}/" style="display:block; background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; text-decoration:none; color:#1a1c1a; transition:border-color 0.2s">
        <div style="font-size:18px; font-weight:600; margin-bottom:4px">${escapeHtml(city.name)}</div>
        <div style="font-size:14px; color:#6b7280">${s.totalBins} public bins &middot; ${s.densityPerKm2}/km&sup2;</div>
      </a>`;
    })
    .filter(Boolean)
    .join("\n");

  const breadcrumbLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL + "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bins",
        item: BASE_URL + "/bins/",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: countryName,
        item: canonical,
      },
    ],
  });

  return `${head}
<body style="margin:0; font-family:Inter,system-ui,sans-serif; background:#fafaf8; color:#1a1c1a">
  <div style="max-width:800px; margin:0 auto; padding:24px 16px">
    <nav style="font-size:14px; color:#6b7280; margin-bottom:24px">
      <a href="/" style="color:#5d7a6a; text-decoration:none">bin there</a>
      <span> / </span>
      <a href="/bins/" style="color:#5d7a6a; text-decoration:none">Bins</a>
      <span> / </span>
      <span>${escapeHtml(countryName)}</span>
    </nav>

    <h1 style="font-size:32px; font-weight:700; margin:0 0 8px">Public Bins in ${escapeHtml(countryName)}</h1>
    <p style="font-size:18px; color:#6b7280; margin:0 0 32px">Find public trash cans across ${sorted.filter((c) => stats[c.slug]?.totalBins >= 10).length} cities</p>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px; margin-bottom:40px">
      ${cityCards}
    </div>

    <div style="text-align:center; padding:20px 0; border-top:1px solid #e5e5e5; font-size:14px; color:#6b7280">
      <a href="/bins/" style="color:#5d7a6a; text-decoration:none">All countries</a>
      <span style="margin:0 8px">&bull;</span>
      <a href="/" style="color:#5d7a6a; text-decoration:none">bin there</a>
    </div>
  </div>

  <script type="application/ld+json">
  ${breadcrumbLd}
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Directory index page generation
// ---------------------------------------------------------------------------

function buildDirectoryIndex(): string {
  const title = "Public Bins by City | bin there";
  const description =
    "Browse public trash can maps for cities worldwide. Find the nearest bin with walking directions.";
  const canonical = `${BASE_URL}/bins/`;

  const head = htmlHead(title, description, canonical);

  // Build country data with city counts (only cities with >= 10 bins)
  const countryData: { slug: string; name: string; cityCount: number }[] = [];
  for (const [countrySlug, citiesInCountry] of countryCities.entries()) {
    const validCities = citiesInCountry.filter(
      (c) => stats[c.slug] && stats[c.slug].totalBins >= 10
    );
    if (validCities.length === 0) continue;
    const countryName = citiesInCountry[0].countryName;
    countryData.push({
      slug: countrySlug,
      name: countryName,
      cityCount: validCities.length,
    });
  }

  countryData.sort((a, b) => a.name.localeCompare(b.name));

  const countryCards = countryData
    .map(
      (c) => `
      <a href="/bins/${c.slug}/" style="display:block; background:white; border:1px solid #e5e5e5; border-radius:12px; padding:20px; text-decoration:none; color:#1a1c1a">
        <div style="font-size:18px; font-weight:600; margin-bottom:4px">${escapeHtml(c.name)}</div>
        <div style="font-size:14px; color:#6b7280">${c.cityCount} ${c.cityCount === 1 ? "city" : "cities"}</div>
      </a>`
    )
    .join("\n");

  const breadcrumbLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL + "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bins",
        item: canonical,
      },
    ],
  });

  return `${head}
<body style="margin:0; font-family:Inter,system-ui,sans-serif; background:#fafaf8; color:#1a1c1a">
  <div style="max-width:800px; margin:0 auto; padding:24px 16px">
    <nav style="font-size:14px; color:#6b7280; margin-bottom:24px">
      <a href="/" style="color:#5d7a6a; text-decoration:none">bin there</a>
      <span> / </span>
      <span>Bins</span>
    </nav>

    <h1 style="font-size:32px; font-weight:700; margin:0 0 8px">Public Bins by City</h1>
    <p style="font-size:18px; color:#6b7280; margin:0 0 32px">Browse public trash can maps for ${countryData.length} countries</p>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px; margin-bottom:40px">
      ${countryCards}
    </div>

    <div style="text-align:center; padding:20px 0; border-top:1px solid #e5e5e5; font-size:14px; color:#6b7280">
      <a href="/" style="color:#5d7a6a; text-decoration:none">bin there</a>
    </div>
  </div>

  <script type="application/ld+json">
  ${breadcrumbLd}
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Sitemap generation
// ---------------------------------------------------------------------------

function buildSitemap(generatedCountries: Set<string>): string {
  const urls: { loc: string; changefreq: string; priority: string }[] = [];

  // Static pages
  urls.push({ loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" });
  urls.push({
    loc: `${BASE_URL}/faq`,
    changefreq: "monthly",
    priority: "0.8",
  });
  urls.push({
    loc: `${BASE_URL}/privacy`,
    changefreq: "yearly",
    priority: "0.5",
  });
  urls.push({
    loc: `${BASE_URL}/terms`,
    changefreq: "yearly",
    priority: "0.5",
  });

  // Directory index
  urls.push({
    loc: `${BASE_URL}/bins/`,
    changefreq: "weekly",
    priority: "0.9",
  });

  // Country pages
  for (const countrySlug of [...generatedCountries].sort()) {
    urls.push({
      loc: `${BASE_URL}/bins/${countrySlug}/`,
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  // City pages
  for (const city of generatedCities) {
    urls.push({
      loc: `${BASE_URL}/bins/${city.country}/${city.slug}/`,
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  const urlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

function writeFile(filePath: string, content: string): void {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, "utf-8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log(`Loaded ${cities.length} cities, ${Object.keys(stats).length} stats entries`);

  if (skippedCities.length > 0) {
    for (const slug of skippedCities) {
      const s = stats[slug];
      const bins = s ? s.totalBins : "no data";
      console.warn(`  [skip] ${slug}: ${bins} bins (below threshold of 10)`);
    }
  }

  // Track generated countries for sitemap
  const generatedCountries = new Set<string>();

  // A. Generate city pages
  let cityPageCount = 0;
  for (const city of generatedCities) {
    const s = stats[city.slug];
    const html = buildCityPage(city, s);
    const outPath = join(BINS_DIR, city.country, city.slug, "index.html");
    writeFile(outPath, html);
    generatedCountries.add(city.country);
    cityPageCount++;
  }
  console.log(`Generated ${cityPageCount} city pages`);

  // B. Generate country hub pages
  let countryPageCount = 0;
  for (const countrySlug of generatedCountries) {
    const citiesInCountry = countryCities.get(countrySlug);
    if (!citiesInCountry) continue;
    const countryName = citiesInCountry[0].countryName;
    const html = buildCountryPage(countrySlug, countryName, citiesInCountry);
    const outPath = join(BINS_DIR, countrySlug, "index.html");
    writeFile(outPath, html);
    countryPageCount++;
  }
  console.log(`Generated ${countryPageCount} country hub pages`);

  // C. Generate directory index
  const indexHtml = buildDirectoryIndex();
  writeFile(join(BINS_DIR, "index.html"), indexHtml);
  console.log(`Generated directory index`);

  // D. Update sitemap
  const sitemapXml = buildSitemap(generatedCountries);
  writeFileSync(SITEMAP_PATH, sitemapXml, "utf-8");
  console.log(`Updated sitemap.xml`);

  console.log(
    `\nDone. ${cityPageCount} city pages, ${countryPageCount} country pages, 1 directory index.`
  );
}

main();
