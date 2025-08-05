-- Check and fix corruption_reports table structure
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the table exists and what columns it has
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'corruption_reports';

-- 2. If the table doesn't exist or is missing columns, recreate it properly
DROP TABLE IF EXISTS corruption_reports CASCADE;

-- 3. Create the table with all required columns
CREATE TABLE corruption_reports (
    id BIGSERIAL PRIMARY KEY,
    corruption_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    evidence_files TEXT[],
    date_occurred DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('corruption-evidence', 'corruption-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Disable Row Level Security for this table (simpler approach)
ALTER TABLE corruption_reports DISABLE ROW LEVEL SECURITY;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corruption_reports_status ON corruption_reports(status);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_type ON corruption_reports(corruption_type);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_created_at ON corruption_reports(created_at);

-- 7. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_corruption_reports_updated_at ON corruption_reports;
CREATE TRIGGER update_corruption_reports_updated_at 
    BEFORE UPDATE ON corruption_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert some sample data
INSERT INTO corruption_reports (corruption_type, description, location, latitude, longitude, date_occurred, status) VALUES
('bribery', 'Sample corruption case in Nairobi', 'Nairobi, Kenya', -1.2921, 36.8219, '2024-01-15', 'pending'),
('embezzlement', 'Fund misappropriation in Mombasa', 'Mombasa, Kenya', -4.0435, 39.6682, '2024-01-10', 'under_investigation'),
('fraud', 'Contract fraud in Kisumu', 'Kisumu, Kenya', -0.0917, 34.7680, '2024-01-05', 'resolved');

-- 10. Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'corruption_reports'
ORDER BY ordinal_position; 