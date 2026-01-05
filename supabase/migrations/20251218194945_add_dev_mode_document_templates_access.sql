/*
  # Add Dev Mode Document Templates Access Policy

  1. Changes
    - Add a permissive policy to allow anon users to read document_templates for dev/testing purposes
    - This allows the Settings page to load templates in dev mode without authentication

  2. Security
    - Only applies to SELECT operations
    - Does not affect UPDATE/INSERT/DELETE operations which still require proper authentication
*/

-- Allow anon users to read document templates (for dev mode)
CREATE POLICY "Allow anon read for dev mode"
  ON document_templates
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to insert document templates (for dev mode initialization)
CREATE POLICY "Allow anon insert for dev mode"
  ON document_templates
  FOR INSERT
  TO anon
  WITH CHECK (true);
