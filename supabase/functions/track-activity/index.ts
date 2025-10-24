import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, createRateLimitResponse } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Metadata validation schema with explicit allowed fields and size limits
const metadataSchema = z.object({
  searchQuery: z.string().max(200).optional(),
  errorMessage: z.string().max(500).optional(),
  duration: z.number().min(0).max(3600000).optional(), // Max 1 hour in milliseconds
  binId: z.string().uuid().optional(),
  distance: z.number().min(0).max(100000).optional(), // Max 100km in meters
  routeDistance: z.number().min(0).max(100000).optional(),
  routeDuration: z.number().min(0).max(7200000).optional(), // Max 2 hours
  provider: z.string().max(50).optional(),
  deviceType: z.string().max(50).optional(),
}).strict(); // Reject any unknown fields

// Input validation schema
const activitySchema = z.object({
  activityType: z.enum([
    'app_opened',
    'bin_searched', 
    'bin_found',
    'bin_marked',
    'route_calculated',
    'auth_signup',
    'auth_login',
    'map_moved',
    'location_enabled',
    'location_denied'
  ]),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  metadata: metadataSchema.optional(),
});

const MAX_METADATA_SIZE = 5000; // 5KB limit

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: 60 requests per minute per IP
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitResult = await checkRateLimit(ipAddress, 'track-activity', {
      maxRequests: 60,
      windowSeconds: 60,
    });

    if (!rateLimitResult.allowed) {
      console.log('Rate limit exceeded for IP:', ipAddress);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Get user if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    // Parse and validate input
    const body = await req.json();
    const result = activitySchema.safeParse(body);
    
    if (!result.success) {
      console.error('Validation error:', result.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { activityType, locationLat, locationLng, metadata } = result.data;

    // Additional size check for metadata
    if (metadata) {
      const metadataString = JSON.stringify(metadata);
      if (metadataString.length > MAX_METADATA_SIZE) {
        console.error('Metadata size limit exceeded:', metadataString.length);
        return new Response(
          JSON.stringify({ error: 'Metadata too large (max 5KB)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user agent for additional context
    const userAgent = req.headers.get('user-agent') || null;

    console.log('Tracking activity:', { 
      userId, 
      activityType, 
      hasLocation: !!(locationLat && locationLng),
      ipAddress 
    });

    // Insert activity
    const { error: insertError } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        location_lat: locationLat,
        location_lng: locationLng,
        metadata: metadata || {},
        user_agent: userAgent,
        ip_address: ipAddress,
      });

    if (insertError) {
      console.error('Database error inserting activity:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track activity' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-activity:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while tracking activity' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});