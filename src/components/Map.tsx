import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { celebrateBinning } from '@/utils/confetti';
import { BinSuccessModal } from './BinSuccessModal';
import { Compass, Heart, Trash2 } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { supabase } from '@/integrations/supabase/client';

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmludGhlcmUiLCJhIjoiY21neXhza3cwMDA0bzhtczdmM2sycmk1ZCJ9.ZkE0KmSlSAEJ14MSeCIh3w';

interface TrashCan {
  id: number | string;
  coordinates: [number, number];
  name: string;
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const isMountedRef = useRef(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [trashCans, setTrashCans] = useState<TrashCan[]>([]);
  const [isLoadingBins, setIsLoadingBins] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const [showBinnedButton, setShowBinnedButton] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userStats, setUserStats] = useState<{totalBins: number, streakDays: number} | null>(null);
  const [nearestBin, setNearestBin] = useState<TrashCan | null>(null);
  const [currentZoom, setCurrentZoom] = useState(16);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const getRadiusForZoom = (zoom: number): number => {
    if (zoom < 14) return 5000;
    if (zoom < 16) return 2000;
    if (zoom < 18) return 1000;
    return 500;
  };

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
      
      // Limit bins if too many
      let binsToShow = bins;
      if (bins.length > 50 && userLocation) {
        const binsWithDistance = bins.map(bin => ({
          ...bin,
          distance: calculateDistance(userLocation, bin.coordinates)
        }));
        
        binsToShow = binsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 50);
        
