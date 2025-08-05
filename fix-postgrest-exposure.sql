-- Fix PostgREST Schema Exposure for corruption_reports table
-- This script specifically addresses the "pg_pgrst_no_exposed_schemas" error
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current state
SELECT 
    'Current table state' as info,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'corruption_reports';

-- 2. Drop the table completely to start fresh
DROP TABLE IF EXISTS public.corruption_reports CASCADE;
DROP TABLE IF EXISTS corruption_reports CASCADE;

-- 3. Create the table explicitly in the public schema
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

-- 4. Grant ALL permissions to ALL roles (this is critical for PostgREST)
GRANT ALL PRIVILEGES ON public.corruption_reports TO anon;
GRANT ALL PRIVILEGES ON public.corruption_reports TO authenticated;
GRANT ALL PRIVILEGES ON public.corruption_reports TO service_role;
GRANT ALL PRIVILEGES ON public.corruption_reports TO postgres;

-- 5. Grant permissions on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.corruption_reports_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.corruption_reports_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.corruption_reports_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.corruption_reports_id_seq TO postgres;

-- 6. Grant schema usage permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. Disable Row Level Security (RLS) completely
ALTER TABLE public.corruption_reports DISABLE ROW LEVEL SECURITY;

-- 8. Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('corruption-evidence', 'corruption-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corruption_reports_status ON public.corruption_reports(status);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_type ON public.corruption_reports(corruption_type);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_created_at ON public.corruption_reports(created_at);

-- 10. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create trigger to automatically update updated_at
CREATE TRIGGER update_corruption_reports_updated_at 
    BEFORE UPDATE ON public.corruption_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Insert sample data
INSERT INTO public.corruption_reports (corruption_type, description, location, latitude, longitude, date_occurred, status) VALUES
('bribery', 'Sample corruption case in Nairobi', 'Nairobi, Kenya', -1.2921, 36.8219, '2024-01-15', 'pending'),
('embezzlement', 'Fund misappropriation in Mombasa', 'Mombasa, Kenya', -4.0435, 39.6682, '2024-01-10', 'under_investigation'),
('fraud', 'Contract fraud in Kisumu', 'Kisumu, Kenya', -0.0917, 34.7680, '2024-01-05', 'resolved');

-- 13. Verify the table is in the correct schema and has proper permissions
SELECT 
    'Table verification' as info,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'corruption_reports';

-- 14. Check all permissions
SELECT 
    'Permission check' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'corruption_reports';

-- 15. Test direct access
SELECT 
    'Direct access test' as info,
    COUNT(*) as record_count
FROM public.corruption_reports;

-- 16. Check if the table is accessible via PostgREST
-- This should return the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'corruption_reports'
ORDER BY ordinal_position; 