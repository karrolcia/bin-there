-- Create bin usage statistics table
CREATE TABLE public.bin_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_lat double precision NOT NULL,
  bin_lng double precision NOT NULL,
  bin_name text NOT NULL,
  usage_count integer DEFAULT 1,
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create unique index to track unique bins (rounded to 6 decimal places)
CREATE UNIQUE INDEX bin_location_idx ON public.bin_usage_stats (
  ROUND(bin_lat::numeric, 6), 
  ROUND(bin_lng::numeric, 6)
);

-- Enable RLS
ALTER TABLE public.bin_usage_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read bin stats
CREATE POLICY "Anyone can view bin usage stats"
  ON public.bin_usage_stats FOR SELECT
  TO public
  USING (true);

-- Policy: Service role can insert and update
CREATE POLICY "Service role can manage bin stats"
  ON public.bin_usage_stats FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);