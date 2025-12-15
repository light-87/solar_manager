# Multi-Tenancy Migration Guide

## Overview

This guide explains how to migrate your Solar Manager application from a single-tenant deployment model (one Vercel deployment per client) to a true multi-tenant architecture (one deployment serving all clients).

## 🎯 Why This Migration?

### Before (Single-Tenant):
- ❌ Required separate Vercel deployment for each client
- ❌ Workspace code hardcoded in environment variable `NEXT_PUBLIC_WORKSPACE_CODE`
- ❌ No database-level tenant isolation
- ❌ Potential cross-tenant security issues
- ❌ Adding new clients required redeployment

### After (Multi-Tenant):
- ✅ **One deployment serves all clients**
- ✅ **Database-driven workspace validation**
- ✅ **True tenant isolation** (users scoped to workspace_id)
- ✅ **Instant client onboarding** (just add a row to the database)
- ✅ **Dynamic branding** (workspace name from database)
- ✅ **Cost efficient** (fewer deployments to manage)

---

## 📋 Migration Steps

### Step 1: Run the SQL Migration

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `MIGRATION_MULTI_TENANT.sql`
4. **IMPORTANT**: Before running, update these values in the SQL:
   - Line 47: Replace `'SOLAR-FL'` with your actual `NEXT_PUBLIC_WORKSPACE_CODE`
   - Line 48: Replace `'Florida Solar Pros'` with your actual company name
   - Lines 60, 75, 88, 101, 114: Update workspace codes to match your value

5. Run the migration
6. Verify success with these queries:

```sql
-- Check workspaces table
SELECT * FROM workspaces;

-- Verify users are linked to workspace
SELECT u.username, u.workspace_id, w.name as workspace_name
FROM users u
JOIN workspaces w ON u.workspace_id = w.code;
```

### Step 2: Deploy the Updated Code

The following files have been updated:

#### Core Changes:
- ✅ `lib/env.ts` - Removed `getWorkspaceCode()` and `validateWorkspaceCode()`
- ✅ `app/api/auth/login/route.ts` - Database-driven workspace validation
- ✅ `app/api/auth/setup/route.ts` - Multi-tenant setup support
- ✅ `lib/auth-context.tsx` - Added workspace info to auth context
- ✅ `app/login/page.tsx` - Pass workspace info to context
- ✅ `app/dashboard/settings/page.tsx` - Display workspace info from context

#### New Files:
- ✅ `MIGRATION_MULTI_TENANT.sql` - Database migration script

### Step 3: Test the Migration

1. **Test existing workspace login:**
   ```
   Workspace Code: SOLAR-FL (or your current code)
   Username: admin
   PIN: [your admin PIN]
   ```

2. **Verify workspace info displays:**
   - Go to Dashboard → Settings
   - Check that "Workspace Name" shows the correct company name
   - Check that "Workspace Code" matches

3. **Test workspace isolation:**
   - Try to create a second workspace in the database
   - Verify users from one workspace can't log into another

### Step 4: Remove Environment Variable (Optional)

After confirming everything works:

1. Remove `NEXT_PUBLIC_WORKSPACE_CODE` from your `.env.local`
2. Remove it from Vercel environment variables
3. Redeploy to verify the app works without it

**Note:** `SUPER_ADMIN_PIN` is still required in environment variables.

---

## 🔐 Security Model

### Authentication Flow:

```
User Login Request
     ↓
[1. Validate workspace code format]
     ↓
[2. Query workspaces table]
     ↓
  ✓ Workspace exists?
  ✓ Workspace is active?
     ↓
[3. Query users table]
     ↓
  ✓ Username AND workspace_id match?
     ↓
[4. Verify PIN]
     ↓
[5. Return workspace name for branding]
```

### Key Security Features:

1. **Workspace Isolation**: Users are queried with both `username` AND `workspace_id`
   - Prevents user "admin" from Workspace A logging into Workspace B

2. **Foreign Key Constraints**: Users must belong to a valid workspace
   - Database enforces referential integrity

3. **Active Status Check**: Workspaces can be disabled instantly
   - Set `is_active = false` to prevent all logins for that client

4. **Composite Unique Constraint**: Username unique per workspace
   - Allows "admin" in multiple workspaces without conflicts

---

## 🚀 Adding New Clients

After migration, adding a new client is trivial:

```sql
-- 1. Add the workspace
INSERT INTO workspaces (code, name, is_active, settings)
VALUES (
  'SOLAR-CA',
  'California Solar Solutions',
  true,
  '{"primary_color": "#3b82f6", "logo_url": null}'::jsonb
);

-- 2. Create users for that workspace
INSERT INTO users (role, username, pin, workspace_id)
VALUES
  ('admin', 'admin', '11111', 'SOLAR-CA'),
  ('employee', 'employee', '22222', 'SOLAR-CA');
```

