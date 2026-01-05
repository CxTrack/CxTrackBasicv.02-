/*
  # Add Sharing System for Quotes and Invoices

  1. New Tables
    - `shareable_links`
      - Stores shareable link tokens for quotes and invoices
      - Supports expiration dates and password protection
      - Tracks view counts and analytics
    - `share_analytics`
      - Tracks individual views of shared links
      - Records viewer metadata (IP, user agent, timestamp)
    - `email_settings`
      - Stores email service provider configuration
      - Organization-level settings for email delivery
    - `sms_settings`
      - Stores Twilio SMS configuration
      - Organization-level credentials and settings
    - `sms_log`
      - Tracks all SMS sends for quotes and invoices
      - Records status and delivery information

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their organization's data
    - Add public access policy for shareable_links validation (token-based)
    - Add public insert policy for share_analytics tracking

  3. Important Notes
    - Shareable links use cryptographically secure tokens
    - Passwords are hashed using pgcrypto extension
    - Indexes added for performance on token lookups
    - Automatic timestamp tracking with updated_at triggers
*/

-- Create shareable_links table
CREATE TABLE IF NOT EXISTS shareable_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('quote', 'invoice')),
  document_id uuid NOT NULL,
  share_token text UNIQUE NOT NULL,
  access_type text NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'password-protected')),
  expires_at timestamptz,
  password_hash text,
  view_count integer DEFAULT 0 NOT NULL,
  last_viewed_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_shareable_links_token ON shareable_links(share_token);
CREATE INDEX IF NOT EXISTS idx_shareable_links_document ON shareable_links(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_shareable_links_org ON shareable_links(organization_id);

-- Create share_analytics table
CREATE TABLE IF NOT EXISTS share_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES shareable_links(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  viewer_ip text,
  user_agent text,
  referrer text
);

CREATE INDEX IF NOT EXISTS idx_share_analytics_link ON share_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_viewed ON share_analytics(viewed_at DESC);

-- Create email_settings table
CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  provider text CHECK (provider IN ('sendgrid', 'resend', 'aws-ses', 'mailgun', 'smtp')),
  api_key text,
  sender_email text,
  sender_name text,
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password text,
  is_configured boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_settings_org ON email_settings(organization_id);

-- Create sms_settings table
CREATE TABLE IF NOT EXISTS sms_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  is_configured boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sms_settings_org ON sms_settings(organization_id);

-- Create sms_log table
CREATE TABLE IF NOT EXISTS sms_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('quote', 'invoice')),
  document_id uuid NOT NULL,
  recipient_phone text NOT NULL,
  message_body text NOT NULL,
  message_sid text,
  status text DEFAULT 'pending' NOT NULL,
  error_message text,
  sent_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sms_log_org ON sms_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_document ON sms_log(document_type, document_id);

-- Enable RLS on all tables
ALTER TABLE shareable_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

-- Shareable Links Policies
CREATE POLICY "Users can view their organization's shareable links"
  ON shareable_links FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shareable links for their organization"
  ON shareable_links FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's shareable links"
  ON shareable_links FOR UPDATE
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

CREATE POLICY "Users can delete their organization's shareable links"
  ON shareable_links FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can validate active shareable links by token"
  ON shareable_links FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Share Analytics Policies
CREATE POLICY "Users can view their organization's share analytics"
  ON share_analytics FOR SELECT
  TO authenticated
  USING (
    link_id IN (
      SELECT id FROM shareable_links
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can insert share analytics"
  ON share_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Email Settings Policies
CREATE POLICY "Users can view their organization's email settings"
  ON email_settings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their organization's email settings"
  ON email_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's email settings"
  ON email_settings FOR UPDATE
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

-- SMS Settings Policies
CREATE POLICY "Users can view their organization's SMS settings"
  ON sms_settings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their organization's SMS settings"
  ON sms_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's SMS settings"
  ON sms_settings FOR UPDATE
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

-- SMS Log Policies
CREATE POLICY "Users can view their organization's SMS log"
  ON sms_log FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SMS log entries for their organization"
  ON sms_log FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_shareable_links_updated_at ON shareable_links;
CREATE TRIGGER update_shareable_links_updated_at
  BEFORE UPDATE ON shareable_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_settings_updated_at ON sms_settings;
CREATE TRIGGER update_sms_settings_updated_at
  BEFORE UPDATE ON sms_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();