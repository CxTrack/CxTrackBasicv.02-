/*
  # Add Structured Customer Names
  
  1. Changes
    - Add first_name, middle_name, last_name fields to customers table
    - Keep existing name field for backwards compatibility and business names
    - Add customer_category field to distinguish between Personal and Business
    - Update existing 'Individual' types to use new structure
  
  2. Migration Strategy
    - Add new columns without removing existing data
    - Set defaults for new fields
    - For Personal customers, name can be computed from first_name + middle_name + last_name
    - For Business customers, name field contains business name
*/

-- Add new structured name fields
DO $$
BEGIN
  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN first_name TEXT;
  END IF;

  -- Add middle_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'middle_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN middle_name TEXT;
  END IF;

  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN last_name TEXT;
  END IF;

  -- Add customer_category column to distinguish Personal vs Business
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'customer_category'
  ) THEN
    ALTER TABLE customers ADD COLUMN customer_category TEXT 
      CHECK (customer_category IN ('Personal', 'Business')) 
      DEFAULT 'Personal';
  END IF;
END $$;

-- Update existing Individual customers to Personal category
UPDATE customers 
SET customer_category = 'Personal' 
WHERE type = 'Individual' AND customer_category IS NULL;

-- Update existing Business customers to Business category
UPDATE customers 
SET customer_category = 'Business' 
WHERE type IN ('Business', 'Government', 'Non-Profit') AND customer_category IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(customer_category);
CREATE INDEX IF NOT EXISTS idx_customers_names ON customers(first_name, last_name);