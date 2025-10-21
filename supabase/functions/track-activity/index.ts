import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  metadata: z.record(z.any()).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get user agent and IP for additional context
    const userAgent = req.headers.get('user-agent') || null;
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     null;

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