-- Migration: Add new customer fields and update step limit
-- Run this in your Supabase SQL Editor to update existing databases

-- 1. Add new fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS kw_capacity DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS quotation DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS site_location TEXT;

-- 2. Update current_step constraint to allow up to 20 steps (for flexibility)
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_current_step_check;

ALTER TABLE customers
ADD CONSTRAINT customers_current_step_check
CHECK (current_step >= 1 AND current_step <= 20);

-- 3. Update step_data constraint to allow up to 20 steps
ALTER TABLE step_data
DROP CONSTRAINT IF EXISTS step_data_step_number_check;

ALTER TABLE step_data
ADD CONSTRAINT step_data_step_number_check
CHECK (step_number >= 1 AND step_number <= 20);

-- 4. Add completed_at field to step_data table
ALTER TABLE step_data
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 5. Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_customers_kw_capacity ON customers(kw_capacity);

-- Migration complete!
-- Note: Existing customers will have NULL values for new fields
-- These can be updated through Step 1 in the application
