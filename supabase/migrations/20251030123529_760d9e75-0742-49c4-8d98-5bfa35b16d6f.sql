-- Add user arrival location fields to bin_events table for verification
ALTER TABLE bin_events 
ADD COLUMN user_arrival_lat double precision,
ADD COLUMN user_arrival_lng double precision,
ADD COLUMN distance_to_bin numeric;

-- Add comment explaining these fields
COMMENT ON COLUMN bin_events.user_arrival_lat IS 'Actual latitude where user clicked "Binned It"';
COMMENT ON COLUMN bin_events.user_arrival_lng IS 'Actual longitude where user clicked "Binned It"';
COMMENT ON COLUMN bin_events.distance_to_bin IS 'Distance in meters between user arrival location and bin location';