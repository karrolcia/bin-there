// Product analytics go to PostHog (EU cloud), which index.html already loads.
// Privacy rule for every event below: never send the visitor's own location.
// Bin coordinates are public OpenStreetMap data, so they are fine to send.

type PostHog = { capture: (event: string, properties?: Record<string, unknown>) => void };

const capture = (event: string, properties?: Record<string, unknown>) => {
  try {
    (window as unknown as { posthog?: PostHog }).posthog?.capture(event, properties);
  } catch {
    // Analytics must never break the app.
  }
};

export const trackAppOpened = () => capture('app_opened');

export const trackBinSearched = (radius: number) => capture('bin_searched', { radius });

export const trackBinMarked = (binLocation: [number, number], binName: string) =>
  capture('bin_marked', { bin_lat: binLocation[1], bin_lng: binLocation[0], bin_name: binName });

export const trackRouteCalculated = (distance: number, duration: number) =>
  capture('route_calculated', { distance, duration });

export const trackLocationEvent = (granted: boolean) =>
  capture(granted ? 'location_enabled' : 'location_denied');

export const trackBinReported = (problem: string) => capture('bin_reported', { problem });
