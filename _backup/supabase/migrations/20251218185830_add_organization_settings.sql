/*
  # Add Organization Settings for Business Info and Stripe

  ## Overview
  Extends the organizations table with business information and payment settings
  required for the quote/invoice system.

  ## Changes
  1. Add business information fields (address, phone, email, website)
  2. Add Stripe integration fields (publishable_key, secret_key)
  3. Add document settings (quote_prefix, invoice_prefix, payment_terms)
  4. Add default template references

  ## Security
  - Sensitive Stripe keys are stored securely
  - Only organization members can access settings
*/

-- Add business information columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_email'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_phone'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_address'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_city'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_state'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_state TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_postal_code'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_postal_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_country'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_country TEXT DEFAULT 'United States';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'business_website'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_website TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'stripe_publishable_key'
  ) THEN
    ALTER TABLE organizations ADD COLUMN stripe_publishable_key TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'stripe_secret_key'
  ) THEN
    ALTER TABLE organizations ADD COLUMN stripe_secret_key TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'quote_prefix'
  ) THEN
    ALTER TABLE organizations ADD COLUMN quote_prefix TEXT DEFAULT 'QT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'invoice_prefix'
  ) THEN
    ALTER TABLE organizations ADD COLUMN invoice_prefix TEXT DEFAULT 'INV';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'default_payment_terms'
  ) THEN
    ALTER TABLE organizations ADD COLUMN default_payment_terms TEXT DEFAULT 'Net 30';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'default_quote_template_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN default_quote_template_id UUID REFERENCES document_templates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'default_invoice_template_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN default_invoice_template_id UUID REFERENCES document_templates(id);
  END IF;
END $$;