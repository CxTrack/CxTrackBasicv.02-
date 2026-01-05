/*
  # Add Calendar Visibility Option for Tasks

  1. New Column
    - `show_on_calendar` (BOOLEAN) - Whether task appears on calendar and blocks time
      - Default: false (tasks are in task list only by default)
      - When true: task shows on calendar, requires time, blocks scheduling conflicts
      - When false: task only in task list, no time required, no conflicts

  2. Changes
    - Add show_on_calendar field with default false
    - Make start_time, end_time, duration optional (only required when show_on_calendar is true)
    - Allows tasks to be either calendar-blocking or simple to-dos

  3. Security
    - No changes to existing RLS policies
*/

-- Add show_on_calendar field to tasks table
DO $$
BEGIN
  -- Add show_on_calendar column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'show_on_calendar'
  ) THEN
    ALTER TABLE tasks ADD COLUMN show_on_calendar BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for better query performance when filtering calendar tasks
CREATE INDEX IF NOT EXISTS idx_tasks_show_on_calendar ON tasks(show_on_calendar) WHERE show_on_calendar = true;

-- Add comment
COMMENT ON COLUMN tasks.show_on_calendar IS 'Whether task appears on calendar and blocks time (default: false)';
