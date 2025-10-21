-- Create user activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  activity_type TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own activities
CREATE POLICY "Users can view their own activities"
ON public.user_activities
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy: Anyone can insert activities (for tracking anonymous users too)
CREATE POLICY "Anyone can insert activities"
ON public.user_activities
FOR INSERT
WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX idx_user_activities_type ON public.user_activities(activity_type);

-- Add comment for documentation
COMMENT ON TABLE public.user_activities IS 'Tracks user activity including app usage, location, and actions for analytics and improvement';
COMMENT ON COLUMN public.user_activities.activity_type IS 'Types: app_opened, bin_searched, bin_found, bin_marked, route_calculated, auth_signup, auth_login';
COMMENT ON COLUMN public.user_activities.metadata IS 'Additional context like search radius, bin count, error messages, etc.';