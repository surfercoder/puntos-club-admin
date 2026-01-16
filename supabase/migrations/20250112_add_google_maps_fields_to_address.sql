-- Add Google Maps fields to address table
-- These fields store additional data from Google Places API for address validation

ALTER TABLE address
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add index on place_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_address_place_id ON address(place_id);

-- Add index on coordinates for geospatial queries
CREATE INDEX IF NOT EXISTS idx_address_coordinates ON address(latitude, longitude);

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN address.country IS 'Country name from Google Places API';
COMMENT ON COLUMN address.place_id IS 'Google Places unique identifier for address validation';
COMMENT ON COLUMN address.latitude IS 'Geographic latitude coordinate from Google Places API';
COMMENT ON COLUMN address.longitude IS 'Geographic longitude coordinate from Google Places API';
