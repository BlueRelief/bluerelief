-- Migration: Separate location name from coordinates
-- Part 1: Add new coordinate columns
ALTER TABLE disasters 
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT,
ADD COLUMN IF NOT EXISTS location_name VARCHAR(500);

-- Part 2: Parse existing location data
-- Update location_name and extract coordinates from existing location field
-- Location format is typically: "City, Country (lat, lon)"
UPDATE disasters
SET 
  location_name = CASE
    WHEN location ~ '\(.*\)' THEN TRIM(REGEXP_REPLACE(location, '\s*\(.*\)', ''))
    ELSE location
  END,
  latitude = CASE
    WHEN location ~ '\(-?\d+\.?\d*, *-?\d+\.?\d*\)' THEN 
      CAST(SPLIT_PART(REGEXP_REPLACE(REGEXP_REPLACE(location, '.*\(', ''), '\).*', ''), ',', 1) AS FLOAT)
    ELSE NULL
  END,
  longitude = CASE
    WHEN location ~ '\(-?\d+\.?\d*, *-?\d+\.?\d*\)' THEN 
      CAST(SPLIT_PART(REGEXP_REPLACE(REGEXP_REPLACE(location, '.*\(', ''), '\).*', ''), ',', 2) AS FLOAT)
    ELSE NULL
  END
WHERE location IS NOT NULL;

-- Part 3: Keep old location field temporarily for rollback safety
-- After verification, we can drop it in future migration
-- ALTER TABLE disasters DROP COLUMN location;

-- Part 4: Create indexes for coordinate-based queries
CREATE INDEX IF NOT EXISTS idx_disasters_latitude ON disasters(latitude);
CREATE INDEX IF NOT EXISTS idx_disasters_longitude ON disasters(longitude);
CREATE INDEX IF NOT EXISTS idx_disasters_location_name ON disasters(location_name);
CREATE INDEX IF NOT EXISTS idx_disasters_coordinates ON disasters(latitude, longitude);

-- Part 5: Add constraint to ensure both lat and lon exist together
ALTER TABLE disasters
ADD CONSTRAINT check_coordinates_complete 
CHECK (
  (latitude IS NULL AND longitude IS NULL) OR 
  (latitude IS NOT NULL AND longitude IS NOT NULL)
);