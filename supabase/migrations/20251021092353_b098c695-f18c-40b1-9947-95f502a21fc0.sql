-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for bin status
CREATE TYPE public.bin_status AS ENUM ('active', 'full', 'removed');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  total_bins INTEGER DEFAULT 0 NOT NULL,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  last_binned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create bin_events table to track every "Binned It" action
CREATE TABLE public.bin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bin_lat DOUBLE PRECISION NOT NULL,
  bin_lng DOUBLE PRECISION NOT NULL,
  bin_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  route_distance NUMERIC,
  route_duration NUMERIC
);

-- Enable RLS on bin_events
ALTER TABLE public.bin_events ENABLE ROW LEVEL SECURITY;

-- Bin events policies (write-only for privacy)
CREATE POLICY "Anyone can insert bin events"
  ON public.bin_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own bin events"
  ON public.bin_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create community_bins table for user-reported bins
CREATE TABLE public.community_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  name TEXT NOT NULL,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  times_used INTEGER DEFAULT 0 NOT NULL,
  status public.bin_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on community_bins
ALTER TABLE public.community_bins ENABLE ROW LEVEL SECURITY;

-- Community bins policies
CREATE POLICY "Anyone can view active community bins"
  ON public.community_bins FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can insert community bins"
  ON public.community_bins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Authenticated users can update their own bins"
  ON public.community_bins FOR UPDATE
  TO authenticated
  USING (auth.uid() = reported_by);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, NOW());
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_bin_events_user_id ON public.bin_events(user_id);
CREATE INDEX idx_bin_events_timestamp ON public.bin_events(timestamp DESC);
CREATE INDEX idx_community_bins_lat_lng ON public.community_bins(lat, lng);
CREATE INDEX idx_community_bins_status ON public.community_bins(status);