/*
  # Enhance Calls System for AI Agents

  ## Changes
  1. Add call type enum to distinguish human vs AI agent calls
  2. Add AI agent fields (agent_id, agent_name, agent_type)
  3. Add call outcome enum for better tracking
  4. Add sentiment enum (convert from sentiment_score)
  5. Add notes, tags, and linked records
  6. Rename phone_number to customer_phone for clarity
  7. Add ai_insights jsonb field for structured AI analysis
  
  ## Security
  - Existing RLS policies continue to work
  - No changes to access control
*/

-- Create new enums if they don't exist
DO $$ BEGIN
  CREATE TYPE call_type_enum AS ENUM ('human', 'ai_agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agent_type_enum AS ENUM ('retell', 'vapi', 'bland', 'internal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE call_outcome_enum AS ENUM ('positive', 'neutral', 'negative', 'callback', 'no_answer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE call_sentiment_enum AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to calls table
DO $$
BEGIN
  -- Add call_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'call_type'
  ) THEN
    ALTER TABLE calls ADD COLUMN call_type call_type_enum DEFAULT 'human';
  END IF;

  -- Add agent fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE calls ADD COLUMN agent_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE calls ADD COLUMN agent_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE calls ADD COLUMN agent_type agent_type_enum;
  END IF;

  -- Add customer_phone (alias for phone_number)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE calls ADD COLUMN customer_phone text;
    -- Copy data from phone_number if it exists
    UPDATE calls SET customer_phone = phone_number WHERE phone_number IS NOT NULL;
  END IF;

  -- Add outcome
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'outcome'
  ) THEN
    ALTER TABLE calls ADD COLUMN outcome call_outcome_enum;
  END IF;

  -- Add sentiment enum (separate from sentiment_score)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'sentiment'
  ) THEN
    ALTER TABLE calls ADD COLUMN sentiment call_sentiment_enum;
    -- Migrate from sentiment_score if it exists
    UPDATE calls 
    SET sentiment = CASE 
      WHEN sentiment_score >= 0.6 THEN 'positive'::call_sentiment_enum
      WHEN sentiment_score <= 0.4 THEN 'negative'::call_sentiment_enum
      ELSE 'neutral'::call_sentiment_enum
    END
    WHERE sentiment_score IS NOT NULL;
  END IF;

  -- Add ai_insights (structured JSON for AI analysis)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'ai_insights'
  ) THEN
    ALTER TABLE calls ADD COLUMN ai_insights jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'notes'
  ) THEN
    ALTER TABLE calls ADD COLUMN notes text;
  END IF;

  -- Add tags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'tags'
  ) THEN
    ALTER TABLE calls ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;

  -- Add linked records
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'linked_deal_id'
  ) THEN
    ALTER TABLE calls ADD COLUMN linked_deal_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'linked_task_id'
  ) THEN
    ALTER TABLE calls ADD COLUMN linked_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;

  -- Add summary alias for call_summary
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'summary'
  ) THEN
    ALTER TABLE calls ADD COLUMN summary text;
    -- Copy from call_summary if it exists
    UPDATE calls SET summary = call_summary WHERE call_summary IS NOT NULL;
  END IF;
END $$;

-- Update status enum to include more states
DO $$
BEGIN
  -- Check if we need to add new status values
  ALTER TYPE call_status RENAME TO call_status_old;
  
  CREATE TYPE call_status AS ENUM (
    'initiated', 
    'ringing', 
    'in_progress', 
    'completed', 
    'failed', 
    'no_answer',
    'missed',
    'voicemail',
    'busy',
    'ongoing'
  );
  
  ALTER TABLE calls 
    ALTER COLUMN status TYPE call_status 
    USING status::text::call_status;
  
  DROP TYPE call_status_old;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN
    -- If rename fails, the type might already be correct
    NULL;
END $$;

-- Add constraint to ensure either user_id or agent_id is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_call_agent'
  ) THEN
    ALTER TABLE calls ADD CONSTRAINT valid_call_agent CHECK (
      (call_type = 'human' AND user_id IS NOT NULL) OR
      (call_type = 'ai_agent' AND agent_id IS NOT NULL) OR
      (user_id IS NOT NULL) OR
      (agent_id IS NOT NULL)
    );
  END IF;
END $$;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_calls_call_type ON calls(call_type);
CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON calls(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_sentiment ON calls(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_linked_task ON calls(linked_task_id) WHERE linked_task_id IS NOT NULL;

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_calls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Auto-calculate duration if ended_at is set
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_calls_timestamp ON calls;
CREATE TRIGGER trigger_update_calls_timestamp
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_calls_timestamp();