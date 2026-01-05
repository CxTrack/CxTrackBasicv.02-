/*
  # Add Task Scheduling Fields

  1. New Columns
    - `start_time` (TEXT) - Start time in 12-hour format (e.g., "2:00 PM")
    - `end_time` (TEXT) - End time in 12-hour format (e.g., "3:00 PM")
    - `duration` (INTEGER) - Duration in minutes
    - `type` (TEXT) - Task type (call, follow_up, meeting, other)

  2. Changes
    - Add scheduling fields to tasks table for calendar integration
    - Enable conflict checking between tasks and appointments
    - Support displaying tasks at specific times on calendar

  3. Security
    - No changes to existing RLS policies
*/

-- Add scheduling fields to tasks table
DO $$
BEGIN
  -- Add start_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_time TEXT;
  END IF;

  -- Add end_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN end_time TEXT;
  END IF;

  -- Add duration column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'duration'
  ) THEN
    ALTER TABLE tasks ADD COLUMN duration INTEGER DEFAULT 30;
  END IF;

  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN type TEXT CHECK (type IN ('call', 'follow_up', 'meeting', 'other')) DEFAULT 'other';
  END IF;

  -- Add outcome column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'outcome'
  ) THEN
    ALTER TABLE tasks ADD COLUMN outcome TEXT;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- Add comment
COMMENT ON COLUMN tasks.start_time IS 'Start time in 12-hour format (e.g., "2:00 PM")';
COMMENT ON COLUMN tasks.end_time IS 'End time in 12-hour format (e.g., "3:00 PM")';
COMMENT ON COLUMN tasks.duration IS 'Duration in minutes';
COMMENT ON COLUMN tasks.type IS 'Type of task (call, follow_up, meeting, other)';