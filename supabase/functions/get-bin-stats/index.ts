import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkRateLimit, createRateLimitResponse } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: 10 requests per minute per IP
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitResult = await checkRateLimit(ipAddress, 'get-bin-stats', {
      maxRequests: 10,
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

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const minUsage = parseInt(url.searchParams.get('minUsage') || '2');

    console.log('Fetching bin stats:', { limit, minUsage });

    // Get bins ordered by usage count
    const { data: binStats, error } = await supabase
      .from('bin_usage_stats')
      .select('*')
      .gte('usage_count', minUsage)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching bin stats:', error);
      throw error;
    }

    console.log(`Found ${binStats?.length || 0} popular bins`);

    return new Response(
      JSON.stringify(binStats || []),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-bin-stats:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bin statistics' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
