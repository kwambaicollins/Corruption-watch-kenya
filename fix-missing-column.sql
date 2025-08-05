-- Fix missing status column in corruption_reports table
-- Run this in your Supabase SQL Editor

-- 1. Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'corruption_reports'
);

-- 2. Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'corruption_reports'
ORDER BY ordinal_position;

-- 3. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corruption_reports' AND column_name = 'status'
    ) THEN
        ALTER TABLE corruption_reports ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corruption_reports' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE corruption_reports ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corruption_reports' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE corruption_reports ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add evidence_files column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corruption_reports' AND column_name = 'evidence_files'
    ) THEN
        ALTER TABLE corruption_reports ADD COLUMN evidence_files TEXT[];
    END IF;
END $$;

-- 4. Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('corruption-evidence', 'corruption-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Disable Row Level Security for this table
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

-- 9. Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'corruption_reports'
ORDER BY ordinal_position; 