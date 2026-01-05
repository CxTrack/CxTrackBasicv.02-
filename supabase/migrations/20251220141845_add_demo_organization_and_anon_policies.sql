/*
  # Add Demo Organization and Anon Access Policies

  ## Overview
  This migration sets up a demo organization and RLS policies that allow unauthenticated (anon) users
  to perform CRUD operations on demo organization data. This enables auto-login functionality where
  the frontend can operate without actual Supabase authentication.

  ## Changes Made

  ### 1. Create Demo User Profile and Organization
  - Creates demo user profile with ID: 00000000-0000-0000-0000-000000000001
  - Creates organization with ID: 00000000-0000-0000-0000-000000000000
  - These are used for demo/development purposes and satisfy foreign key constraints

  ### 2. Add Anon RLS Policies
  Creates permissive policies for anon role on all core tables:
  - customers (SELECT, INSERT, UPDATE, DELETE)
  - products (SELECT, INSERT, UPDATE, DELETE)
  - quotes (SELECT, INSERT, UPDATE, DELETE)
  - quote_items (SELECT, INSERT, UPDATE, DELETE)
  - invoices (SELECT, INSERT, UPDATE, DELETE)
  - invoice_items (SELECT, INSERT, UPDATE, DELETE)
  - payments (SELECT, INSERT, UPDATE, DELETE)
  - tasks (SELECT, INSERT, UPDATE, DELETE)
  - calendar_events (SELECT, INSERT, UPDATE, DELETE)
  - customer_notes (SELECT, INSERT, UPDATE, DELETE)
  - customer_contacts (SELECT, INSERT, UPDATE, DELETE)
  - organization_members (SELECT)
  - shareable_links (SELECT, INSERT, UPDATE, DELETE)

  ### 3. Security Notes
  - Only applies to demo organization (00000000-0000-0000-0000-000000000000)
  - Anon users cannot access any other organization's data
  - Production organizations remain fully protected
  - These policies enable development/demo mode without compromising security
*/

-- ============================================================================
-- 1. CREATE DEMO USER PROFILE AND ORGANIZATION
-- ============================================================================

-- Insert demo user profile if it doesn't exist
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  default_org_id,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@cxtrack.com',
  'Demo Admin User',
  '00000000-0000-0000-0000-000000000000'::uuid,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert demo organization if it doesn't exist
INSERT INTO public.organizations (
  id,
  name,
  slug,
  business_email,
  business_phone,
  business_address,
  business_city,
  business_state,
  business_postal_code,
  business_country,
  business_website,
  timezone,
  subscription_tier,
  industry_template,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Demo Organization',
  'demo-org',
  'demo@cxtrack.com',
  '+1 (555) 000-0000',
  '123 Demo Street',
  'Demo City',
  'ON',
  'M5H 2N2',
  'CA',
  'https://demo.cxtrack.com',
  'America/Toronto',
  'enterprise',
  'custom',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ADD ANON RLS POLICIES FOR DEMO ORGANIZATION
-- ============================================================================

-- Customers: Allow anon full access to demo org customers
CREATE POLICY "Anon can manage demo org customers"
  ON public.customers
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Customer Notes: Allow anon full access to demo org customer notes
CREATE POLICY "Anon can manage demo org customer notes"
  ON public.customer_notes
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Customer Contacts: Allow anon full access to demo org customer contacts
CREATE POLICY "Anon can manage demo org customer contacts"
  ON public.customer_contacts
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = customer_contacts.customer_id
      AND customers.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- Customer Files: Allow anon full access to demo org customer files
CREATE POLICY "Anon can manage demo org customer files"
  ON public.customer_files
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Products: Allow anon full access to demo org products
CREATE POLICY "Anon can manage demo org products"
  ON public.products
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Quotes: Allow anon full access to demo org quotes
CREATE POLICY "Anon can manage demo org quotes"
  ON public.quotes
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Quote Items: Allow anon full access to demo org quote items
CREATE POLICY "Anon can manage demo org quote items"
  ON public.quote_items
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- Invoices: Allow anon full access to demo org invoices
CREATE POLICY "Anon can manage demo org invoices"
  ON public.invoices
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Invoice Items: Allow anon full access to demo org invoice items
CREATE POLICY "Anon can manage demo org invoice items"
  ON public.invoice_items
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- Payments: Allow anon full access to demo org payments
CREATE POLICY "Anon can manage demo org payments"
  ON public.payments
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Tasks: Allow anon full access to demo org tasks
CREATE POLICY "Anon can manage demo org tasks"
  ON public.tasks
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Calendar Events: Allow anon full access to demo org calendar events
CREATE POLICY "Anon can manage demo org calendar events"
  ON public.calendar_events
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Organization Members: Allow anon read access to demo org members
CREATE POLICY "Anon can view demo org members"
  ON public.organization_members
  FOR SELECT
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Shareable Links: Allow anon full access to demo org shareable links
CREATE POLICY "Anon can manage demo org shareable links"
  ON public.shareable_links
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Activity Logs: Allow anon to insert activity logs for demo org
CREATE POLICY "Anon can insert demo org activity logs"
  ON public.activity_logs
  FOR INSERT
  TO anon
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Calls: Allow anon full access to demo org calls
CREATE POLICY "Anon can manage demo org calls"
  ON public.calls
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Pipeline Items: Allow anon full access to demo org pipeline items
CREATE POLICY "Anon can manage demo org pipeline items"
  ON public.pipeline_items
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Document Templates: Allow anon full access to demo org document templates
CREATE POLICY "Anon can manage demo org document templates"
  ON public.document_templates
  FOR ALL
  TO anon
  USING (organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- User Profiles: Allow anon read access to demo user profile
CREATE POLICY "Anon can view demo user profile"
  ON public.user_profiles
  FOR SELECT
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000001'::uuid);
