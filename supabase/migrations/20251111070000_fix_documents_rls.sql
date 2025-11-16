-- ============================================================================
-- FIX DOCUMENTS RLS FOR SERVICE ROLE INSERTS
-- ============================================================================

-- The documents table RLS policies block service role inserts from n8n
-- We need to allow service role to bypass RLS or add a policy for service role

-- Option 1: Allow service role to insert documents (service role bypasses RLS by default)
-- But we need to ensure n8n is using service role key

-- Option 2: Add a policy that allows inserts when metadata contains notebook_id
-- This is already handled by the existing policy, but it requires auth.uid()

-- The real issue: n8n Vector Store node might be using anon key instead of service role
-- Solution: Ensure n8n workflow uses service role key for Supabase Vector Store node

-- For now, let's add a more permissive policy that allows inserts with proper metadata
-- This will work if the metadata contains notebook_id and the user owns the notebook

-- The existing policy should work, but let's verify the function works correctly
-- The function `is_notebook_owner_for_document` checks if auth.uid() matches notebook owner
-- This won't work for service role inserts (which bypass RLS anyway)

-- Actually, service role key bypasses RLS entirely, so if n8n uses service role, it should work
-- The issue might be that n8n is configured to use anon key

-- Let's add a comment and ensure the metadata structure is correct
COMMENT ON TABLE public.documents IS 'Vector store for document embeddings. Metadata must contain notebook_id for RLS policies to work. Service role key bypasses RLS.';

-- Verify the function works correctly
-- The function checks: metadata->>'notebook_id' matches a notebook owned by auth.uid()
-- This works for authenticated users, but service role bypasses RLS

-- If n8n is using anon key, we need to either:
-- 1. Change n8n to use service role key (recommended)
-- 2. Add a policy that allows inserts when metadata contains valid notebook_id (less secure)

-- For debugging: Check if documents are being inserted
-- SELECT COUNT(*) FROM documents;
-- SELECT metadata->>'notebook_id' FROM documents LIMIT 5;

