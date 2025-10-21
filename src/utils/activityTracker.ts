import { supabase } from '@/integrations/supabase/client';

type ActivityType = 
  | 'app_opened'
  | 'bin_searched'
  | 'bin_found'
  | 'bin_marked'
  | 'route_calculated'
  | 'auth_signup'
  | 'auth_login'
  | 'map_moved'
  | 'location_enabled'
  | 'location_denied';

interface TrackActivityParams {
  activityType: ActivityType;
  locationLat?: number;
  locationLng?: number;
  metadata?: Record<string, any>;
}

export const trackActivity = async (params: TrackActivityParams) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.functions.invoke('track-activity', {
      body: {
        activityType: params.activityType,
        locationLat: params.locationLat,
        locationLng: params.locationLng,
        metadata: params.metadata,
      },
      headers: session?.access_token ? {
        Authorization: `Bearer ${session.access_token}`
      } : undefined,
    });

    if (error) {
      console.error('Failed to track activity:', error);
    }
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.error('Activity tracking error:', error);
  }
};

// Convenience functions
export const trackAppOpened = (location?: [number, number]) => 
  trackActivity({
    activityType: 'app_opened',
    locationLat: location?.[1],
    locationLng: location?.[0],
  });

export const trackBinSearched = (location: [number, number], radius: number) =>
  trackActivity({
    activityType: 'bin_searched',
    locationLat: location[1],
    locationLng: location[0],
    metadata: { radius },
  });

export const trackBinFound = (binLocation: [number, number], binName: string) =>
  trackActivity({
    activityType: 'bin_found',
    locationLat: binLocation[1],
    locationLng: binLocation[0],
    metadata: { binName },
  });

export const trackBinMarked = (binLocation: [number, number], binName: string) =>
  trackActivity({
    activityType: 'bin_marked',
    locationLat: binLocation[1],
    locationLng: binLocation[0],
    metadata: { binName },
  });

export const trackRouteCalculated = (distance: number, duration: number) =>
  trackActivity({
    activityType: 'route_calculated',
    metadata: { distance, duration },
  });

export const trackAuthEvent = (type: 'signup' | 'login') =>
  trackActivity({
    activityType: type === 'signup' ? 'auth_signup' : 'auth_login',
  });

export const trackLocationEvent = (granted: boolean, location?: [number, number]) =>
  trackActivity({
    activityType: granted ? 'location_enabled' : 'location_denied',
    locationLat: location?.[1],
    locationLng: location?.[0],
  });