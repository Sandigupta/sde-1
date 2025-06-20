-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table
CREATE TABLE disasters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location_name TEXT,
  location GEOGRAPHY(Point, 4326),
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  owner_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  audit_trail JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Create indexes for efficient queries
CREATE INDEX disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX disasters_created_at_idx ON disasters (created_at);
CREATE INDEX disasters_status_idx ON disasters (status);

-- Create resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID REFERENCES disasters(id),
  title TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(Point, 4326),
  type TEXT CHECK (type IN ('food', 'water', 'shelter', 'medical', 'transport', 'other')),
  quantity INTEGER,
  contact_info JSONB,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID REFERENCES disasters(id),
  user_id TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cache table for geocoding
CREATE TABLE geocoding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name TEXT NOT NULL,
  coordinates GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_name)
);

-- Create social_media_updates table
CREATE TABLE social_media_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID REFERENCES disasters(id),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'bluesky', 'facebook', 'instagram')),
  post_id TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  sentiment_score DECIMAL(5,4),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'suspicious', 'fake')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policies
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_updates ENABLE ROW LEVEL SECURITY;

-- Default policies for authenticated users
CREATE POLICY "Authenticated users can view disasters" ON disasters
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create disasters" ON disasters
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their own disasters" ON disasters
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND owner_id = auth.uid());

-- Create stored procedure for geocoding
CREATE OR REPLACE FUNCTION update_disaster_location(
  location_name TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6)
) RETURNS UUID AS $$
DECLARE
  disaster_id UUID;
BEGIN
  -- Insert or update cache
  INSERT INTO geocoding_cache (location_name, coordinates)
  VALUES (location_name, ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))
  ON CONFLICT (location_name) DO UPDATE SET
    coordinates = EXCLUDED.coordinates,
    last_used_at = now();

  RETURN disaster_id;
END;
$$ LANGUAGE plpgsql;
