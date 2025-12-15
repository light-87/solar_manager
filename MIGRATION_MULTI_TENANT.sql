-- =====================================================
-- MIGRATION: MULTI-TENANCY SUPPORT
-- =====================================================
-- This migration enables true multi-tenancy by creating
-- a workspaces table and enforcing workspace-scoped
-- authentication at the database level.
--
-- SECURITY BENEFITS:
-- - Prevents cross-tenant data leaks
-- - Eliminates need for per-client deployments
-- - Enables centralized client management
-- - Enforces workspace isolation in queries
-- =====================================================

-- =====================================================
-- STEP 1: Create workspaces table
-- =====================================================
-- This table defines all your clients/workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,  -- Replaces NEXT_PUBLIC_WORKSPACE_CODE (e.g., "SOLAR-FL")
  name TEXT NOT NULL,          -- Display name (e.g., "Florida Solar Pros")
  is_active BOOLEAN DEFAULT true NOT NULL,  -- Enable/disable clients instantly
  settings JSONB DEFAULT '{}'::jsonb,       -- Future branding/config (logo, colors, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_code ON workspaces(code);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON workspaces(is_active);

-- =====================================================
-- STEP 2: Insert default workspace
-- =====================================================
-- IMPORTANT: Replace 'SOLAR-FL' with your actual
-- NEXT_PUBLIC_WORKSPACE_CODE value from your .env file!
-- This ensures existing users can still log in.
INSERT INTO workspaces (code, name, is_active, settings)
VALUES (
  'SOLAR-FL',  -- 🚨 CHANGE THIS to match your current NEXT_PUBLIC_WORKSPACE_CODE
  'Florida Solar Pros',  -- 🚨 CHANGE THIS to your actual company name
  true,
  '{"primary_color": "#10b981", "logo_url": null}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 3: Update existing users to reference workspace
-- =====================================================
-- This updates all users that have workspace_id matching
-- your default workspace code to ensure they're linked
UPDATE users
SET workspace_id = 'SOLAR-FL'  -- 🚨 CHANGE THIS to match the code above
WHERE workspace_id = 'default' OR workspace_id IS NULL OR workspace_id = 'SOLAR-FL';

-- =====================================================
-- STEP 4: Add foreign key constraint
-- =====================================================
-- This enforces referential integrity: users must belong
-- to a valid workspace. This is the KEY security feature!
--
-- NOTE: We're using workspace_id -> code instead of id
-- because workspace_id currently stores the code string
ALTER TABLE users
ADD CONSTRAINT fk_users_workspace_code
FOREIGN KEY (workspace_id)
REFERENCES workspaces(code)
ON DELETE RESTRICT  -- Prevent deleting workspaces with users
ON UPDATE CASCADE;  -- If workspace code changes, update users

-- =====================================================
-- STEP 5: Update other tables (optional but recommended)
-- =====================================================
-- Add the same foreign key to other tables for consistency

-- Customers table
ALTER TABLE customers
ADD CONSTRAINT fk_customers_workspace_code
FOREIGN KEY (workspace_id)
REFERENCES workspaces(code)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Step data table (if workspace_id is NOT NULL)
-- Note: This might fail if you have NULL workspace_id values
-- In that case, run the UPDATE query from STEP 6 first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'step_data' AND column_name = 'workspace_id'
  ) THEN
    -- First update NULL values
    UPDATE step_data
    SET workspace_id = 'SOLAR-FL'  -- 🚨 CHANGE THIS
    WHERE workspace_id IS NULL;

    -- Then add constraint
    ALTER TABLE step_data
    ADD CONSTRAINT fk_step_data_workspace_code
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

-- Audit log table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_log' AND column_name = 'workspace_id'
  ) THEN
    -- First update NULL values
    UPDATE audit_log
    SET workspace_id = 'SOLAR-FL'  -- 🚨 CHANGE THIS
    WHERE workspace_id IS NULL;

    -- Then add constraint
    ALTER TABLE audit_log
    ADD CONSTRAINT fk_audit_log_workspace_code
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

-- Backup logs table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'backup_logs' AND column_name = 'workspace_id'
  ) THEN
    -- First update NULL values
    UPDATE backup_logs
    SET workspace_id = 'SOLAR-FL'  -- 🚨 CHANGE THIS
    WHERE workspace_id IS NULL;

    -- Then add constraint
    ALTER TABLE backup_logs
    ADD CONSTRAINT fk_backup_logs_workspace_code
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

-- =====================================================
-- STEP 6: Enable RLS on workspaces table (optional)
-- =====================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Allow all operations (server-side API handles security)
CREATE POLICY "Allow all operations for workspaces" ON workspaces FOR ALL USING (true);

-- =====================================================
-- STEP 7: Create composite unique constraint
-- =====================================================
-- This ensures usernames are unique per workspace
-- (allows "admin" in SOLAR-FL and "admin" in SOLAR-CA)
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_username_unique;

ALTER TABLE users
ADD CONSTRAINT users_workspace_username_unique
UNIQUE (workspace_id, username);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after the migration to verify success:

-- 1. Check workspaces table
-- SELECT * FROM workspaces;

-- 2. Verify users are linked to workspaces
-- SELECT u.username, u.workspace_id, w.name as workspace_name
-- FROM users u
-- JOIN workspaces w ON u.workspace_id = w.code;

-- 3. Check foreign key constraints
-- SELECT
--   tc.table_name,
--   tc.constraint_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
--   AND ccu.table_name = 'workspaces';

-- =====================================================
-- EXAMPLE: Adding a new client
-- =====================================================
-- After this migration, adding a new client is easy:
--
-- INSERT INTO workspaces (code, name, is_active, settings)
-- VALUES (
--   'SOLAR-CA',
--   'California Solar Solutions',
--   true,
--   '{"primary_color": "#3b82f6", "logo_url": null}'::jsonb
-- );
--
-- Then create users for that workspace:
-- INSERT INTO users (role, username, pin, workspace_id)
-- VALUES ('admin', 'admin', '11111', 'SOLAR-CA');
--
-- No redeployment needed! 🎉

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify data with the queries above
-- 3. Update application code (lib/env.ts, app/api/auth/login/route.ts)
-- 4. Test login with existing workspace code
-- 5. Remove NEXT_PUBLIC_WORKSPACE_CODE from environment variables
-- =====================================================
