-- Test API Access for corruption_reports table
-- Run this to verify that PostgREST can access the table
-- Run this in your Supabase SQL Editor

-- 1. Test basic table access
SELECT 
    'Basic table access test' as test_name,
    COUNT(*) as record_count
FROM public.corruption_reports;

-- 2. Test INSERT operation (simulate API insert)
INSERT INTO public.corruption_reports (
    corruption_type, 
    description, 
    location, 
    latitude, 
    longitude, 
    date_occurred, 
    status
) VALUES (
    'test_type', 
    'Test API access', 
    'Test Location', 
    0.0, 
    0.0, 
    CURRENT_DATE, 
    'pending'
) RETURNING id, corruption_type, created_at;

-- 3. Test SELECT operation (simulate API select)
SELECT 
    id,
    corruption_type,
    description,
    status,
    created_at
FROM public.corruption_reports 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Test UPDATE operation (simulate API update)
UPDATE public.corruption_reports 
SET status = 'test_updated' 
WHERE corruption_type = 'test_type' 
RETURNING id, status, updated_at;

-- 5. Clean up test data
DELETE FROM public.corruption_reports 
WHERE corruption_type = 'test_type';

-- 6. Verify final state
SELECT 
    'Final verification' as test_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'under_investigation' THEN 1 END) as investigating_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
FROM public.corruption_reports;

-- 7. Check table permissions one more time
SELECT 
    'Permission verification' as test_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'corruption_reports'
ORDER BY grantee, privilege_type; 