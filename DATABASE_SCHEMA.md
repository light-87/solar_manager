# Database Schema for Solar Sales Management System

This document describes the Supabase database schema. Run these SQL commands in your Supabase SQL Editor.

## 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  username TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL CHECK (pin ~ '^\d{5}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin and employee users
-- NOTE: These are temporary credentials - change immediately after first login
INSERT INTO users (role, username, pin) VALUES
('admin', 'admin', '12345'),
('employee', 'employee', '54321');
```

## 2. Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  type TEXT NOT NULL CHECK (type IN ('finance', 'cash')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 15),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_customers_current_step ON customers(current_step);
```

## 3. Step Data Table

```sql
CREATE TABLE step_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 15),
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, step_number)
);

-- Create index for faster queries
CREATE INDEX idx_step_data_customer_id ON step_data(customer_id);
CREATE INDEX idx_step_data_step_number ON step_data(step_number);
```

## 4. Audit Log Table

```sql
CREATE TABLE audit_log (
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

-- Create indexes for faster audit queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_username ON audit_log(username);
CREATE INDEX idx_audit_log_is_super_admin ON audit_log(is_super_admin);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

## 5. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- For this application, we'll allow all authenticated operations
-- In production, you might want more granular policies
CREATE POLICY "Allow all operations for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations for step_data" ON step_data FOR ALL USING (true);
CREATE POLICY "Allow all operations for audit_log" ON audit_log FOR ALL USING (true);
```

## 6. Create Updated_at Trigger Function

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to customers table
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to step_data table
CREATE TRIGGER update_step_data_updated_at BEFORE UPDATE ON step_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each SQL block above in order
4. Execute them one by one
5. Verify tables are created in the Table Editor

## Initial Admin Setup

After creating the tables, you have two options:

**Option 1: Use the provided default users**
The INSERT statement above creates:
- Admin: username=`admin`, PIN=`12345`
- Employee: username=`employee`, PIN=`54321`

**Option 2: Use the first-time setup flow**
If no users exist in the database, the application will show a first-time setup screen where you can:
1. Enter workspace code
2. Create admin account (username + PIN)
3. Create employee account (username + PIN)

**IMPORTANT:**
- Change default PINs immediately after first login!
- Set `NEXT_PUBLIC_WORKSPACE_CODE` environment variable before deployment
- Set `SUPER_ADMIN_PIN` environment variable for system owner access
- Store PINs as plain text (5 digits only: 00000-99999)
