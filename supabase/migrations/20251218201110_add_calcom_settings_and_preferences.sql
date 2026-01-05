/*
  # Add Cal.com Settings and Calendar Preferences

  1. New Tables
    - `calcom_settings` - Cal.com API configuration per organization
    - `calendar_preferences` - Per-user calendar preferences

  2. Enhancements to calendar_events
    - Add missing columns for full Cal.com integration
    - Add color and label support

  3. Security
    - Enable RLS on new tables
    - Add policies for organization/user access
*/

-- ============================================================================
-- ADD MISSING COLUMNS TO CALENDAR_EVENTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'all_day'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN all_day BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN timezone TEXT DEFAULT 'America/Winnipeg';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'attendee_name'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN attendee_name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'attendee_email'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN attendee_email TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'attendee_phone'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN attendee_phone TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'calcom_booking_uid'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN calcom_booking_uid TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'calcom_event_type_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN calcom_event_type_id INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'reminder_sent'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'reminder_minutes_before'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN reminder_minutes_before INTEGER DEFAULT 30;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'notes'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN notes TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'requires_follow_up'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN requires_follow_up BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'follow_up_date'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN follow_up_date DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'color'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN color TEXT DEFAULT '#6366f1';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'labels'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN labels TEXT[];
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN custom_fields JSONB;
  END IF;
END $$;

-- ============================================================================
-- CAL.COM SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calcom_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- API Credentials
  api_key TEXT NOT NULL,
  
  -- User Settings
  calcom_user_id INTEGER,
  calcom_username TEXT,
  
  -- Event Types
  default_event_type_id INTEGER,
  event_types JSONB,
  
  -- Sync Settings
  auto_sync BOOLEAN DEFAULT true,
  sync_interval INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  
  -- Webhooks
  webhook_secret TEXT,
  webhook_url TEXT,
  
  -- Preferences
  default_duration INTEGER DEFAULT 30,
  buffer_time INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CALENDAR PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- View Settings
  default_view TEXT CHECK (default_view IN ('month', 'week', 'day', 'agenda')) DEFAULT 'week',
  week_start_day INTEGER DEFAULT 0,
  time_format TEXT CHECK (time_format IN ('12h', '24h')) DEFAULT '12h',
  
  -- Display Settings
  show_weekends BOOLEAN DEFAULT true,
  show_agenda_panel BOOLEAN DEFAULT true,
  agenda_panel_position TEXT CHECK (agenda_panel_position IN ('left', 'right')) DEFAULT 'right',
  
  -- Working Hours
  working_hours JSONB DEFAULT '{"enabled": false, "start": "09:00", "end": "17:00"}'::jsonb,
  
  -- Notifications
  email_reminders BOOLEAN DEFAULT true,
  sms_reminders BOOLEAN DEFAULT false,
  
  -- Theme
  event_colors JSONB DEFAULT '{
    "appointment": "#6366f1",
    "meeting": "#10b981",
    "call": "#f59e0b",
    "task": "#8b5cf6",
    "reminder": "#ec4899"
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Cal.com Settings RLS
ALTER TABLE calcom_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon access for dev mode"
  ON calcom_settings FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Organization members can manage calcom settings"
  ON calcom_settings FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Calendar Preferences RLS
ALTER TABLE calendar_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon access for dev mode"
  ON calendar_preferences FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage own preferences"
  ON calendar_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_calcom_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_calcom_settings_updated_at
      BEFORE UPDATE ON calcom_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_calendar_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_calendar_preferences_updated_at
      BEFORE UPDATE ON calendar_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
