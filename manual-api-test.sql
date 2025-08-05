-- Manual API Test for PostgREST Access
-- Run this to manually test if the API can access the table
-- Run this in your Supabase SQL Editor

-- 1. Test basic table existence and access
SELECT 
    'Step 1: Basic table access' as test_step,
    COUNT(*) as record_count,
    'SUCCESS' as status
FROM public.corruption_reports;

-- 2. Test INSERT operation (simulate what the API does)
DO $$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO public.corruption_reports (
        corruption_type, 
        description, 
        location, 
        latitude, 
        longitude, 
        date_occurred, 
        status
    ) VALUES (
        'api_test', 
        'Testing API access via PostgREST', 
        'Test Location', 
        0.0, 
        0.0, 
        CURRENT_DATE, 
        'pending'
    ) RETURNING id INTO new_id;
    
    RAISE NOTICE 'Step 2: INSERT test - SUCCESS, new ID: %', new_id;
END $$;

-- 3. Test SELECT operation with filtering (simulate API queries)
SELECT 
    'Step 3: SELECT test' as test_step,
    id,
    corruption_type,
    description,
    status,
    created_at
FROM public.corruption_reports 
WHERE corruption_type = 'api_test'
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Test UPDATE operation
UPDATE public.corruption_reports 
SET status = 'api_test_updated' 
WHERE corruption_type = 'api_test' 
RETURNING id, status, updated_at;

-- 5. Clean up test data
DELETE FROM public.corruption_reports 
WHERE corruption_type = 'api_test';

-- 6. Final verification
SELECT 
    'Step 6: Final verification' as test_step,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'under_investigation' THEN 1 END) as investigating_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
FROM public.corruption_reports;

-- 7. Check if the table is properly exposed to PostgREST
SELECT 
    'Step 7: PostgREST exposure check' as test_step,
    schemaname,
    tablename,
    tableowner,
    CASE 
        WHEN schemaname = 'public' THEN 'SUCCESS - Table in public schema'
        ELSE 'FAILURE - Table not in public schema'
    END as status
FROM pg_tables 
WHERE tablename = 'corruption_reports';

-- 8. Verify all required permissions are granted
SELECT 
    'Step 8: Permission verification' as test_step,
    grantee,
    privilege_type,
    CASE 
        WHEN privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE') THEN 'SUCCESS'
        ELSE 'WARNING'
    END as status
FROM information_schema.role_table_grants 
WHERE table_name = 'corruption_reports'
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type; 