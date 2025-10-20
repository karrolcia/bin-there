import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface TrashCan {
  id: number;
  coordinates: [number, number];
  name: string;
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Mock trash can locations (in a real app, these would come from a database)
  const trashCans: TrashCan[] = [
    { id: 1, coordinates: [-73.9857, 40.7484], name: 'Park Trash Can' },
    { id: 2, coordinates: [-73.9867, 40.7494], name: 'Street Corner Bin' },
    { id: 3, coordinates: [-73.9847, 40.7474], name: 'Plaza Bin' },
    { id: 4, coordinates: [-73.9877, 40.7464], name: 'Main St. Trash' },
  ];

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      toast.success('Map loaded! Finding your location...');
    } else {
      toast.error('Please enter a valid Mapbox token');
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet) return;

    mapboxgl.accessToken = mapboxToken;

    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(userCoords);

        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: userCoords,
          zoom: 15,
        });

        // Add user location marker
        new mapboxgl.Marker({ color: '#22c55e' })
          .setLngLat(userCoords)
          .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">You are here!</p>'))
          .addTo(map.current);

        // Add trash can markers
        trashCans.forEach((trash) => {
          const marker = new mapboxgl.Marker({ color: '#f97316' })
            .setLngLat(trash.coordinates)
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<p class="font-semibold">${trash.name}</p><button class="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm" onclick="window.showRoute(${trash.coordinates})">Show Route</button>`
              )
            )
            .addTo(map.current!);
          markersRef.current.push(marker);
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        toast.success('Map ready! Tap a trash can to see the route.');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get your location. Please enable location services.');
        
        // Fallback to NYC if location fails
        const fallbackCoords: [number, number] = [-73.9857, 40.7484];
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: fallbackCoords,
          zoom: 15,
        });
      }
    );

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken]);

  const findNearestTrash = () => {
    if (!userLocation) {
      toast.error('Waiting for your location...');
      return;
    }

    // Calculate distances
    const distances = trashCans.map((trash) => ({
      ...trash,
      distance: Math.sqrt(
        Math.pow(trash.coordinates[0] - userLocation[0], 2) +
          Math.pow(trash.coordinates[1] - userLocation[1], 2)
      ),
    }));

    // Find nearest
    const nearest = distances.reduce((prev, current) =>
      prev.distance < current.distance ? prev : current
    );

    // Center map on nearest trash can
    map.current?.flyTo({
      center: nearest.coordinates,
      zoom: 16,
      duration: 2000,
    });

    // Show route (simplified - in real app would use Mapbox Directions API)
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    map.current?.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [userLocation, nearest.coordinates],
        },
      },
    });

    map.current?.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#22c55e',
        'line-width': 4,
      },
    });

    const distanceKm = (nearest.distance * 111).toFixed(2); // Rough conversion to km
    toast.success(`Nearest trash can is ${distanceKm}km away at ${nearest.name}!`);
  };

  if (!isTokenSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-muted/30 rounded-lg">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Enter Your Mapbox Token</h3>
            <p className="text-sm text-muted-foreground">
              Get your free token at{' '}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTokenSubmit}>Load Map</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={findNearestTrash}
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-lg px-8 py-6 h-auto"
        >
          🚨 Find Nearest Trash Can!
        </Button>
      </div>
    </div>
  );
};

export default Map;
