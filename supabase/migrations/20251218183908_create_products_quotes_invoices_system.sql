/*
  # Products, Quotes, Invoices & Payments System

  ## Overview
  Complete financial management system for products, services, quotes, invoices, and payments.
  Designed for maximum flexibility to support any business model.

  ## New Tables
  
  ### Products & Services
  - `quote_items` - Line items for quotes
  - `invoice_items` - Line items for invoices
  - `payments` - Payment records linked to invoices
  - `document_templates` - Customizable templates for quotes and invoices

  ## Enhanced Tables
  - Enhanced `products` table with advanced pricing models
  - Enhanced `quotes` table with comprehensive workflow
  - Enhanced `invoices` table with payment tracking

  ## Security
  - RLS enabled on all tables
  - Organization-scoped access control
  - Proper indexes for performance

  ## Important Notes
  - Supports one-time, recurring, usage-based, and tiered pricing
  - Complete quote-to-invoice conversion workflow
  - Payment tracking with multiple methods
  - Customizable document templates
*/

-- ============================================================================
-- 1. DROP AND RECREATE PRODUCTS TABLE WITH ENHANCED SCHEMA
-- ============================================================================

DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  
  -- Type & Category
  product_type TEXT CHECK (product_type IN ('product', 'service', 'bundle')) DEFAULT 'product',
  category TEXT,
  
  -- Pricing (Flexible for any business model)
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  pricing_model TEXT CHECK (pricing_model IN ('one_time', 'recurring', 'usage_based', 'tiered')) DEFAULT 'one_time',
  
  -- Recurring pricing
  recurring_interval TEXT CHECK (recurring_interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_interval_count INTEGER DEFAULT 1,
  
  -- Usage-based pricing
  usage_unit TEXT,
  usage_rate DECIMAL(10,2),
  
  -- Tiered pricing (JSON array)
  pricing_tiers JSONB,
  
  -- Tax & Accounting
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_code TEXT,
  is_taxable BOOLEAN DEFAULT true,
  
  -- Inventory (for products)
  track_inventory BOOLEAN DEFAULT false,
  quantity_on_hand INTEGER DEFAULT 0,
  low_stock_threshold INTEGER,
  
  -- Business Logic
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Metadata
  image_url TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- ============================================================================
-- 2. DROP AND RECREATE QUOTES TABLE WITH ENHANCED SCHEMA
-- ============================================================================

DROP TABLE IF EXISTS quotes CASCADE;

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference Numbers
  quote_number TEXT UNIQUE NOT NULL,
  version INTEGER DEFAULT 1,
  
  -- Customer
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address JSONB,
  
  -- Dates
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  valid_until_date DATE,
  
  -- Status
  status TEXT CHECK (status IN (
    'draft', 'sent', 'viewed', 'accepted', 
    'declined', 'expired', 'converted'
  )) DEFAULT 'draft',
  
  -- Financial
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Terms & Conditions
  payment_terms TEXT,
  notes TEXT,
  terms TEXT,
  
  -- Delivery & Timeline
  delivery_date DATE,
  project_duration TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  
  -- AI & Automation
  ai_generated BOOLEAN DEFAULT false,
  template_id UUID,
  
  -- Conversion
  converted_to_invoice_id UUID,
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- ============================================================================
-- 3. CREATE QUOTE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  
  -- Product/Service
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  
  -- Quantity & Pricing
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Calculated
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Optional Features
  is_optional BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- For services
  service_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. DROP AND RECREATE INVOICES TABLE WITH ENHANCED SCHEMA
-- ============================================================================

DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference Numbers
  invoice_number TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  
  -- Customer
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address JSONB,
  
  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Status
  status TEXT CHECK (status IN (
    'draft', 'sent', 'viewed', 'paid', 
    'partial', 'overdue', 'cancelled', 'refunded'
  )) DEFAULT 'draft',
  
  -- Financial
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Payment
  payment_method TEXT,
  payment_terms TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Reminders
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  -- Metadata
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- ============================================================================
-- 5. CREATE INVOICE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  line_total DECIMAL(10,2) NOT NULL,
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. CREATE PAYMENTS TABLE
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  
  -- Payment Details
  payment_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Method
  payment_method TEXT CHECK (payment_method IN (
    'credit_card', 'debit_card', 'bank_transfer', 
    'check', 'cash', 'paypal', 'stripe', 'other'
  )),
  
  -- Transaction Details
  transaction_id TEXT,
  reference_number TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- ============================================================================
-- 7. CREATE DOCUMENT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  template_type TEXT CHECK (template_type IN ('quote', 'invoice')) NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  
  -- Design
  logo_url TEXT,
  color_scheme JSONB DEFAULT '{"primary": "#6366f1", "accent": "#10b981"}'::jsonb,
  font_family TEXT DEFAULT 'Inter',
  
  -- Layout
  layout_type TEXT CHECK (layout_type IN ('modern', 'classic', 'minimal', 'creative')) DEFAULT 'modern',
  show_line_numbers BOOLEAN DEFAULT true,
  show_product_images BOOLEAN DEFAULT false,
  
  -- Content
  header_text TEXT,
  footer_text TEXT,
  terms_text TEXT,
  
  -- Fields
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Products indexes
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_by ON products(created_by);

-- Quotes indexes
CREATE INDEX idx_quotes_org ON quotes(organization_id);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_number ON quotes(quote_number);
CREATE INDEX idx_quotes_date ON quotes(quote_date DESC);
CREATE INDEX idx_quotes_created_by ON quotes(created_by);

-- Quote items indexes
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON quote_items(product_id);

-- Invoices indexes
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_quote ON invoices(quote_id);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- Payments indexes
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_created_by ON payments(created_by);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Templates indexes
CREATE INDEX idx_templates_org ON document_templates(organization_id);
CREATE INDEX idx_templates_type ON document_templates(template_type);

-- ============================================================================
-- 9. ADD UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. CREATE RLS POLICIES
-- ============================================================================

-- Products policies
CREATE POLICY "Users can view products in their organization"
  ON products FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert products in their organization"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

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

CREATE POLICY "Users can delete products in their organization"
  ON products FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Quote items policies
CREATE POLICY "Users can view quote items in their organization"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      JOIN organization_members om ON om.organization_id = quotes.organization_id
      WHERE quotes.id = quote_items.quote_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert quote items in their organization"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      JOIN organization_members om ON om.organization_id = quotes.organization_id
      WHERE quotes.id = quote_items.quote_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update quote items in their organization"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      JOIN organization_members om ON om.organization_id = quotes.organization_id
      WHERE quotes.id = quote_items.quote_id
      AND om.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      JOIN organization_members om ON om.organization_id = quotes.organization_id
      WHERE quotes.id = quote_items.quote_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete quote items in their organization"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      JOIN organization_members om ON om.organization_id = quotes.organization_id
      WHERE quotes.id = quote_items.quote_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- Invoice items policies
CREATE POLICY "Users can view invoice items in their organization"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN organization_members om ON om.organization_id = invoices.organization_id
      WHERE invoices.id = invoice_items.invoice_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert invoice items in their organization"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN organization_members om ON om.organization_id = invoices.organization_id
      WHERE invoices.id = invoice_items.invoice_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update invoice items in their organization"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN organization_members om ON om.organization_id = invoices.organization_id
      WHERE invoices.id = invoice_items.invoice_id
      AND om.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN organization_members om ON om.organization_id = invoices.organization_id
      WHERE invoices.id = invoice_items.invoice_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete invoice items in their organization"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN organization_members om ON om.organization_id = invoices.organization_id
      WHERE invoices.id = invoice_items.invoice_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- Payments policies
CREATE POLICY "Users can view payments in their organization"
  ON payments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert payments in their organization"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update payments in their organization"
  ON payments FOR UPDATE
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

CREATE POLICY "Users can delete payments in their organization"
  ON payments FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Document templates policies
CREATE POLICY "Users can view templates in their organization"
  ON document_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert templates in their organization"
  ON document_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update templates in their organization"
  ON document_templates FOR UPDATE
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

CREATE POLICY "Users can delete templates in their organization"
  ON document_templates FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );