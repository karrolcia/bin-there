-- Seed bin_usage_stats with popular bin locations in major cities
-- This provides fallback data when Overpass API is slow or unavailable

-- London bins
INSERT INTO bin_usage_stats (bin_name, bin_lat, bin_lng, usage_count) VALUES
  ('Hyde Park Corner Bin', 51.5028, -0.1528, 25),
  ('Trafalgar Square Bin', 51.5081, -0.1281, 30),
  ('Leicester Square Bin', 51.5101, -0.1299, 28),
  ('Covent Garden Bin', 51.5118, -0.1247, 22),
  ('Tower Bridge Bin', 51.5055, -0.0754, 27),
  ('St. Paul''s Bin', 51.5138, -0.0984, 20),
  ('King''s Cross Bin', 51.5308, -0.1238, 24),
  ('South Bank Bin', 51.5074, -0.1196, 26),
  ('Camden Town Bin', 51.5392, -0.1426, 21),
  ('Notting Hill Bin', 51.5099, -0.1947, 19);

-- New York bins
INSERT INTO bin_usage_stats (bin_name, bin_lat, bin_lng, usage_count) VALUES
  ('Times Square Bin', 40.7580, -73.9855, 35),
  ('Central Park South Bin', 40.7663, -73.9790, 32),
  ('Union Square Bin', 40.7359, -73.9911, 28),
  ('Brooklyn Bridge Bin', 40.7061, -73.9969, 30),
  ('Grand Central Bin', 40.7527, -73.9772, 27),
  ('High Line Bin', 40.7480, -74.0048, 25),
  ('SoHo Bin', 40.7233, -74.0030, 24),
  ('East Village Bin', 40.7265, -73.9815, 22),
  ('Battery Park Bin', 40.7033, -74.0170, 26),
  ('Madison Square Park Bin', 40.7422, -73.9877, 23);

-- Paris bins
INSERT INTO bin_usage_stats (bin_name, bin_lat, bin_lng, usage_count) VALUES
  ('Eiffel Tower Bin', 48.8584, 2.2945, 40),
  ('Louvre Bin', 48.8606, 2.3376, 38),
  ('Notre-Dame Bin', 48.8530, 2.3499, 35),
  ('Champs-Élysées Bin', 48.8698, 2.3078, 33),
  ('Montmartre Bin', 48.8867, 2.3431, 30),
  ('Luxembourg Gardens Bin', 48.8462, 2.3372, 28),
  ('Marais Bin', 48.8575, 2.3625, 27),
  ('Latin Quarter Bin', 48.8507, 2.3444, 26),
  ('Tuileries Bin', 48.8635, 2.3275, 29),
  ('Pont des Arts Bin', 48.8582, 2.3374, 25);

-- Berlin bins
INSERT INTO bin_usage_stats (bin_name, bin_lat, bin_lng, usage_count) VALUES
  ('Brandenburg Gate Bin', 52.5163, 13.3777, 32),
  ('Alexanderplatz Bin', 52.5219, 13.4132, 30),
  ('Reichstag Bin', 52.5186, 13.3762, 28),
  ('East Side Gallery Bin', 52.5053, 13.4397, 26),
  ('Tiergarten Bin', 52.5145, 13.3501, 25),
  ('Potsdamer Platz Bin', 52.5096, 13.3756, 27),
  ('Kreuzberg Bin', 52.4987, 13.4033, 24),
  ('Charlottenburg Bin', 52.5200, 13.2957, 22),
  ('Prenzlauer Berg Bin', 52.5407, 13.4153, 23),
  ('Museum Island Bin', 52.5208, 13.3989, 29);