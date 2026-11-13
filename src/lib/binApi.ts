// Client for the tiny binthere API (server/ in this repo, served on the same
// origin). It only ever sends public bin data: the OpenStreetMap id,
// coordinates and name of a bin. Never anything about the visitor.

export interface PopularBin {
  osmId: number;
  lat: number;
  lng: number;
  name: string;
  count: number;
}

export async function fetchPopularBins(lat: number, lng: number, radiusKm = 5): Promise<PopularBin[]> {
  const qs = new URLSearchParams({ lat: String(lat), lng: String(lng), radiusKm: String(radiusKm) });
  const res = await fetch(`/api/popular-bins?${qs}`);
  if (!res.ok) throw new Error(`popular-bins ${res.status}`);
  return res.json();
}

export async function reportBinned(bin: { osmId: number; lat: number; lng: number; name: string }) {
  try {
    await fetch('/api/binned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bin),
      keepalive: true,
    });
  } catch {
    // Counting is best-effort; the visitor's own stats are already saved locally.
  }
}
