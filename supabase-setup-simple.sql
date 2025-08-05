-- Simple Supabase Setup Script for Corruption Watch Kenya
-- Run this in your Supabase SQL Editor

-- 1. Create the corruption_reports table
CREATE TABLE IF NOT EXISTS corruption_reports (
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

-- 2. Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('corruption-evidence', 'corruption-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Disable Row Level Security for this table (simpler approach)
ALTER TABLE corruption_reports DISABLE ROW LEVEL SECURITY;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corruption_reports_status ON corruption_reports(status);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_type ON corruption_reports(corruption_type);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_created_at ON corruption_reports(created_at);

-- 5. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER update_corruption_reports_updated_at 
    BEFORE UPDATE ON corruption_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert some sample data (optional)
INSERT INTO corruption_reports (corruption_type, description, location, latitude, longitude, date_occurred, status) VALUES
('bribery', 'Sample corruption case in Nairobi', 'Nairobi, Kenya', -1.2921, 36.8219, '2024-01-15', 'pending'),
('embezzlement', 'Fund misappropriation in Mombasa', 'Mombasa, Kenya', -4.0435, 39.6682, '2024-01-10', 'under_investigation'),
('fraud', 'Contract fraud in Kisumu', 'Kisumu, Kenya', -0.0917, 34.7680, '2024-01-05', 'resolved')
ON CONFLICT DO NOTHING; 