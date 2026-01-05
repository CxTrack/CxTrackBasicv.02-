-- =============================================================================
-- Enhance Tasks Table
-- =============================================================================
-- Add missing columns to tasks table for full task management
-- =============================================================================

-- Add missing columns to tasks table
DO $$
BEGIN
  -- Add due_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'due_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_time TIME;
  END IF;

  -- Add assigned_to column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_to UUID REFERENCES user_profiles(id);
  END IF;

  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'category'
  ) THEN
    ALTER TABLE tasks ADD COLUMN category TEXT;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tags TEXT[];
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'notes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Update priority values to lowercase for consistency
UPDATE tasks SET priority = LOWER(priority) WHERE priority IN ('Low', 'Medium', 'High', 'Urgent');

-- Update priority constraint to use lowercase
DO $$
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
  ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Update status constraint to match desired values
DO $$
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
  ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Update existing status values
UPDATE tasks SET status = 'todo' WHERE status = 'pending';

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);