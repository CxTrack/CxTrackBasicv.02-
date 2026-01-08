-- =====================================================
-- ADD CANCELED_AT TO SUBSCRIPTIONS TABLE
-- For accurate churn tracking
-- =====================================================

-- Add canceled_at column if it doesn't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

-- Add index for churn queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_canceled_at 
ON subscriptions(canceled_at) 
WHERE canceled_at IS NOT NULL;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON subscriptions(status);

-- Add composite index for churn calculation queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_churn_calc 
ON subscriptions(status, canceled_at, created_at);
