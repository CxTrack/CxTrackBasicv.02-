/*
  # CxTrack CRM - Complete Database Schema
  
  ## Overview
  Production-grade multi-tenant CRM system with modular architecture
  
  ## New Tables
  
  ### Core Multi-Tenant Structure
  - `organizations` - Multi-tenant root with module configuration
  - `user_profiles` - Extended user data with multi-org support
  - `organization_members` - Many-to-many org membership with roles
  
  ### CRM & Customer Management
  - `customers` - Customer records scoped to organization
  - `pipeline_items` - Sales opportunities and deal tracking
  
  ### Calendar & Scheduling
  - `calendar_events` - Events with Cal.com integration
  
  ### Communication
  - `calls` - Call logs with Retell AI integration
  
  ### Financial Documents
  - `quotes` - Quote generation with customer snapshots
  - `invoices` - Invoice management with payment tracking
  - `products` - Product catalog (conditional module)
  
  ### Task Management
  - `tasks` - Task tracking with assignments
  
  ### Audit & Compliance
  - `activity_logs` - Complete audit trail
  
  ## Security
  - RLS enabled on ALL tables
  - Role-based permissions (owner, admin, manager, user)
  - Calendar delegation support
  - Organization-scoped data isolation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#6366f1',
  timezone TEXT DEFAULT 'America/Winnipeg',
  business_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}'::jsonb,
  enabled_modules JSONB DEFAULT '["dashboard","crm","calendar"]'::jsonb,
  industry_template TEXT CHECK (industry_template IN ('accounting', 'distribution', 'consulting', 'service_provider', 'custom')),
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')) DEFAULT 'free',
  max_users INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  default_org_id UUID REFERENCES organizations(id),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'user')) DEFAULT 'user',
  permissions JSONB DEFAULT '{}'::jsonb,
  calendar_delegation JSONB DEFAULT '[]'::jsonb,
  can_view_team_calendars BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'CA',
  company TEXT,
  title TEXT,
  type TEXT CHECK (type IN ('Individual', 'Business', 'Government', 'Non-Profit')) DEFAULT 'Individual',
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  status TEXT CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
  notes TEXT,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_purchase TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CALENDAR EVENTS TABLE (Cal.com Integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cal_com_event_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('meeting', 'call', 'task', 'deadline', 'appointment')) DEFAULT 'appointment',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_url TEXT,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')) DEFAULT 'scheduled',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  color_code VARCHAR(7) DEFAULT '#6366f1',
  reminders JSONB DEFAULT '[{"minutes": 15, "method": "email"}]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CALLS TABLE (Retell AI Integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  retell_call_id TEXT UNIQUE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer')) DEFAULT 'initiated',
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  transcript TEXT,
  sentiment_score DECIMAL(3,2),
  call_summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- QUOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  message TEXT,
  status TEXT CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Declined', 'Expired')) DEFAULT 'Draft',
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  status TEXT CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, sku)
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status TEXT CHECK (status IN ('Draft', 'Issued', 'Paid', 'Part paid', 'Cancelled', 'Disputed', 'On hold')) DEFAULT 'Draft',
  payment_date TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PIPELINE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pipeline_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES user_profiles(id),
  stage TEXT CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'lead',
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(10,2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100) DEFAULT 50,
  expected_close_date DATE,
  final_status TEXT CHECK (final_status IN ('Sale', 'No Sale')),
  lost_reason TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITY LOGS TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(organization_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_cal_com ON calendar_events(cal_com_event_id);
CREATE INDEX IF NOT EXISTS idx_calls_org ON calls(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_customer ON calls(customer_id);
CREATE INDEX IF NOT EXISTS idx_calls_retell ON calls(retell_call_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_org ON pipeline_items(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_items_updated_at BEFORE UPDATE ON pipeline_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();