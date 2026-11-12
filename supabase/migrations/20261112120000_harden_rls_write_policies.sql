-- ==============================================================================
-- SECURITY: remove direct anonymous writes to bin_events and user_activities
-- ==============================================================================
--
-- The anon key is public (it ships in the browser bundle and is committed in
-- .env), so any policy granted to anon/public is effectively granted to the
-- whole internet via the PostgREST API.
--
-- Before this migration both tables had a permissive INSERT policy
-- `WITH CHECK (true)` for every role. Anyone could therefore POST arbitrary rows
-- straight to /rest/v1/bin_events or /rest/v1/user_activities, bypassing the
-- input validation and rate limiting in the edge functions, and could set
-- user_id to another user's id (rows that then show up as that user's history
-- under the "view only their own" SELECT policies).
--
-- The app never inserts into these tables from the browser. All writes go
-- through the track-bin-event and track-activity edge functions, which now use
-- the service role (bypasses RLS) and take user_id only from a verified JWT.
--
-- DEPLOY ORDER: deploy the updated edge functions BEFORE applying this
-- migration. The old function code wrote with the anon key and would start
-- failing once these policies are gone.
-- ==============================================================================

-- 1. Drop the "anyone can insert" policies. With no INSERT policy left for
--    anon/authenticated, RLS denies those inserts; service_role is unaffected.
DROP POLICY IF EXISTS "Anyone can insert bin events" ON public.bin_events;
DROP POLICY IF EXISTS "Anyone can insert activities" ON public.user_activities;

-- 2. Belt and braces: make sure RLS is on for every app table (idempotent).
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bins  ENABLE ROW LEVEL SECURITY;

-- 3. Data constraints mirroring the edge-function validation, so bad rows are
--    rejected even if a future code path forgets to validate. NOT VALID: they
--    apply to new and updated rows only, so existing rows (including any junk
--    written through the old open policies) cannot block this migration.
ALTER TABLE public.bin_events
  ADD CONSTRAINT bin_events_bin_lat_range CHECK (bin_lat BETWEEN -90 AND 90) NOT VALID,
  ADD CONSTRAINT bin_events_bin_lng_range CHECK (bin_lng BETWEEN -180 AND 180) NOT VALID,
  ADD CONSTRAINT bin_events_bin_name_length CHECK (char_length(bin_name) BETWEEN 1 AND 200) NOT VALID,
  ADD CONSTRAINT bin_events_arrival_lat_range CHECK (user_arrival_lat IS NULL OR user_arrival_lat BETWEEN -90 AND 90) NOT VALID,
  ADD CONSTRAINT bin_events_arrival_lng_range CHECK (user_arrival_lng IS NULL OR user_arrival_lng BETWEEN -180 AND 180) NOT VALID;

ALTER TABLE public.user_activities
  ADD CONSTRAINT user_activities_lat_range CHECK (location_lat IS NULL OR location_lat BETWEEN -90 AND 90) NOT VALID,
  ADD CONSTRAINT user_activities_lng_range CHECK (location_lng IS NULL OR location_lng BETWEEN -180 AND 180) NOT VALID,
  ADD CONSTRAINT user_activities_activity_type_length CHECK (char_length(activity_type) BETWEEN 1 AND 50) NOT VALID;
