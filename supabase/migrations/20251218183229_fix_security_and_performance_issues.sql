/*
  # Fix Security and Performance Issues

  ## 1. Foreign Key Indexes
  Add indexes for all foreign key columns to improve query performance and prevent suboptimal lookups.
  
  New indexes added:
  - activity_logs: user_id
  - calendar_events: created_by, customer_id
  - calls: user_id
  - customer_files: organization_id, uploaded_by
  - customer_notes: organization_id, user_id
  - customers: created_by
  - invoices: created_by, quote_id
  - organization_members: user_id
  - pipeline_items: assigned_to, created_by, customer_id
  - products: created_by
  - quotes: created_by
  - tasks: calendar_event_id, created_by, customer_id
  - user_profiles: default_org_id

  ## 2. RLS Policy Optimization
  Optimize all RLS policies by wrapping auth.uid() in SELECT subqueries to prevent re-evaluation
  for each row. This dramatically improves query performance at scale.

  ## 3. Remove Unused Indexes
  Drop indexes that are not being used to reduce database overhead.

  ## 4. Fix Multiple Permissive Policies
  Combine the two SELECT policies on user_profiles into a single policy to prevent confusion
  and ensure predictable behavior.

  ## 5. Fix Function Security
  Update the update_updated_at_column function to use an immutable search path for security.

  ## Important Notes
  - All changes are safe and backward compatible
  - Performance improvements are immediate
  - Security is enhanced through proper auth.uid() handling
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_customer_id ON calendar_events(customer_id);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);

-- Customer files indexes
CREATE INDEX IF NOT EXISTS idx_customer_files_organization_id ON customer_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_uploaded_by ON customer_files(uploaded_by);

-- Customer notes indexes
CREATE INDEX IF NOT EXISTS idx_customer_notes_organization_id ON customer_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_user_id ON customer_notes(user_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);

-- Organization members indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Pipeline items indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_items_assigned_to ON pipeline_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_created_by ON pipeline_items(created_by);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_customer_id ON pipeline_items(customer_id);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_event_id ON tasks(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_org_id ON user_profiles(default_org_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_customers_type;
DROP INDEX IF EXISTS idx_customers_status;
DROP INDEX IF EXISTS idx_customer_notes_customer;
DROP INDEX IF EXISTS idx_customer_contacts_customer;
DROP INDEX IF EXISTS idx_customer_files_customer;
DROP INDEX IF EXISTS idx_quotes_customer;
DROP INDEX IF EXISTS idx_customers_org;
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_customers_phone;
DROP INDEX IF EXISTS idx_invoices_org;
DROP INDEX IF EXISTS idx_calendar_events_user;
DROP INDEX IF EXISTS idx_calendar_events_org;
DROP INDEX IF EXISTS idx_calendar_events_cal_com;
DROP INDEX IF EXISTS idx_calls_org;
DROP INDEX IF EXISTS idx_calls_customer;
DROP INDEX IF EXISTS idx_calls_retell;
DROP INDEX IF EXISTS idx_quotes_org;
DROP INDEX IF EXISTS idx_invoices_customer;
DROP INDEX IF EXISTS idx_products_org;
DROP INDEX IF EXISTS idx_pipeline_org;
DROP INDEX IF EXISTS idx_tasks_user;
DROP INDEX IF EXISTS idx_tasks_org;
DROP INDEX IF EXISTS idx_activity_logs_org;
DROP INDEX IF EXISTS idx_activity_logs_entity;

-- ============================================================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES ON USER_PROFILES
-- ============================================================================

-- Drop the two existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organizations" ON user_profiles;

-- Create a single combined SELECT policy
CREATE POLICY "Users can view their own profile and profiles in their organizations"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()) OR
    id IN (
      SELECT user_id FROM organization_members
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES WITH SELECT SUBQUERIES
-- ============================================================================

-- Organizations policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;
CREATE POLICY "Organization owners can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- User profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Organization members policies
DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert members if they are owner or admin" ON organization_members;
CREATE POLICY "Users can insert members if they are owner or admin"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Owners and admins can delete members" ON organization_members;
CREATE POLICY "Owners and admins can delete members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- Customers policies
DROP POLICY IF EXISTS "Users can view customers in their organization" ON customers;
CREATE POLICY "Users can view customers in their organization"
  ON customers FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert customers in their organization" ON customers;
CREATE POLICY "Users can insert customers in their organization"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update customers in their organization" ON customers;
CREATE POLICY "Users can update customers in their organization"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete customers in their organization" ON customers;
CREATE POLICY "Users can delete customers in their organization"
  ON customers FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Calendar events policies
DROP POLICY IF EXISTS "Users can view calendar events in their organization" ON calendar_events;
CREATE POLICY "Users can view calendar events in their organization"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert calendar events in their organization" ON calendar_events;
CREATE POLICY "Users can insert calendar events in their organization"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
CREATE POLICY "Users can update their own calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;
CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Calls policies
DROP POLICY IF EXISTS "Users can view calls in their organization" ON calls;
CREATE POLICY "Users can view calls in their organization"
  ON calls FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert calls in their organization" ON calls;
CREATE POLICY "Users can insert calls in their organization"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update calls in their organization" ON calls;
CREATE POLICY "Users can update calls in their organization"
  ON calls FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete calls in their organization" ON calls;
CREATE POLICY "Users can delete calls in their organization"
  ON calls FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Quotes policies
DROP POLICY IF EXISTS "Users can view quotes in their organization" ON quotes;
CREATE POLICY "Users can view quotes in their organization"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert quotes in their organization" ON quotes;
CREATE POLICY "Users can insert quotes in their organization"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update quotes in their organization" ON quotes;
CREATE POLICY "Users can update quotes in their organization"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete quotes in their organization" ON quotes;
CREATE POLICY "Users can delete quotes in their organization"
  ON quotes FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Products policies
DROP POLICY IF EXISTS "Users can view products in their organization" ON products;
CREATE POLICY "Users can view products in their organization"
  ON products FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert products in their organization" ON products;
CREATE POLICY "Users can insert products in their organization"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update products in their organization" ON products;
CREATE POLICY "Users can update products in their organization"
  ON products FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete products in their organization" ON products;
CREATE POLICY "Users can delete products in their organization"
  ON products FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Invoices policies
DROP POLICY IF EXISTS "Users can view invoices in their organization" ON invoices;
CREATE POLICY "Users can view invoices in their organization"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert invoices in their organization" ON invoices;
CREATE POLICY "Users can insert invoices in their organization"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update invoices in their organization" ON invoices;
CREATE POLICY "Users can update invoices in their organization"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete invoices in their organization" ON invoices;
CREATE POLICY "Users can delete invoices in their organization"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Pipeline items policies
DROP POLICY IF EXISTS "Users can view pipeline items in their organization" ON pipeline_items;
CREATE POLICY "Users can view pipeline items in their organization"
  ON pipeline_items FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert pipeline items in their organization" ON pipeline_items;
CREATE POLICY "Users can insert pipeline items in their organization"
  ON pipeline_items FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update pipeline items in their organization" ON pipeline_items;
CREATE POLICY "Users can update pipeline items in their organization"
  ON pipeline_items FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete pipeline items in their organization" ON pipeline_items;
CREATE POLICY "Users can delete pipeline items in their organization"
  ON pipeline_items FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Tasks policies
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON tasks;
CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert tasks in their organization" ON tasks;
CREATE POLICY "Users can insert tasks in their organization"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update tasks in their organization" ON tasks;
CREATE POLICY "Users can update tasks in their organization"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON tasks;
CREATE POLICY "Users can delete tasks in their organization"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Activity logs policies
DROP POLICY IF EXISTS "Users can view activity logs in their organization" ON activity_logs;
CREATE POLICY "Users can view activity logs in their organization"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert activity logs in their organization" ON activity_logs;
CREATE POLICY "Users can insert activity logs in their organization"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Customer contacts policies
DROP POLICY IF EXISTS "Organization members can view customer contacts" ON customer_contacts;
CREATE POLICY "Organization members can view customer contacts"
  ON customer_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can insert customer contacts" ON customer_contacts;
CREATE POLICY "Organization members can insert customer contacts"
  ON customer_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can update customer contacts" ON customer_contacts;
CREATE POLICY "Organization members can update customer contacts"
  ON customer_contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can delete customer contacts" ON customer_contacts;
CREATE POLICY "Organization members can delete customer contacts"
  ON customer_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = customer_contacts.customer_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- Customer notes policies
DROP POLICY IF EXISTS "Organization members can view customer notes" ON customer_notes;
CREATE POLICY "Organization members can view customer notes"
  ON customer_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can insert customer notes" ON customer_notes;
CREATE POLICY "Organization members can insert customer notes"
  ON customer_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can update customer notes" ON customer_notes;
CREATE POLICY "Organization members can update customer notes"
  ON customer_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can delete customer notes" ON customer_notes;
CREATE POLICY "Organization members can delete customer notes"
  ON customer_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_notes.organization_id
      AND user_id = (SELECT auth.uid())
    )
  );

-- Customer files policies
DROP POLICY IF EXISTS "Organization members can view customer files" ON customer_files;
CREATE POLICY "Organization members can view customer files"
  ON customer_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_files.organization_id
      AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can insert customer files" ON customer_files;
CREATE POLICY "Organization members can insert customer files"
  ON customer_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_files.organization_id
      AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can delete customer files" ON customer_files;
CREATE POLICY "Organization members can delete customer files"
  ON customer_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = customer_files.organization_id
      AND user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 5. FIX FUNCTION SEARCH PATH SECURITY ISSUE
-- ============================================================================

-- Recreate the function with a secure search path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;