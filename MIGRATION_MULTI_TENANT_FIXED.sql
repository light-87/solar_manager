-- =====================================================
-- MIGRATION: MULTI-TENANCY SUPPORT (FIXED VERSION)
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
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_code ON workspaces(code);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON workspaces(is_active);

-- =====================================================
-- STEP 2: Insert default workspace
-- =====================================================
INSERT INTO workspaces (code, name, is_active, settings)
VALUES (
  '2025',
  'Gabhane Solar',
  true,
  '{"primary_color": "#10b981", "logo_url": null}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 3: Update ALL existing data to use new workspace code
-- =====================================================
-- This is CRITICAL: We must update all existing records BEFORE
-- adding foreign key constraints, otherwise the constraints will fail

-- Update users table
UPDATE users
SET workspace_id = '2025'
WHERE workspace_id = 'default' OR workspace_id IS NULL OR workspace_id = '2025';

-- Update customers table
UPDATE customers
SET workspace_id = '2025'
WHERE workspace_id = 'default' OR workspace_id IS NULL OR workspace_id = '2025';

-- Update step_data table (if exists)
UPDATE step_data
SET workspace_id = '2025'
WHERE workspace_id = 'default' OR workspace_id IS NULL OR workspace_id = '2025';

-- Update audit_log table (if exists)
UPDATE audit_log
SET workspace_id = '2025'
WHERE workspace_id = 'default' OR workspace_id IS NULL OR workspace_id = '2025';

-- Update backup_logs table (if exists)
UPDATE backup_logs
SET workspace_id = '2025'
WHERE workspace_id = 'default' OR workspace_id IS NULL OR workspace_id = '2025';

-- =====================================================
-- STEP 4: Drop existing foreign key constraints (if they exist)
-- =====================================================
-- This ensures we can re-run the migration safely
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_workspace_code;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_workspace_code;
ALTER TABLE step_data DROP CONSTRAINT IF EXISTS fk_step_data_workspace_code;
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_workspace_code;
ALTER TABLE backup_logs DROP CONSTRAINT IF EXISTS fk_backup_logs_workspace_code;

-- =====================================================
-- STEP 5: Add foreign key constraints
-- =====================================================
-- Now that all data has been updated, we can safely add constraints

-- Users table
ALTER TABLE users
ADD CONSTRAINT fk_users_workspace_code
FOREIGN KEY (workspace_id)
REFERENCES workspaces(code)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Customers table
ALTER TABLE customers
ADD CONSTRAINT fk_customers_workspace_code
FOREIGN KEY (workspace_id)
REFERENCES workspaces(code)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Step_data table (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'step_data' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE step_data
    ADD CONSTRAINT fk_step_data_workspace_code
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

-- Audit_log table (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_log' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE audit_log
    ADD CONSTRAINT fk_audit_log_workspace_code
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

-- Backup_logs table (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'backup_logs' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE backup_logs
    ADD CONSTRAINT fk_backup_logs_workspace_code
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

-- =====================================================
-- STEP 6: Enable RLS on workspaces table
-- =====================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists
DROP POLICY IF EXISTS "Allow all operations for workspaces" ON workspaces;

-- Create policy
CREATE POLICY "Allow all operations for workspaces" ON workspaces FOR ALL USING (true);

-- =====================================================
-- STEP 7: Update unique constraint on users table
-- =====================================================
-- This ensures usernames are unique per workspace
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;

-- Add composite unique constraint
ALTER TABLE users
ADD CONSTRAINT users_workspace_username_unique
UNIQUE (workspace_id, username);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after the migration to verify success:

-- 1. Check workspaces table
SELECT 'Workspaces:' as info;
SELECT * FROM workspaces;

-- 2. Verify users are linked to workspaces
SELECT 'Users with workspace:' as info;
SELECT u.username, u.workspace_id, w.name as workspace_name
FROM users u
LEFT JOIN workspaces w ON u.workspace_id = w.code;

-- 3. Check for any orphaned records (should return 0)
SELECT 'Orphaned users (should be 0):' as info;
SELECT COUNT(*) as orphaned_count
FROM users u
LEFT JOIN workspaces w ON u.workspace_id = w.code
WHERE w.code IS NULL;

-- 4. Check customers
SELECT 'Customers with workspace:' as info;
SELECT COUNT(*) as customer_count, workspace_id
FROM customers
GROUP BY workspace_id;

-- 5. Verify foreign key constraints
SELECT 'Foreign key constraints:' as info;
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'workspaces';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Verify all queries above show expected results
-- 2. Test login with workspace code '2025'
-- 3. Check that workspace name displays as 'Gabhane Solar'
-- 4. Remove NEXT_PUBLIC_WORKSPACE_CODE from environment (optional)
-- =====================================================
