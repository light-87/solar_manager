-- ============================================
-- R2 Storage Migration: Add Workspace Support
-- ============================================
-- Run these SQL commands in your Supabase SQL Editor
-- to add multi-tenancy support for R2 storage

-- 1. Add workspace_id column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS workspace_id TEXT NOT NULL DEFAULT 'default';

-- 2. Add workspace_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS workspace_id TEXT NOT NULL DEFAULT 'default';

-- 3. Add workspace_id column to step_data table
ALTER TABLE step_data
ADD COLUMN IF NOT EXISTS workspace_id TEXT;

-- 4. Add workspace_id column to audit_log table
ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS workspace_id TEXT;

-- 5. Add workspace_id column to backup_logs table
ALTER TABLE backup_logs
ADD COLUMN IF NOT EXISTS workspace_id TEXT;

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_workspace_id ON customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_step_data_workspace_id ON step_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_workspace_id ON audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_workspace_id ON backup_logs(workspace_id);

-- 7. Update step_data with workspace_id from customers
UPDATE step_data
SET workspace_id = customers.workspace_id
FROM customers
WHERE step_data.customer_id = customers.id
AND step_data.workspace_id IS NULL;

-- 8. Update audit_log with workspace_id from users
UPDATE audit_log
SET workspace_id = users.workspace_id
FROM users
WHERE audit_log.user_id = users.id
AND audit_log.workspace_id IS NULL;

-- 9. Update backup_logs with workspace_id from customers
UPDATE backup_logs
SET workspace_id = customers.workspace_id
FROM customers
WHERE backup_logs.customer_id = customers.id
AND backup_logs.workspace_id IS NULL;

-- 10. Update RLS policies for workspace isolation (optional - enable for production)
-- Uncomment these if you want strict workspace isolation

-- DROP POLICY IF EXISTS "Allow all operations for customers" ON customers;
-- CREATE POLICY "Workspace isolation for customers" ON customers
--   FOR ALL
--   USING (workspace_id = current_setting('app.workspace_id', true));

-- DROP POLICY IF EXISTS "Allow all operations for users" ON users;
-- CREATE POLICY "Workspace isolation for users" ON users
--   FOR ALL
--   USING (workspace_id = current_setting('app.workspace_id', true));

-- DROP POLICY IF EXISTS "Allow all operations for step_data" ON step_data;
-- CREATE POLICY "Workspace isolation for step_data" ON step_data
--   FOR ALL
--   USING (workspace_id = current_setting('app.workspace_id', true));

-- ============================================
-- Notes:
-- ============================================
-- 1. All existing data will be assigned to 'default' workspace
-- 2. You can update specific customers to different workspaces:
--    UPDATE customers SET workspace_id = 'client-a' WHERE id = 'uuid';
-- 3. Workspace IDs should match the workspace codes in your app
-- 4. For production, enable RLS policies above for strict isolation
