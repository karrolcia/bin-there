-- ==============================================================================
-- SECURITY FIX: Phase 1 & 3 - Data Exposure and RLS Policy Hardening
-- ==============================================================================

-- PHASE 1: Fix Critical Data Exposure in user_activities and bin_events
-- These tables were allowing public read access to sensitive PII data including
-- IP addresses, precise GPS coordinates, and user agents via OR (user_id IS NULL)

-- Fix user_activities table - Remove public access to PII data
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;

CREATE POLICY "Users can view only their own activities" ON user_activities
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix bin_events table - Remove public access to location data
DROP POLICY IF EXISTS "Users can view their own bin events" ON bin_events;

CREATE POLICY "Users can view only their own bin events" ON bin_events
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- PHASE 3: bin_usage_stats Hardening
-- Explicitly prevent authenticated users from modifying bin_usage_stats
-- (Only service role should manage these stats via edge functions)

DROP POLICY IF EXISTS "Users cannot insert bin stats" ON bin_usage_stats;
CREATE POLICY "Users cannot insert bin stats" ON bin_usage_stats
FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Users cannot update bin stats" ON bin_usage_stats;
CREATE POLICY "Users cannot update bin stats" ON bin_usage_stats
FOR UPDATE TO authenticated
USING (false);

DROP POLICY IF EXISTS "Users cannot delete bin stats" ON bin_usage_stats;
CREATE POLICY "Users cannot delete bin stats" ON bin_usage_stats
FOR DELETE TO authenticated
USING (false);