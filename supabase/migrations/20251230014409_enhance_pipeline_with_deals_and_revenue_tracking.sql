/*
  # Enhance Pipeline System with Deals and Revenue Tracking

  1. Changes to Existing Tables
    - `pipeline_items` → Enhanced to become full deals/opportunities
      - Add amount, currency fields
      - Add weighted_value (auto-calculated)
      - Add products JSONB field
      - Add revenue tracking fields
      - Add close dates
      - Rename 'value' to keep compatibility
    
    - `quotes` → Add deal linking
      - Add deal_id foreign key
      - Add converted_to_deal boolean
      - Add converted_date timestamp
    
    - `invoices` → Add deal linking
      - Add deal_id foreign key
    
    - `payments` → Already exists with proper structure
  
  2. New Features
    - Pipeline value calculation function
    - Revenue calculation function
    - Deal stage tracking with probabilities
    - Weighted pipeline values
  
  3. Security
    - RLS already enabled on pipeline_items
    - Policies already exist for pipeline_items
    - Add demo mode policies if needed
*/

-- Enhance pipeline_items table to become deals
DO $$
BEGIN
  -- Add currency if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'currency'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  -- Add weighted_value (computed column)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'weighted_value'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN weighted_value numeric GENERATED ALWAYS AS (COALESCE(value, 0) * COALESCE(probability, 0) / 100.0) STORED;
  END IF;

  -- Add products array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'products'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN products jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add revenue_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'revenue_type'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN revenue_type text DEFAULT 'one_time' CHECK (revenue_type IN ('one_time', 'recurring'));
  END IF;

  -- Add recurring_interval
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'recurring_interval'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN recurring_interval text CHECK (recurring_interval IN ('monthly', 'quarterly', 'annual'));
  END IF;

  -- Add actual_close_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'actual_close_date'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN actual_close_date date;
  END IF;

  -- Add source field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'source'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN source text DEFAULT 'other' CHECK (source IN ('inbound', 'outbound', 'referral', 'website', 'event', 'quote', 'other'));
  END IF;

  -- Add quote_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_items' AND column_name = 'quote_id'
  ) THEN
    ALTER TABLE pipeline_items ADD COLUMN quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_pipeline_items_quote_id ON pipeline_items(quote_id);
  END IF;
END $$;

-- Add deal_id to quotes table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN deal_id uuid REFERENCES pipeline_items(id) ON DELETE SET NULL;
    ALTER TABLE quotes ADD COLUMN converted_to_deal boolean DEFAULT false;
    ALTER TABLE quotes ADD COLUMN converted_deal_date timestamptz;
    CREATE INDEX IF NOT EXISTS idx_quotes_deal_id ON quotes(deal_id);
  END IF;
END $$;

-- Add deal_id to invoices table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN deal_id uuid REFERENCES pipeline_items(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_invoices_deal_id ON invoices(deal_id);
  END IF;
END $$;

-- Add revenue_recognized fields to invoices if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'revenue_recognized'
  ) THEN
    ALTER TABLE invoices ADD COLUMN revenue_recognized boolean DEFAULT false;
    ALTER TABLE invoices ADD COLUMN revenue_recognition_date timestamptz;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_items_stage ON pipeline_items(stage) WHERE stage NOT IN ('closed_won', 'closed_lost');
