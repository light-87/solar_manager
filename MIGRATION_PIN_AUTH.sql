-- =====================================================
-- MIGRATION: PIN-BASED AUTHENTICATION WITH WORKSPACE
-- =====================================================
-- This migration updates the users table to support:
-- - Username field (unique identifier)
-- - Plain text PIN storage (5 digits)
-- - Workspace-based multi-deployment support
-- =====================================================

-- Step 1: Add username column to users table
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- Step 2: Rename pin_hash to pin (will store plain text 5-digit PIN)
-- =====================================================
ALTER TABLE users RENAME COLUMN pin_hash TO pin;

-- Step 3: Update existing users with temporary usernames
-- =====================================================
-- NOTE: You need to manually update these to desired usernames
-- and set actual 5-digit PINs after running this migration
UPDATE users SET username = 'admin' WHERE role = 'admin' AND username IS NULL;
UPDATE users SET username = 'employee' WHERE role = 'employee' AND username IS NULL;

-- Set temporary PINs (you should change these immediately)
UPDATE users SET pin = '12345' WHERE role = 'admin';
UPDATE users SET pin = '54321' WHERE role = 'employee';

-- Step 4: Add constraints to username and pin
-- =====================================================
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
ALTER TABLE users ALTER COLUMN pin SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_pin_check CHECK (pin ~ '^\d{5}$');

-- Step 5: Create audit_log table for super admin access tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_username ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_log_is_super_admin ON audit_log(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Step 6: Enable RLS on audit_log table
-- =====================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations on audit_log (since it's server-side only)
CREATE POLICY "Allow all operations for audit_log" ON audit_log FOR ALL USING (true);

-- Step 7: Verify the migration
-- =====================================================
-- After running this migration, verify:
-- 1. Users table has username column (UNIQUE, NOT NULL)
-- 2. Users table has pin column (5 digits, plain text)
-- 3. Existing users have temporary usernames and PINs
-- 4. audit_log table exists with proper structure

-- Query to verify users table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users';

-- Query to verify existing users:
-- SELECT id, role, username, pin FROM users;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Update usernames and PINs for admin and employee
-- 2. Set environment variables (NEXT_PUBLIC_WORKSPACE_CODE, SUPER_ADMIN_PIN)
-- 3. Deploy updated application code
-- 4. Test login with workspace code + username + PIN
-- =====================================================
