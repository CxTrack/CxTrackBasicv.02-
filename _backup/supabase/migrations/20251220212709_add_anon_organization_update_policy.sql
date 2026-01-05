/*
  # Add Anon Organization Update Policy

  ## Overview
  This migration adds a missing RLS policy to allow anonymous users to update
  the demo organization settings. Without this policy, settings changes in demo
  mode fail silently.

  ## Changes Made

  ### 1. Organization Update Policy for Anon
  - Allows anon users to update ONLY the demo organization
  - Enables settings changes to persist in demo mode
  - Maintains security by restricting to demo org only

  ### 2. Organization Read Policy for Anon
  - Allows anon users to read the demo organization
  - Required for loading settings in demo mode
*/

-- Allow anon to read demo organization
CREATE POLICY "Anon can view demo organization"
  ON public.organizations
  FOR SELECT
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Allow anon to update demo organization
CREATE POLICY "Anon can update demo organization"
  ON public.organizations
  FOR UPDATE
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid);
