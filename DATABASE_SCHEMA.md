# Database Schema for Solar Sales Management System

This document describes the Supabase database schema. Run these SQL commands in your Supabase SQL Editor.

## 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin and employee users
-- Admin PIN: 12345, Employee PIN: 54321
-- Note: These are bcrypt hashes of the default PINs
INSERT INTO users (role, pin_hash) VALUES
('admin', '$2a$10$YourHashedAdminPinHere'),
('employee', '$2a$10$YourHashedEmployeePinHere');
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

## 4. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_data ENABLE ROW LEVEL SECURITY;

-- For this application, we'll allow all authenticated operations
-- In production, you might want more granular policies
CREATE POLICY "Allow all operations for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations for step_data" ON step_data FOR ALL USING (true);
```

## 5. Create Updated_at Trigger Function

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

After creating the tables, you'll need to hash the default PINs. You can do this by:

1. Running the application for the first time
2. Using the `/api/auth/init` endpoint (will be created in the app)
3. Or manually hashing the PINs using bcrypt and updating the INSERT statement above

The application will include an initialization endpoint that creates the default admin and employee users with the PINs:
- Admin PIN: 12345
- Employee PIN: 54321

**IMPORTANT:** Change these PINs immediately after first login!
