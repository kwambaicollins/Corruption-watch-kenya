-- Fix schema exposure for corruption_reports table
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the table exists and is in the public schema
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'corruption_reports';

-- 2. Make sure the table is in the public schema
-- If it's not, we'll need to move it or recreate it
DO $$
BEGIN
    -- Check if table exists in public schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'corruption_reports'
    ) THEN
        -- Create the table in public schema if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.corruption_reports (
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
    END IF;
END $$;

-- 3. Grant necessary permissions to the anon and authenticated roles
GRANT ALL ON public.corruption_reports TO anon;
GRANT ALL ON public.corruption_reports TO authenticated;
GRANT ALL ON public.corruption_reports TO service_role;

-- 4. Grant usage on the sequence
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. Specifically grant permissions on the corruption_reports sequence
GRANT USAGE, SELECT ON SEQUENCE corruption_reports_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE corruption_reports_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE corruption_reports_id_seq TO service_role;

-- 6. Disable Row Level Security (RLS) for this table
ALTER TABLE public.corruption_reports DISABLE ROW LEVEL SECURITY;

-- 7. Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('corruption-evidence', 'corruption-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corruption_reports_status ON public.corruption_reports(status);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_type ON public.corruption_reports(corruption_type);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_created_at ON public.corruption_reports(created_at);

-- 9. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_corruption_reports_updated_at ON public.corruption_reports;
CREATE TRIGGER update_corruption_reports_updated_at 
    BEFORE UPDATE ON public.corruption_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert some sample data if table is empty
INSERT INTO public.corruption_reports (corruption_type, description, location, latitude, longitude, date_occurred, status) 
SELECT * FROM (VALUES
    ('bribery', 'Sample corruption case in Nairobi', 'Nairobi, Kenya', -1.2921, 36.8219, '2024-01-15', 'pending'),
    ('embezzlement', 'Fund misappropriation in Mombasa', 'Mombasa, Kenya', -4.0435, 39.6682, '2024-01-10', 'under_investigation'),
    ('fraud', 'Contract fraud in Kisumu', 'Kisumu, Kenya', -0.0917, 34.7680, '2024-01-05', 'resolved')
) AS v(corruption_type, description, location, latitude, longitude, date_occurred, status)
WHERE NOT EXISTS (SELECT 1 FROM public.corruption_reports LIMIT 1);

-- 12. Verify the table is properly exposed
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'corruption_reports';

-- 13. Check permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'corruption_reports'; 