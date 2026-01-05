/*
  # Enhanced Customer Management System

  1. Schema Enhancements
    - Add customer type distinction (personal vs business)
    - Add business-specific fields
    - Add personal-specific fields
    - Add social media links
    - Add contact preferences

  2. New Tables
    - `customer_contacts` - Multiple contacts per business customer
      * id, customer_id, name, title, email, phone, is_primary
    - `customer_notes` - Notes and interactions
      * id, customer_id, user_id, note_type, content, is_pinned
    - `customer_files` - File attachments
      * id, customer_id, uploaded_by, file_name, file_url, file_type, file_size

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated organization members
*/

-- Add new columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT CHECK (customer_type IN ('personal', 'business')) DEFAULT 'personal';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_stage TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_structure TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS hours_per_week INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'any')) DEFAULT 'any';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- Create customer_contacts table for business customers
CREATE TABLE IF NOT EXISTS customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customer_notes table
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id),
  note_type TEXT CHECK (note_type IN ('general', 'call', 'meeting', 'email', 'follow_up', 'important')) DEFAULT 'general',
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customer_files table
CREATE TABLE IF NOT EXISTS customer_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES user_profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_customer ON customer_files(customer_id);

-- Enable RLS on new tables
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_contacts
CREATE POLICY "Organization members can view customer contacts"
  ON customer_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert customer contacts"
  ON customer_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update customer contacts"
  ON customer_contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete customer contacts"
  ON customer_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for customer_notes
CREATE POLICY "Organization members can view customer notes"
  ON customer_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert customer notes"
  ON customer_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update customer notes"
  ON customer_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete customer notes"
  ON customer_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for customer_files
CREATE POLICY "Organization members can view customer files"
  ON customer_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_files.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert customer files"
  ON customer_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_files.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete customer files"
  ON customer_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_files.organization_id
      AND user_id = auth.uid()
    )
  );