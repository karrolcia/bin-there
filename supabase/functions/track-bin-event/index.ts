import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, createRateLimitResponse } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const binEventSchema = z.object({
  binLat: z.number().min(-90).max(90),
  binLng: z.number().min(-180).max(180),
  binName: z.string().trim().min(1).max(200),
  routeDistance: z.number().min(0).optional(),
  routeDuration: z.number().min(0).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: 20 requests per minute per IP
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitResult = await checkRateLimit(ipAddress, 'track-bin-event', {
      maxRequests: 20,
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

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    // Parse and validate input
    const body = await req.json();
    const result = binEventSchema.safeParse(body);
    
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

    const { binLat, binLng, binName, routeDistance, routeDuration } = result.data;

    console.log('Tracking bin event:', { userId, binLat, binLng, binName });

    // Insert bin event
    const { error: insertError } = await supabase
      .from('bin_events')
      .insert({
        user_id: userId,
        bin_lat: binLat,
        bin_lng: binLng,
        bin_name: binName,
        route_distance: routeDistance,
        route_duration: routeDuration,
      });

    if (insertError) {
      console.error('Error inserting bin event:', insertError);
      throw insertError;
    }

    // Update bin usage statistics (for all users, authenticated or not)
    const roundedLat = Math.round(binLat * 1000000) / 1000000; // 6 decimal precision
    const roundedLng = Math.round(binLng * 1000000) / 1000000;

    console.log('Updating bin usage stats:', { roundedLat, roundedLng, binName });

    // Try to find existing bin stats
    const { data: existingStats } = await supabase
      .from('bin_usage_stats')
      .select('id, usage_count')
      .eq('bin_lat', roundedLat)
      .eq('bin_lng', roundedLng)
      .maybeSingle();

    if (existingStats) {
      // Increment usage count
      const { error: updateStatsError } = await supabase
        .from('bin_usage_stats')
        .update({
          usage_count: existingStats.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);
      
      if (updateStatsError) {
        console.error('Error updating bin stats:', updateStatsError);
      } else {
        console.log('Bin stats updated:', existingStats.usage_count + 1);
      }
    } else {
      // Create new bin stats entry
      const { error: insertStatsError } = await supabase
        .from('bin_usage_stats')
        .insert({
          bin_lat: roundedLat,
          bin_lng: roundedLng,
          bin_name: binName,
          usage_count: 1
        });
      
      if (insertStatsError) {
        console.error('Error inserting bin stats:', insertStatsError);
      } else {
        console.log('New bin stats created');
      }
    }

    // If user is authenticated, update their profile stats
    let totalBins = 0;
    let streakDays = 0;

    if (userId) {
      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_bins, streak_days, last_binned_at')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const now = new Date();
      const lastBinnedAt = profile?.last_binned_at ? new Date(profile.last_binned_at) : null;
      
      // Calculate streak - only increment once per calendar day
      let newStreakDays = profile?.streak_days || 0;
      if (lastBinnedAt) {
        const lastBinDate = new Date(lastBinnedAt).toDateString();
        const todayDate = now.toDateString();
        
        if (lastBinDate === todayDate) {
          // Same day - don't increment streak
          newStreakDays = profile?.streak_days || 0;
        } else {
          const hoursSinceLastBin = (now.getTime() - lastBinnedAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastBin < 48) { // Within 2 days maintains streak
            newStreakDays = newStreakDays + 1;
          } else {
            newStreakDays = 1; // Reset streak
          }
        }
      } else {
        newStreakDays = 1;
      }

      totalBins = (profile?.total_bins || 0) + 1;
      streakDays = newStreakDays;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_bins: totalBins,
          streak_days: streakDays,
          last_binned_at: now.toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalBins,
        streakDays,
        message: 'Bin event tracked successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-bin-event:', error);
    
    // Sanitize error messages for client
    let clientMessage = 'An error occurred while tracking your bin event';
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        clientMessage = 'This bin has already been recorded recently';
      } else if (error.message.includes('foreign key')) {
        clientMessage = 'Invalid reference data';
      }
    }
    
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
