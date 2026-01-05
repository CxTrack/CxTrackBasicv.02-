/*
  # Add Dev Mode Organization Access Policy

  1. Changes
    - Add a permissive policy to allow anon users to read organizations for dev/testing purposes
    - This allows the Settings page to load in dev mode without authentication

  2. Security
    - Only applies to SELECT operations
    - Does not affect UPDATE/INSERT/DELETE operations which still require proper authentication
*/

-- Allow anon users to read organizations (for dev mode)
CREATE POLICY "Allow anon read for dev mode"
  ON organizations
  FOR SELECT
  TO anon
  USING (true);
