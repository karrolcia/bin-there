import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmludGhlcmUiLCJhIjoiY21neXhza3cwMDA0bzhtczdmM2sycmk1ZCJ9.ZkE0KmSlSAEJ14MSeCIh3w';

interface TrashCan {
  id: number | string;
  coordinates: [number, number];
  name: string;
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [trashCans, setTrashCans] = useState<TrashCan[]>([]);
  const [isLoadingBins, setIsLoadingBins] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const [showBinnedButton, setShowBinnedButton] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const fetchNearbyTrashCans = async (lat: number, lon: number, radiusMeters: number = 1000) => {
    setIsLoadingBins(true);
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="waste_basket"](around:${radiusMeters},${lat},${lon});
        );
        out body;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      });
      
      if (!response.ok) throw new Error('Failed to fetch trash cans');
      
      const data = await response.json();
      
      const bins: TrashCan[] = data.elements.map((element: any) => ({
        id: element.id,
        coordinates: [element.lon, element.lat] as [number, number],
        name: element.tags?.name || 'Public Bin',
      }));
      
      setTrashCans(bins);
      
      if (bins.length === 0) {
        toast.info('No bins found nearby');
      } else {
        toast.success(`Found ${bins.length} bins nearby`);
      }
    } catch (error) {
      console.error('Error fetching trash cans:', error);
      toast.error('Could not load nearby bins');
    } finally {
      setIsLoadingBins(false);
    }
  };

  const getWalkingRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch route');
      
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        return {
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching walking route:', error);
      toast.error('Could not calculate route');
      return null;
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(userCoords);

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: userCoords,
          zoom: 16,
        });

        new mapboxgl.Marker({ color: '#2A2A2A' })
          .setLngLat(userCoords)
          .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-medium">You are here</p>'))
          .addTo(map.current);

        await fetchNearbyTrashCans(userCoords[1], userCoords[0], 1000);

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Please enable location services');
        
        const fallbackCoords: [number, number] = [24.9384, 60.1699];
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: fallbackCoords,
          zoom: 16,
        });
      }
    );

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || trashCans.length === 0) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    trashCans.forEach((trash) => {
      const marker = new mapboxgl.Marker({ color: '#6B6B6B' })
        .setLngLat(trash.coordinates)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<p class="text-sm font-medium">${trash.name}</p>`
          )
        )
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [trashCans]);

  const handleBinIt = async () => {
    if (!userLocation) {
      toast.error('Waiting for your location...');
      return;
    }
    
    if (trashCans.length === 0) {
      toast.error('No bins found nearby');
      return;
    }
    
    const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
      const R = 6371e3;
      const φ1 = coord1[1] * Math.PI / 180;
      const φ2 = coord2[1] * Math.PI / 180;
      const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
      const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      return R * c;
    };
    
    const distances = trashCans.map((trash) => ({
      ...trash,
      distance: calculateDistance(userLocation, trash.coordinates),
    }));
    
    const nearest = distances.reduce((prev, current) =>
      prev.distance < current.distance ? prev : current
    );
    
    const route = await getWalkingRoute(userLocation, nearest.coordinates);
    
    if (!route) return;
    
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    map.current?.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: route.geometry,
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
        'line-color': '#2A2A2A',
        'line-width': 4,
      },
    });
    
    const coordinates = route.geometry.coordinates;
    const bounds = coordinates.reduce((bounds: any, coord: any) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    map.current?.fitBounds(bounds, {
      padding: 80,
      duration: 1000,
    });
    
    const distanceText = route.distance < 1000 
      ? `${Math.round(route.distance)}m` 
      : `${(route.distance / 1000).toFixed(1)}km`;
    const durationText = `${Math.ceil(route.duration / 60)} min`;
    
    setRouteInfo({ distance: route.distance, duration: route.duration });
    setShowBinnedButton(true);
    
    toast.success(`${distanceText} away (${durationText} walk)`);
  };

  const handleBinnedIt = () => {
    toast.success('Thanks for keeping it clean!');
    
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    setRouteInfo(null);
    setShowBinnedButton(false);
    
    if (userLocation) {
      map.current?.flyTo({
        center: userLocation,
        zoom: 16,
        duration: 1000,
      });
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur px-4 py-2 rounded-md shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">bin there</h1>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {!showBinnedButton ? (
          <Button
            onClick={handleBinIt}
            disabled={isLoadingBins || trashCans.length === 0}
            className="bg-foreground hover:bg-foreground/90 text-background shadow-lg px-8 py-6 h-auto text-base font-medium"
          >
            {isLoadingBins ? 'Loading bins...' : 'Bin It'}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleBinIt}
              variant="outline"
              className="bg-white hover:bg-gray-50 text-foreground shadow-lg px-6 py-6 h-auto text-base font-medium"
            >
              Find Another
            </Button>
            <Button
              onClick={handleBinnedIt}
              className="bg-foreground hover:bg-foreground/90 text-background shadow-lg px-8 py-6 h-auto text-base font-medium"
            >
              Binned It
            </Button>
          </>
        )}
      </div>
      
      {routeInfo && (
        <div className="absolute top-6 right-6 z-10 bg-white/95 backdrop-blur px-4 py-3 rounded-md shadow-sm">
          <div className="text-sm text-muted-foreground">Distance</div>
          <div className="text-lg font-semibold">
            {routeInfo.distance < 1000 
              ? `${Math.round(routeInfo.distance)}m` 
              : `${(routeInfo.distance / 1000).toFixed(1)}km`}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {Math.ceil(routeInfo.duration / 60)} min walk
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
