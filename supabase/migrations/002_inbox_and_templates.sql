-- Reply Templates table for Sprint 4
CREATE TABLE IF NOT EXISTS reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reply_templates_user ON reply_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_reply_templates_category ON reply_templates(category);

ALTER TABLE reply_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reply_templates_all_own" ON reply_templates FOR ALL USING (auth.uid() = user_id);

-- Inbox messages cache table (for storing synced IG comments/DMs)
CREATE TABLE IF NOT EXISTS inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_message_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'dm', 'reply')),
  sender_name TEXT,
  sender_username TEXT,
  sender_avatar_url TEXT,
  text TEXT,
  media_url TEXT,
  media_permalink TEXT,
  media_caption TEXT,
  is_read BOOLEAN DEFAULT false,
  is_replied BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  ig_parent_id TEXT,
  ig_conversation_id TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_user ON inbox_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_type ON inbox_messages(type);
CREATE INDEX IF NOT EXISTS idx_inbox_read ON inbox_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_inbox_timestamp ON inbox_messages(timestamp DESC);

ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inbox_all_own" ON inbox_messages FOR ALL USING (auth.uid() = user_id);

-- Auto-update trigger
CREATE TRIGGER reply_templates_updated_at BEFORE UPDATE ON reply_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();