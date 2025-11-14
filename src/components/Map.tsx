import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { celebrateBinning } from '@/utils/confetti';
import { BinSuccessModal } from './BinSuccessModal';
import { Compass, Heart, Trash2, Navigation, X, MapPin } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { supabase } from '@/integrations/supabase/client';
import { trackAppOpened, trackBinSearched, trackBinMarked, trackRouteCalculated, trackLocationEvent } from '@/utils/activityTracker';

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Resolve CSS HSL variable to RGB for Mapbox compatibility
const resolveCssHslVarToRgb = (varName: string, fallback: string = '#22c55e'): string => {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!raw) return fallback;
    
    // Create a temp element to let the browser resolve the color
    const el = document.createElement('span');
    el.style.color = `hsl(${raw})`;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).color; // Returns "rgb(r, g, b)"
    document.body.removeChild(el);
    return resolved || fallback;
  } catch {
    return fallback;
  }
};


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
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [trashCans, setTrashCans] = useState<TrashCan[]>([]);
  const [isLoadingBins, setIsLoadingBins] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const [showBinnedButton, setShowBinnedButton] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userStats, setUserStats] = useState<{totalBins: number, streakDays: number} | null>(null);
  const [nearestBin, setNearestBin] = useState<TrashCan | null>(null);
  const [currentZoom, setCurrentZoom] = useState(16);
  const [hasActiveRoute, setHasActiveRoute] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [distanceToBin, setDistanceToBin] = useState<number | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [isUsingFallbackLocation, setIsUsingFallbackLocation] = useState(false);
  const clusterClickHandlerRef = useRef<((e: any) => void) | null>(null);
  const pointClickHandlerRef = useRef<((e: any) => void) | null>(null);
  const hasActiveRouteRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  // Helper functions to create SVG elements securely
  const createUserMarkerSVG = (): SVGSVGElement => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'white');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '3 11 22 2 13 21 11 13 3 11');
    
    svg.appendChild(polygon);
    return svg;
  };

  const createBinMarkerSVG = (): SVGSVGElement => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'white');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M3 6h18');
    
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6');
    
    const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path3.setAttribute('d', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2');
    
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '10');
    line1.setAttribute('x2', '10');
    line1.setAttribute('y1', '11');
    line1.setAttribute('y2', '17');
    
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '14');
    line2.setAttribute('x2', '14');
    line2.setAttribute('y1', '11');
    line2.setAttribute('y2', '17');
    
    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);
    svg.appendChild(line1);
    svg.appendChild(line2);
    
    return svg;
  };
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch Mapbox token on mount
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error fetching Mapbox token:', error);
          
          // Check if it's an authentication error
          if (error.message?.includes('Authentication required') || error.message?.includes('Invalid authentication')) {
            toast.error('Please sign in to use the map', { duration: 5000 });
          } else {
            toast.error('Failed to load map configuration');
          }
          return;
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          console.error('No token received from backend');
          toast.error('Map configuration error');
        }
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
        toast.error('Failed to load map configuration');
      }
    };

    fetchMapboxToken();
  }, []);

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

  const fetchWithRetry = async (url: string, body: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, { method: 'POST', body });
        if (response.ok) return response;
        
        if (response.status === 429) {
          // Rate limited - wait longer with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries reached');
  };

  const fetchFallbackBins = async () => {
    try {
      const { data } = await supabase
        .from('bin_usage_stats')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(50);
      
      if (data && data.length > 0) {
        const fallbackBins = data.map(bin => ({
          id: bin.id,
          coordinates: [bin.bin_lng, bin.bin_lat] as [number, number],
          name: bin.bin_name
        }));
        setTrashCans(fallbackBins);
        toast.info('Showing popular bins from community data');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Fallback bins failed:', error);
      return false;
    }
  };

  const fetchNearbyTrashCans = async (lat: number, lon: number, radiusMeters: number = 1000) => {
    setIsLoadingBins(true);
    
    // Track bin search
    trackBinSearched([lon, lat], radiusMeters);
    
    try {
      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["amenity"="waste_basket"](around:${radiusMeters},${lat},${lon});
        );
        out body;
      `;
      
      const response = await fetchWithRetry('https://overpass-api.de/api/interpreter', overpassQuery);
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
      }
      
      setTrashCans(binsToShow);
      
      if (bins.length === 0) {
        toast.info("No bins here just yet — keep walking!");
      }
    } catch (error) {
      console.error('Error fetching trash cans:', error);
      
      // Try fallback bins from database
      const fallbackSuccess = await fetchFallbackBins();
      
      if (!fallbackSuccess) {
        // Better error messages
        if (error instanceof Error) {
          if (error.message.includes('429')) {
            toast.error("Too many requests — wait a moment and try again");
          } else if (error.message.includes('timeout')) {
            toast.error("Connection timed out — check your internet");
          } else {
            toast.error("Couldn't load bins — tap to retry");
          }
        } else {
          toast.error("Oops! Let's try that again");
        }
      }
    } finally {
      setIsLoadingBins(false);
    }
  };

  const getWalkingRoute = async (start: [number, number], end: [number, number]) => {
    if (!mapboxToken) {
      toast.error('Map not ready yet');
      return null;
    }
    
    try {
      const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&access_token=${mapboxToken}`;
      
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

  // Consolidated function to select a bin and calculate route
  const selectBin = useCallback(async (bin: TrashCan) => {
    if (!userLocation) {
      toast.info('Finding you…');
      return;
    }

    setNearestBin(bin);
    setIsCalculatingRoute(true);
    
    const route = await getWalkingRoute(userLocation, bin.coordinates);
    
    setIsCalculatingRoute(false);
    
    if (!route) return;
    
    // Remove existing route if present
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    // Add new route to map
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
    
    // Fit map to route bounds
    const coordinates = route.geometry.coordinates;
    const bounds = coordinates.reduce((bounds: any, coord: any) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    map.current?.fitBounds(bounds, {
      padding: 80,
      duration: 1000,
    });
    
    setRouteInfo({ distance: route.distance, duration: route.duration });
    setShowBinnedButton(true);
    setHasActiveRoute(true);
    hasActiveRouteRef.current = true;
    
    trackRouteCalculated(route.distance, route.duration);
    
    toast.success(`Route to ${bin.name} ready!`);
  }, [userLocation, mapboxToken]);

  // Map initialization with continuous location tracking
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(userCoords);
        
        // Track location enabled and app opened
        trackLocationEvent(true, userCoords);
        trackAppOpened(userCoords);

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: userCoords,
          zoom: 16,
        });

        const userMarkerEl = document.createElement('div');
        userMarkerEl.className = 'w-10 h-10 bg-accent rounded-full flex items-center justify-center border-3 border-gray-800 shadow-xl';
        const userSvg = createUserMarkerSVG();
        userMarkerEl.appendChild(userSvg);
        
        const userMarker = new mapboxgl.Marker({ element: userMarkerEl })
          .setLngLat(userCoords)
          .setPopup(new mapboxgl.Popup().setText('You are here'))
          .addTo(map.current);
        
        userMarkerRef.current = userMarker;

        const initialRadius = getRadiusForZoom(16);
        await fetchNearbyTrashCans(userCoords[1], userCoords[0], initialRadius);

        // Start continuous location tracking
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newCoords: [number, number] = [
              position.coords.longitude,
              position.coords.latitude,
            ];
            setUserLocation(newCoords);

            // Update user marker position
            if (userMarkerRef.current) {
              userMarkerRef.current.setLngLat(newCoords);
            }

            // Check distance to target bin if route is active
            if (hasActiveRoute && nearestBin) {
              const distance = calculateDistance(
                [nearestBin.coordinates[0], nearestBin.coordinates[1]],
                newCoords
              );
              setDistanceToBin(distance);

              // Check if user has arrived (within 30 meters)
              if (distance <= 30 && !hasArrived) {
                setHasArrived(true);
                toast.success('🎉 You\'ve arrived! Tap "Binned It!" to complete.', {
                  duration: 5000,
                });
              }
            }
          },
          (error) => {
            console.error('Location tracking error:', error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );

        watchIdRef.current = watchId;

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Set map as loaded
        map.current.on('load', () => {
          setIsMapLoading(false);
        });
        
        // If map is already loaded, update state
        if (map.current.loaded()) {
          setIsMapLoading(false);
        }

        // Add event listeners for dynamic bin loading
        map.current.on('moveend', (e: any) => {
          if (!map.current) return;
          // Skip refetching while a route is active or during programmatic movements/route calc
          if (hasActiveRouteRef.current) return;
          if (!e?.originalEvent) return; // ignore fitBounds/flyTo easing
          if (isCalculatingRoute) return;

          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          setCurrentZoom(zoom);
          const radius = getRadiusForZoom(zoom);

          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = setTimeout(() => {
            fetchNearbyTrashCans(center.lat, center.lng, radius);
          }, 600);
        });

        map.current.on('zoomend', (e: any) => {
          if (!map.current) return;
          if (hasActiveRouteRef.current) return;
          if (!e?.originalEvent) return;
          if (isCalculatingRoute) return;

          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          setCurrentZoom(zoom);
          const radius = getRadiusForZoom(zoom);

          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = setTimeout(() => {
            fetchNearbyTrashCans(center.lat, center.lng, radius);
          }, 600);
        });
      },
      (error) => {
        console.error('Error getting user location:', error);
        trackLocationEvent(false);
        setIsUsingFallbackLocation(true);
        
        // Fallback to default location (London)
        const defaultCoords: [number, number] = [-0.1276, 51.5074];
        
        // Still initialize the map so users can see something
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: defaultCoords,
          zoom: 12,
        });
        
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        map.current.on('load', () => {
          setIsMapLoading(false);
        });
        
        toast.error(
          'Location access needed to find nearby bins.',
          { duration: 5000 }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Cleanup
    return () => {
      isMountedRef.current = false;
      
      // Stop location tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      // Clean up user marker
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch (e) {
          console.warn('Error removing user marker:', e);
        }
        userMarkerRef.current = null;
      }
      
      // Clean up map (layers and sources are automatically cleaned up)
      if (map.current) {
        try {
          map.current.remove();
          map.current = null;
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current || trashCans.length === 0) return;
    
    // Wait for map to be fully loaded
    const addClusteredMarkers = () => {
      if (!map.current || !isMountedRef.current) return;
      
      // Remove existing bins source and layers if they exist
      if (map.current.getSource('bins')) {
        if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
        if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
        if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
        if (map.current.getLayer('unclustered-icon')) map.current.removeLayer('unclustered-icon');
        map.current.removeSource('bins');
      }

      // Get computed primary color from CSS variables (converted to RGB for Mapbox)
      const primaryColor = resolveCssHslVarToRgb('--primary', '#22c55e');

      // Create GeoJSON source with clustering
      map.current.addSource('bins', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: trashCans.map(bin => ({
            type: 'Feature',
            properties: {
              id: bin.id,
              name: bin.name,
            },
            geometry: {
              type: 'Point',
              coordinates: bin.coordinates,
            },
          })),
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Add cluster circles layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'bins',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            primaryColor,
            10,
            '#3b82f6',
            50,
            '#8b5cf6'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            25,
            50,
            30
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgb(31, 41, 55)',
        },
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'bins',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Add unclustered points (individual bins)
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'bins',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': primaryColor,
          'circle-radius': 18,
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgb(31, 41, 55)',
        },
      });

      // Add bin icon to unclustered points
      const addIconLayer = () => {
        if (!map.current || map.current.getLayer('unclustered-icon')) return;
        
        map.current.addLayer({
          id: 'unclustered-icon',
          type: 'symbol',
          source: 'bins',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'bin-icon',
            'icon-size': 0.5,
            'icon-allow-overlap': true,
          },
        });
      };

      if (!map.current.hasImage('bin-icon')) {
        const binSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
          </svg>
        `;
        const img = new Image(24, 24);
        img.onload = () => {
          if (map.current && isMountedRef.current && !map.current.hasImage('bin-icon')) {
            map.current.addImage('bin-icon', img);
            addIconLayer();
          }
        };
        img.onerror = () => {
          console.error('Failed to load bin icon');
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(binSvg);
      } else {
        // Icon already exists, just add the layer
        addIconLayer();
      }

      // Remove old handlers if they exist
      if (clusterClickHandlerRef.current) {
        map.current.off('click', 'clusters', clusterClickHandlerRef.current);
      }
      if (pointClickHandlerRef.current) {
        map.current.off('click', 'unclustered-point', pointClickHandlerRef.current);
      }

      // Click handler for clusters - zoom in
      const clusterClickHandler = (e: any) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const clusterId = features[0].properties.cluster_id;
        const source = map.current.getSource('bins') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;
          
          map.current.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom,
            duration: 500,
          });
        });
      };

      // Click handler for unclustered points - select bin
      const pointClickHandler = (e: any) => {
        if (!map.current || !e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const binId = feature.properties?.id;
        
        if (!binId) {
          console.warn('Clicked bin has no ID');
          return;
        }
        
        const bin = trashCans.find(b => b.id.toString() === binId.toString());
        
        if (bin) {
          selectBin(bin);
        } else {
          console.warn('Clicked bin not found in trashCans array:', binId);
        }
      };

      // Store references
      clusterClickHandlerRef.current = clusterClickHandler;
      pointClickHandlerRef.current = pointClickHandler;

      // Add handlers
      map.current.on('click', 'clusters', clusterClickHandler);
      map.current.on('click', 'unclustered-point', pointClickHandler);

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    };
    
    if (map.current.loaded()) {
      addClusteredMarkers();
    } else {
      map.current.on('load', addClusteredMarkers);
    }
    
    return () => {
      if (map.current) {
        map.current.off('load', addClusteredMarkers);
        
        // Explicitly remove click handlers
        if (clusterClickHandlerRef.current) {
          map.current.off('click', 'clusters', clusterClickHandlerRef.current);
        }
        if (pointClickHandlerRef.current) {
          map.current.off('click', 'unclustered-point', pointClickHandlerRef.current);
        }
      }
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
    
    await selectBin(nearest);
  };

  const handleBinnedIt = async () => {
    celebrateBinning();
    
    // Track bin marked event
    if (nearestBin) {
      trackBinMarked(nearestBin.coordinates, nearestBin.name);
    }
    
    // Track the bin event in backend with actual arrival location
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
          userArrivalLat: userLocation?.[1], // Actual user location
          userArrivalLng: userLocation?.[0],
          distanceToBin: distanceToBin,
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
    
    // Remove route from map
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setNearestBin(null);
    setRouteInfo(null);
    setShowBinnedButton(false);
    setHasActiveRoute(false);
    hasActiveRouteRef.current = false;
    setDistanceToBin(null);
    setHasArrived(false);
    
    if (userLocation) {
      map.current?.flyTo({
        center: userLocation,
        zoom: 16,
        duration: 1000,
      });
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Requesting location access...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(coords);
        setIsUsingFallbackLocation(false);
        
        if (map.current) {
          map.current.flyTo({
            center: coords,
            zoom: 14,
            duration: 2000,
          });
        }
        
        toast.success('Location access granted!');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to access location. Please enable location services in your browser settings.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCancelRoute = () => {
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    setRouteInfo(null);
    setShowBinnedButton(false);
    setNearestBin(null);
    setHasActiveRoute(false);
    hasActiveRouteRef.current = false;
    setDistanceToBin(null);
    setHasArrived(false);
    toast.info('Route cancelled');
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      {isUsingFallbackLocation && !isMapLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <Button
            onClick={handleRequestLocation}
            className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <MapPin className="mr-2 h-5 w-5" />
            Enable Location
          </Button>
        </div>
      )}
      
      {isLoadingBins && !isMapLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-border/50 z-10">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
            Finding bins nearby...
          </p>
        </div>
      )}
      
      {isCalculatingRoute && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-lg border border-border/50 z-50">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground">Calculating route...</p>
          </div>
        </div>
      )}
      
      {hasActiveRoute && nearestBin && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-primary/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-primary-foreground/20">
          <p className="text-sm font-medium text-primary-foreground flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            {distanceToBin !== null ? (
              distanceToBin <= 30 ? (
                <>🎯 You've arrived at {nearestBin.name}!</>
              ) : (
                <>{Math.round(distanceToBin)}m to {nearestBin.name}</>
              )
            ) : (
              <>Directions to {nearestBin.name}</>
            )}
          </p>
        </div>
      )}
      
      <div className="absolute top-6 left-6 z-10 bg-card/90 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-border/50">
        <img src={logo} alt="bin there" className="h-10 w-auto" />
      </div>
      
      <div className="absolute top-6 right-6 z-10 bg-card/90 backdrop-blur-xl px-4 py-3 rounded-full shadow-lg border border-border/50">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-primary" />
          <span>{trashCans.length} bins nearby</span>
        </p>
      </div>
      
      <div className="absolute bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-6 sm:px-0">
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
              onClick={handleCancelRoute}
              variant="ghost"
              className="bg-white/90 hover:bg-white text-gray-900 shadow-lg px-4 py-2 h-auto text-sm border border-border"
            >
              <X className="w-4 h-4" />
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
        <div className="absolute top-24 sm:top-20 left-6 z-10 bg-card/90 backdrop-blur-xl px-5 py-4 rounded-2xl shadow-lg border border-border/50 bounce-enter">
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