CREATE INDEX IF NOT EXISTS idx_pipeline_items_value ON pipeline_items(value) WHERE stage NOT IN ('closed_won', 'closed_lost');
CREATE INDEX IF NOT EXISTS idx_pipeline_items_expected_close ON pipeline_items(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_date ON invoices(paid_at) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Create function to calculate pipeline value
CREATE OR REPLACE FUNCTION calculate_pipeline_value(p_organization_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_pipeline', COALESCE(SUM(value) FILTER (WHERE stage NOT IN ('closed_won', 'closed_lost')), 0),
    'weighted_pipeline', COALESCE(SUM(weighted_value) FILTER (WHERE stage NOT IN ('closed_won', 'closed_lost')), 0),
    'open_deals_count', COUNT(*) FILTER (WHERE stage NOT IN ('closed_won', 'closed_lost')),
    'won_deals_count', COUNT(*) FILTER (WHERE stage = 'closed_won'),
    'lost_deals_count', COUNT(*) FILTER (WHERE stage = 'closed_lost'),
    'total_won_value', COALESCE(SUM(value) FILTER (WHERE stage = 'closed_won'), 0),
    'by_stage', jsonb_build_object(
      'lead', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE stage = 'lead'),
        'value', COALESCE(SUM(value) FILTER (WHERE stage = 'lead'), 0),
        'weighted', COALESCE(SUM(weighted_value) FILTER (WHERE stage = 'lead'), 0)
      ),
      'qualified', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE stage = 'qualified'),
        'value', COALESCE(SUM(value) FILTER (WHERE stage = 'qualified'), 0),
        'weighted', COALESCE(SUM(weighted_value) FILTER (WHERE stage = 'qualified'), 0)
      ),
      'proposal', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE stage = 'proposal'),
        'value', COALESCE(SUM(value) FILTER (WHERE stage = 'proposal'), 0),
        'weighted', COALESCE(SUM(weighted_value) FILTER (WHERE stage = 'proposal'), 0)
      ),
      'negotiation', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE stage = 'negotiation'),
        'value', COALESCE(SUM(value) FILTER (WHERE stage = 'negotiation'), 0),
        'weighted', COALESCE(SUM(weighted_value) FILTER (WHERE stage = 'negotiation'), 0)
      )
    )
  ) INTO result
  FROM pipeline_items
  WHERE organization_id = p_organization_id;
  
  RETURN COALESCE(result, jsonb_build_object(
    'total_pipeline', 0,
    'weighted_pipeline', 0,
    'open_deals_count', 0,
    'won_deals_count', 0,
    'lost_deals_count', 0,
    'total_won_value', 0,
    'by_stage', jsonb_build_object(
      'lead', jsonb_build_object('count', 0, 'value', 0, 'weighted', 0),
      'qualified', jsonb_build_object('count', 0, 'value', 0, 'weighted', 0),
      'proposal', jsonb_build_object('count', 0, 'value', 0, 'weighted', 0),
      'negotiation', jsonb_build_object('count', 0, 'value', 0, 'weighted', 0)
    )
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate monthly revenue
CREATE OR REPLACE FUNCTION calculate_monthly_revenue(
  p_organization_id uuid,
  p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  p_month integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  start_of_month date;
  end_of_month date;
  start_of_last_month date;
  end_of_last_month date;
  current_revenue numeric;
  last_revenue numeric;
  ytd_revenue numeric;
BEGIN
  -- Calculate date ranges
  start_of_month := make_date(p_year, p_month, 1);
  end_of_month := (start_of_month + interval '1 month' - interval '1 day')::date;
  start_of_last_month := (start_of_month - interval '1 month')::date;
  end_of_last_month := (start_of_month - interval '1 day')::date;

  -- Current month revenue (paid invoices)
  SELECT COALESCE(SUM(total_amount), 0) INTO current_revenue
  FROM invoices
  WHERE organization_id = p_organization_id
    AND status = 'paid'
    AND paid_at >= start_of_month
    AND paid_at <= end_of_month;

  -- Last month revenue
  SELECT COALESCE(SUM(total_amount), 0) INTO last_revenue
  FROM invoices
  WHERE organization_id = p_organization_id
    AND status = 'paid'
    AND paid_at >= start_of_last_month
    AND paid_at <= end_of_last_month;

  -- Year to date revenue
  SELECT COALESCE(SUM(total_amount), 0) INTO ytd_revenue
  FROM invoices
  WHERE organization_id = p_organization_id
    AND status = 'paid'
    AND EXTRACT(YEAR FROM paid_at) = p_year;

  -- Build result
  SELECT jsonb_build_object(
    'current_month_revenue', current_revenue,
    'last_month_revenue', last_revenue,
    'month_over_month_change', current_revenue - last_revenue,
    'month_over_month_percent', 
      CASE 
        WHEN last_revenue = 0 THEN 0
        ELSE ROUND(((current_revenue - last_revenue) / last_revenue * 100)::numeric, 2)
      END,
    'ytd_revenue', ytd_revenue,
    'pending_invoices', (
      SELECT COALESCE(SUM(amount_due), 0)
      FROM invoices
      WHERE organization_id = p_organization_id
        AND status IN ('sent', 'viewed', 'partial', 'overdue')
    ),
    'overdue_invoices', (
      SELECT COALESCE(SUM(amount_due), 0)
      FROM invoices
      WHERE organization_id = p_organization_id
        AND status = 'overdue'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update invoice revenue recognition when paid
CREATE OR REPLACE FUNCTION update_invoice_revenue_recognition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    NEW.revenue_recognized := true;
    NEW.revenue_recognition_date := COALESCE(NEW.paid_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_revenue_recognition_trigger
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_revenue_recognition();

-- Update existing paid invoices to have revenue_recognized = true
UPDATE invoices 
SET revenue_recognized = true,
    revenue_recognition_date = COALESCE(paid_at, updated_at)
WHERE status = 'paid' 
  AND (revenue_recognized IS NULL OR revenue_recognized = false);