**No redeployment needed!** Users can log in immediately.

---

## 📊 Database Schema

### New Table: `workspaces`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Workspace code (UNIQUE, e.g., "SOLAR-FL") |
| `name` | TEXT | Display name (e.g., "Florida Solar Pros") |
| `is_active` | BOOLEAN | Enable/disable workspace |
| `settings` | JSONB | Future branding config |
| `created_at` | TIMESTAMP | When workspace was created |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Updated Table: `users`

- Added foreign key: `workspace_id` → `workspaces(code)`
- New composite unique constraint: `(workspace_id, username)`

---

## 🎨 Dynamic Branding (Future)

The `workspaces.settings` JSONB field enables per-client customization:

```json
{
  "primary_color": "#10b981",
  "logo_url": "https://cdn.example.com/logo.png",
  "contact_email": "support@floridaSolar.com",
  "custom_domain": "portal.floridaSolar.com"
}
```

You can extend the frontend to read these settings and customize:
- Brand colors
- Logo display
- Contact information
- Custom domains (with Vercel Multi-Zones)

---

## 🔧 Troubleshooting

### Issue: "Invalid workspace code" error

**Cause**: Workspace doesn't exist in database

**Solution**:
```sql
SELECT * FROM workspaces WHERE code = 'YOUR-CODE';
```

If empty, insert the workspace using the SQL from Step 1.

### Issue: "This workspace is currently inactive"

**Cause**: `is_active = false` in workspaces table

**Solution**:
```sql
UPDATE workspaces SET is_active = true WHERE code = 'YOUR-CODE';
```

### Issue: "Invalid username or workspace"

**Cause**: User's `workspace_id` doesn't match the workspace code they're trying to log into

**Solution**:
```sql
-- Check user's workspace_id
SELECT username, workspace_id FROM users WHERE username = 'admin';

-- Update if needed
UPDATE users SET workspace_id = 'CORRECT-CODE' WHERE username = 'admin';
```

### Issue: Users can't see workspace name in settings

**Cause**: Auth context not storing workspace info

**Solution**: Log out and log back in to refresh the session with workspace data.

---

## 📝 API Response Changes

### Login API (`/api/auth/login`) - New Response Format:

```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "role": "admin",
    "username": "admin",
    "workspace_id": "SOLAR-FL"
  },
  "workspace": {
    "code": "SOLAR-FL",
    "name": "Florida Solar Pros",
    "settings": {
      "primary_color": "#10b981",
      "logo_url": null
    }
  },
  "isSuperAdmin": false
}
```

**Note**: The `workspace` object is now included in all login responses.

---

## ✅ Verification Checklist

After migration, verify:

- [ ] SQL migration completed without errors
- [ ] Existing users can log in with their workspace code
- [ ] Workspace name displays in Settings page
- [ ] New workspaces can be added via SQL
- [ ] Users from different workspaces are isolated
- [ ] Disabled workspaces (`is_active = false`) cannot log in
- [ ] Setup flow works for new workspaces
- [ ] Super admin access still works
- [ ] Audit logs include `workspace_id`

---

## 🎓 Best Practices

1. **Workspace Codes**: Use uppercase with hyphens (e.g., `SOLAR-FL`, `SOLAR-CA`)
2. **Naming Convention**: Keep codes short but descriptive
3. **Active Management**: Regularly review `is_active` status
4. **Settings Schema**: Document your JSONB settings structure
5. **Backup**: Always backup before migrations
6. **Testing**: Test with a dev workspace first

---

## 🚨 Breaking Changes

### For Developers:

- `getWorkspaceCode()` from `lib/env.ts` has been **removed**
- Use `workspaceCode` from `useAuth()` context instead
- `validateWorkspaceCode()` has been **removed**
- Use `validateWorkspaceCodeFormat()` for format validation only

### For Deployments:

- `NEXT_PUBLIC_WORKSPACE_CODE` is **no longer required**
- Workspace codes are now managed in the database
- You can remove this from environment variables after migration

---

## 📞 Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Verify all SQL migration steps completed
3. Check Supabase logs for database errors
4. Review browser console for frontend errors

---

## 🎉 Success!

You now have a true multi-tenant Solar Manager application that can:
- Serve unlimited clients from one deployment
- Onboard new clients in seconds (no redeploy)
- Enforce true data isolation at the database level
- Scale efficiently as your business grows

**Happy selling! ☀️**
