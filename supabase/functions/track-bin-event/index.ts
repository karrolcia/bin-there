import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    const { binLat, binLng, binName, routeDistance, routeDuration } = await req.json();

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
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