        toast.info(`Showing 50 nearest bins (${bins.length} total in area)`);
      }
      
      setTrashCans(binsToShow);
      
      if (bins.length === 0) {
        toast.info("No bins here just yet — keep walking!");
      } else {
        toast.success(`${bins.length} bins nearby`);
      }
    } catch (error) {
      console.error('Error fetching trash cans:', error);
      toast.error("Oops! Let's try that again");
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
      toast.error("Oops! Let's try that again");
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

        const userMarkerEl = document.createElement('div');
        userMarkerEl.className = 'w-10 h-10 bg-accent rounded-full flex items-center justify-center border-3 border-gray-800 shadow-xl';
        userMarkerEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        `;
        
        const userMarker = new mapboxgl.Marker({ element: userMarkerEl })
          .setLngLat(userCoords)
          .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-medium">You are here</p>'))
          .addTo(map.current);
        
        userMarkerRef.current = userMarker;

        const initialRadius = getRadiusForZoom(16);
        await fetchNearbyTrashCans(userCoords[1], userCoords[0], initialRadius);

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add event listeners for dynamic bin loading
        map.current.on('moveend', () => {
          if (!map.current) return;
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          setCurrentZoom(zoom);
          const radius = getRadiusForZoom(zoom);
          
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = setTimeout(() => {
            fetchNearbyTrashCans(center.lat, center.lng, radius);
          }, 500);
        });

        map.current.on('zoomend', () => {
          if (!map.current) return;
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          setCurrentZoom(zoom);
          const radius = getRadiusForZoom(zoom);
          
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = setTimeout(() => {
            fetchNearbyTrashCans(center.lat, center.lng, radius);
          }, 500);
        });
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
      isMountedRef.current = false;
      
      // Clean up user marker
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch (e) {
          console.warn('Error removing user marker:', e);
        }
        userMarkerRef.current = null;
      }
      
      // Clean up bin markers
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      markersRef.current = [];
      
      // Clean up map
      if (map.current) {
        try {
          map.current.remove();
          map.current = null;
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || trashCans.length === 0) return;
    
    // Wait for map to be fully loaded
    const addMarkers = () => {
      if (!map.current || !isMountedRef.current) return;
      
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      markersRef.current = [];

      // Get computed primary color from CSS variables
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim();
      const primaryColorHSL = `hsl(${primaryColor})`;

      trashCans.forEach((trash, index) => {
        const binMarkerEl = document.createElement('div');
        
        // Use inline styles for proper rendering
        binMarkerEl.style.cssText = `
          width: 36px;
          height: 36px;
          background-color: ${primaryColorHSL};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border: 3px solid rgb(31, 41, 55);
          cursor: pointer;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        `;
        
        binMarkerEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
          </svg>
        `;
        
        const marker = new mapboxgl.Marker({ element: binMarkerEl })
          .setLngLat(trash.coordinates)
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<p class="text-sm font-medium">${trash.name}</p>`
            )
          )
          .addTo(map.current!);
        
        // Fade in with stagger
        setTimeout(() => {
          binMarkerEl.style.opacity = '1';
        }, 50 + (index * 30));
        
        markersRef.current.push(marker);
      });
    };
    
    if (map.current.loaded()) {
      addMarkers();
    } else {
      map.current.on('load', addMarkers);
    }
    
    return () => {
      map.current?.off('load', addMarkers);
    };
  }, [trashCans]);

  const handleBinIt = async () => {
    if (!userLocation) {
      toast.info('Finding you…');
      return;
    }
    
    if (trashCans.length === 0) {
      toast.info('No bins here just yet — keep walking!');
      return;
    }
    
    const distances = trashCans.map((trash) => ({
      ...trash,
      distance: calculateDistance(userLocation, trash.coordinates),
    }));
    
    const nearest = distances.reduce((prev, current) =>
      prev.distance < current.distance ? prev : current
    );
    
    setNearestBin(nearest);
    
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
        'line-color': '#4A7C6F',
        'line-width': 5,
        'line-opacity': 0.9,
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
    
    toast.success(`There you go. Bin it with pride!`);
  };

  const handleBinnedIt = async () => {
    celebrateBinning();
    
    // Track the bin event in backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : undefined;
      
      const { data, error } = await supabase.functions.invoke('track-bin-event', {
        body: {
          binLat: nearestBin?.coordinates[1],
          binLng: nearestBin?.coordinates[0],
          binName: nearestBin?.name || 'Unknown Bin',
          routeDistance: routeInfo?.distance,
          routeDuration: routeInfo?.duration,
        },
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });

      if (error) {
        console.error('Error tracking bin event:', error);
      } else if (data) {
        setUserStats({
          totalBins: data.totalBins || 0,
          streakDays: data.streakDays || 0,
        });
      }
    } catch (error) {
      console.error('Failed to track bin event:', error);
    }
    
    setShowSuccessModal(true);
    
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    setRouteInfo(null);
    setShowBinnedButton(false);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    
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
      
      <div className="absolute top-6 left-6 z-10 bg-card/90 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-border/50">
        <img src={logo} alt="bin there" className="h-10 w-auto" />
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {!showBinnedButton ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleBinIt}
              disabled={isLoadingBins || trashCans.length === 0}
              className="pulse-hover bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl px-8 py-6 h-auto text-base font-medium transition-all duration-300 flex items-center gap-2"
            >
              <Compass className="w-5 h-5" />
              {isLoadingBins ? 'Locating the nearest bin…' : 'Find Nearest Bin'}
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={handleBinIt}
              className="bg-white/90 hover:bg-white text-gray-900 hover:text-gray-900 shadow-lg px-6 py-6 h-auto text-base font-medium border border-border"
            >
              Find Another
            </Button>
            <Button
              onClick={handleBinnedIt}
              className="pulse-hover bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl px-8 py-6 h-auto text-base font-medium transition-all duration-300 flex items-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Binned It!
            </Button>
          </>
        )}
      </div>
      
      {routeInfo && (
        <div className="absolute top-6 right-6 z-10 bg-card/90 backdrop-blur-xl px-5 py-4 rounded-2xl shadow-lg border border-border/50 bounce-enter">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-lg font-semibold text-foreground">
              {routeInfo.distance < 1000 
                ? `${Math.round(routeInfo.distance)}m` 
                : `${(routeInfo.distance / 1000).toFixed(1)}km`}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            About {Math.ceil(routeInfo.duration / 60)} min walk
          </div>
        </div>
      )}
      
      <BinSuccessModal 
        open={showSuccessModal} 
        onClose={handleCloseSuccessModal}
        totalBins={userStats?.totalBins}
        streakDays={userStats?.streakDays}
      />
    </div>
  );
};

export default Map;
