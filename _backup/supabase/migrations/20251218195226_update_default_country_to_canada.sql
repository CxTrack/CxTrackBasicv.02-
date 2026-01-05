/*
  # Update Default Country to Canada

  1. Changes
    - Change the default value for business_country from "United States" to "Canada"
    - This reflects the focus on Canadian businesses while still allowing other countries

  2. Notes
    - Existing organizations are not affected
    - Only new organizations will default to Canada
*/

-- Update the default value for business_country to Canada
ALTER TABLE organizations 
  ALTER COLUMN business_country SET DEFAULT 'Canada';
