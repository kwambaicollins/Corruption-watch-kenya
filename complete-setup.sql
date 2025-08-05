-- Complete Supabase Setup Script for Corruption Watch Kenya
-- This script handles all potential issues including schema exposure
-- Run this in your Supabase SQL Editor

-- 1. Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS public.corruption_reports CASCADE;

-- 2. Create the table in the public schema with all required columns
CREATE TABLE public.corruption_reports (
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

-- 3. Grant ALL permissions to all roles (this is crucial for API access)
GRANT ALL ON public.corruption_reports TO anon;
GRANT ALL ON public.corruption_reports TO authenticated;
GRANT ALL ON public.corruption_reports TO service_role;

-- 4. Grant permissions on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.corruption_reports_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.corruption_reports_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.corruption_reports_id_seq TO service_role;

-- 5. Disable Row Level Security (RLS) for this table
ALTER TABLE public.corruption_reports DISABLE ROW LEVEL SECURITY;

-- 6. Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('corruption-evidence', 'corruption-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corruption_reports_status ON public.corruption_reports(status);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_type ON public.corruption_reports(corruption_type);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_created_at ON public.corruption_reports(created_at);

-- 8. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger to automatically update updated_at
CREATE TRIGGER update_corruption_reports_updated_at 
    BEFORE UPDATE ON public.corruption_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert sample data
INSERT INTO public.corruption_reports (corruption_type, description, location, latitude, longitude, date_occurred, status) VALUES
('bribery', 'Sample corruption case in Nairobi', 'Nairobi, Kenya', -1.2921, 36.8219, '2024-01-15', 'pending'),
('embezzlement', 'Fund misappropriation in Mombasa', 'Mombasa, Kenya', -4.0435, 39.6682, '2024-01-10', 'under_investigation'),
('fraud', 'Contract fraud in Kisumu', 'Kisumu, Kenya', -0.0917, 34.7680, '2024-01-05', 'resolved');

-- 11. Verify the setup
SELECT 
    'Table created successfully' as status,
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename = 'corruption_reports';

-- 12. Check permissions
SELECT 
    'Permissions granted' as status,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'corruption_reports';

-- 13. Test the table is accessible
SELECT 
    'Table is accessible' as status,
    COUNT(*) as record_count
FROM public.corruption_reports; 