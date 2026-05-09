-- Nicola Schaefer Hub v3 — Sprint 8A: Scheduling & Publishing Queue
-- Run this in Supabase SQL Editor

-- ============================================================================
-- SCHEDULED PUBLISHING QUEUE
-- ============================================================================
-- Content items already have scheduled_date/scheduled_time
-- This adds a dedicated queue table for the publishing engine

CREATE TABLE IF NOT EXISTS publishing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  failure_reason TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  ig_container_id TEXT,
  ig_permalink TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for the cron job to find pending items
CREATE INDEX idx_publishing_queue_status ON publishing_queue(status, scheduled_at) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_publishing_queue_user ON publishing_queue(user_id);

-- ============================================================================
-- CONTENT PIPELINE STAGES
-- ============================================================================
-- Add a workflow_state column to content_items for pipeline tracking
-- (already has 'status' but we need more granular pipeline tracking)

ALTER TABLE content_items ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'idea' 
  CHECK (pipeline_stage IN ('idea', 'draft', 'review', 'approved', 'scheduled', 'published', 'archived'));

-- Update existing rows: map current status to pipeline_stage
UPDATE content_items SET pipeline_stage = CASE status
  WHEN 'draft' THEN 'draft'
  WHEN 'review' THEN 'review'
  WHEN 'approved' THEN 'approved'
  WHEN 'scheduled' THEN 'scheduled'
  WHEN 'published' THEN 'published'
  WHEN 'failed' THEN 'draft'
  ELSE 'idea'
END
WHERE pipeline_stage IS NULL OR pipeline_stage = 'idea';

-- ============================================================================
-- SAVED FILTERS / VIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'calendar' CHECK (type IN ('calendar', 'kanban', 'list')),
  filters JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE publishing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publishing_queue_all_own" ON publishing_queue FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "saved_views_all_own" ON saved_views FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER publishing_queue_updated_at BEFORE UPDATE ON publishing_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create publishing_queue entry when content_item becomes 'scheduled'
CREATE OR REPLACE FUNCTION auto_queue_scheduled_content()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
    INSERT INTO publishing_queue (user_id, content_item_id, status, scheduled_at)
    VALUES (
      NEW.user_id, 
      NEW.id, 
      'pending',
      COALESCE(
        (NEW.scheduled_date::text || ' ' || COALESCE(NEW.scheduled_time::text, '12:00:00') || NEW.timezone)::timestamptz,
        now() + interval '1 hour'
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_triggers WHERE tgname = 'content_items_auto_queue') THEN
    CREATE TRIGGER content_items_auto_queue AFTER INSERT OR UPDATE ON content_items
      FOR EACH ROW EXECUTE FUNCTION auto_queue_scheduled_content();
  END IF;
END $$;