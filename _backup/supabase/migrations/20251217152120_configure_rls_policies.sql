/*
  # Row Level Security (RLS) Policies
  
  ## Overview
  Comprehensive RLS implementation for multi-tenant security
  
  ## Security Model
  - All tables use organization-scoped access
  - Users can only access data from organizations they belong to
  - Role-based permissions (owner, admin, manager, user)
  - Separate policies for SELECT, INSERT, UPDATE, DELETE
  
  ## Tables Covered
  - organizations
  - user_profiles
  - organization_members
  - customers
  - calendar_events
  - calls
  - quotes
  - products
  - invoices
  - pipeline_items
  - tasks
  - activity_logs
*/

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organizations"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT user_id FROM organization_members
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- ORGANIZATION MEMBERS POLICIES
-- ============================================================================
CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert members if they are owner or admin"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================
CREATE POLICY "Users can view customers in their organization"
  ON customers FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers in their organization"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers in their organization"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete customers in their organization"
  ON customers FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CALENDAR EVENTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view calendar events in their organization"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert calendar events in their organization"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- ============================================================================
-- CALLS POLICIES
-- ============================================================================
CREATE POLICY "Users can view calls in their organization"
  ON calls FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert calls in their organization"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update calls in their organization"
  ON calls FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete calls in their organization"
  ON calls FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- QUOTES POLICIES
-- ============================================================================
CREATE POLICY "Users can view quotes in their organization"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quotes in their organization"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quotes in their organization"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quotes in their organization"
  ON quotes FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view products in their organization"
  ON products FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products in their organization"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in their organization"
  ON products FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products in their organization"
  ON products FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- INVOICES POLICIES
-- ============================================================================
CREATE POLICY "Users can view invoices in their organization"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoices in their organization"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices in their organization"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices in their organization"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PIPELINE ITEMS POLICIES
-- ============================================================================
CREATE POLICY "Users can view pipeline items in their organization"
  ON pipeline_items FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pipeline items in their organization"
  ON pipeline_items FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pipeline items in their organization"
  ON pipeline_items FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pipeline items in their organization"
  ON pipeline_items FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================
CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their organization"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their organization"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their organization"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- ACTIVITY LOGS POLICIES
-- ============================================================================
CREATE POLICY "Users can view activity logs in their organization"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity logs in their organization"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );