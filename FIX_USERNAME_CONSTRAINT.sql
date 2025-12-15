-- =====================================================
-- FIX: Remove old username unique constraint
-- =====================================================
-- This allows the same username across different workspaces
-- which is essential for multi-tenancy.
--
-- Example: "admin" can exist in workspace "2025" AND "2026"
-- =====================================================

-- Drop the old single-column unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;

-- Also drop this one just in case
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;

-- Verify the composite constraint exists (should already be there from migration)
-- This allows duplicate usernames as long as they're in different workspaces
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_workspace_username_unique;
ALTER TABLE users
ADD CONSTRAINT users_workspace_username_unique
UNIQUE (workspace_id, username);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that only the composite constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users'
  AND constraint_type = 'UNIQUE';

-- This should show only:
-- - users_workspace_username_unique | UNIQUE
-- =====================================================
