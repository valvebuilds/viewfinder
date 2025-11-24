-- Create photo_characteristics table to store AI-generated image analysis data
CREATE TABLE IF NOT EXISTS photo_characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  description TEXT,
  scene TEXT,
  dominant_colors TEXT[] DEFAULT '{}',
  people_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT photo_characteristics_photo_id_unique UNIQUE (photo_id)
);

-- Create photo_people table to store individual person detections within photos
CREATE TABLE IF NOT EXISTS photo_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_characteristics_id UUID NOT NULL REFERENCES photo_characteristics(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL, -- The id from the JSON (1, 2, 3, etc.)
  notes TEXT,
  bbox_normalized NUMERIC(10, 8)[] DEFAULT '{}', -- Array of 4 numbers: [x, y, width, height]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT photo_people_unique_per_photo UNIQUE (photo_characteristics_id, person_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photo_characteristics_photo_id ON photo_characteristics(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_characteristics_filename ON photo_characteristics(filename);
CREATE INDEX IF NOT EXISTS idx_photo_characteristics_scene ON photo_characteristics(scene);
CREATE INDEX IF NOT EXISTS idx_photo_people_photo_characteristics_id ON photo_people(photo_characteristics_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on photo_characteristics
CREATE TRIGGER update_photo_characteristics_updated_at
  BEFORE UPDATE ON photo_characteristics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to tables for documentation
COMMENT ON TABLE photo_characteristics IS 'Stores AI-generated characteristics and analysis for photos including scene description, dominant colors, and people count';
COMMENT ON TABLE photo_people IS 'Stores individual person detections within photos with bounding boxes and notes';
COMMENT ON COLUMN photo_characteristics.dominant_colors IS 'Array of dominant color names detected in the image';
COMMENT ON COLUMN photo_people.bbox_normalized IS 'Normalized bounding box coordinates [x, y, width, height] where values are between 0 and 1';

