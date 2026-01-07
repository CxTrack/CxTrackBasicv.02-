-- Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  title text,
  source text, -- website, referral, linkedin, cold_call
  status text DEFAULT 'new', -- new, contacted, nurturing, qualified, dead
  lead_score integer DEFAULT 0, -- 0-100
  potential_value numeric DEFAULT 0,
  probability numeric DEFAULT 0.1, -- 10% for new leads
  assigned_to uuid REFERENCES auth.users(id),
  last_contact_date timestamptz,
  next_follow_up timestamptz,
  notes text,
  converted_to_opportunity_id uuid, -- Link to opportunity if converted
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads in their organization"
    ON leads FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert leads in their organization"
    ON leads FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update leads in their organization"
    ON leads FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete leads in their organization"
    ON leads FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));


-- Create Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  lead_id uuid REFERENCES leads(id),
  customer_id uuid REFERENCES customers(id),
  name text NOT NULL,
  description text,
  stage text NOT NULL, -- discovery, demo_scheduled, proposal, negotiation, won, lost
  value numeric NOT NULL,
  probability numeric NOT NULL, -- 0.0 to 1.0
  weighted_value numeric GENERATED ALWAYS AS (value * probability) STORED,
  expected_close_date date,
  actual_close_date date,
  appointment_date timestamptz,
  assigned_to uuid REFERENCES auth.users(id),
  quote_id uuid REFERENCES quotes(id),
  invoice_id uuid REFERENCES invoices(id),
  lost_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on Opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view opportunities in their organization"
    ON opportunities FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert opportunities in their organization"
    ON opportunities FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update opportunities in their organization"
    ON opportunities FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete opportunities in their organization"
    ON opportunities FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));


-- Update existing Quotes table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'opportunity_id') THEN
    ALTER TABLE quotes ADD COLUMN opportunity_id uuid REFERENCES opportunities(id);
  END IF;
END $$;


-- Update existing Invoices table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'opportunity_id') THEN
    ALTER TABLE invoices ADD COLUMN opportunity_id uuid REFERENCES opportunities(id);
  END IF;
END $$;


-- Add opportunity_id to Tasks table if not exists (assuming tasks table exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'opportunity_id') THEN
    ALTER TABLE tasks ADD COLUMN opportunity_id uuid REFERENCES opportunities(id);
  END IF;
  
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'lead_id') THEN
    ALTER TABLE tasks ADD COLUMN lead_id uuid REFERENCES leads(id);
  END IF;
END $$;


-- Function to calculate weighted pipeline
CREATE OR REPLACE FUNCTION calculate_weighted_pipeline(p_organization_id uuid)
RETURNS jsonb AS $$
DECLARE
  leads_val numeric;
  opps_val numeric;
  quotes_val numeric;
  invoices_exclude_paid_val numeric; -- Sent, Viewed, Overdue
  invoices_paid_val numeric;         -- Actual Revenue
  total_val numeric;
BEGIN
  -- 1. LEADS Calculation
  SELECT COALESCE(SUM(potential_value * probability), 0)
  INTO leads_val
  FROM leads
  WHERE organization_id = p_organization_id
    AND status IN ('new', 'contacted', 'nurturing', 'qualified');

  -- 2. OPPORTUNITIES Calculation
  SELECT COALESCE(SUM(value * probability), 0)
  INTO opps_val
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage NOT IN ('won', 'lost');

  -- 3. QUOTES Calculation
  -- Consider quotes that are active (Draft, Sent, Viewed). 
  -- Note: Probabilities are typically managed in code or we can assume defaults here for the aggregation.
  -- Using the prompt's logic: draft=0.70, sent=0.75, viewed=0.80. 
  -- Since we don't have a probability column on quotes by default, we'll use a CASE statement.
  SELECT COALESCE(SUM(
    total_amount * CASE 
      WHEN status = 'Draft' THEN 0.70 
      WHEN status = 'Sent' THEN 0.75 
      WHEN status = 'Viewed' THEN 0.80 
      ELSE 0 
    END
  ), 0)
  INTO quotes_val
  FROM quotes
  WHERE organization_id = p_organization_id
    AND status IN ('Draft', 'Sent', 'Viewed'); -- Using capitalized status as per types, check actual data usage carefully.
    -- Note: Previous file inspection showed lowercase 'sent', 'viewed', 'draft' in some places. Let's be case-insensitive or handle both.
    -- Adjusting to be case insensitive for safety:
    
  -- RE-RUN QUOTES safely
    SELECT COALESCE(SUM(
    total_amount * CASE 
      WHEN lower(status) = 'draft' THEN 0.70 
      WHEN lower(status) = 'sent' THEN 0.75 
      WHEN lower(status) = 'viewed' THEN 0.80 
      ELSE 0 
    END
  ), 0)
  INTO quotes_val
  FROM quotes
  WHERE organization_id = p_organization_id
    AND lower(status) IN ('draft', 'sent', 'viewed');


  -- 4. INVOICES PENDING Calculation (90-95%)
  SELECT COALESCE(SUM(
    total_amount * CASE 
      WHEN lower(status) = 'sent' THEN 0.90 
      WHEN lower(status) = 'viewed' THEN 0.95 
      WHEN lower(status) = 'overdue' THEN 0.85 
      ELSE 0 
    END
  ), 0)
  INTO invoices_exclude_paid_val
  FROM invoices
  WHERE organization_id = p_organization_id
    AND lower(status) IN ('sent', 'viewed', 'overdue');

  -- 5. ACTUAL REVENUE (Paid Invoices)
  SELECT COALESCE(SUM(total_amount), 0)
  INTO invoices_paid_val
  FROM invoices
  WHERE organization_id = p_organization_id
    AND lower(status) = 'paid';

  total_val := leads_val + opps_val + quotes_val + invoices_exclude_paid_val;

  RETURN jsonb_build_object(
    'leads_value', leads_val,
    'opportunities_value', opps_val,
    'quotes_value', quotes_val,
    'invoices_pending', invoices_exclude_paid_val,
    'total_pipeline', total_val,
    'actual_revenue', invoices_paid_val
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
