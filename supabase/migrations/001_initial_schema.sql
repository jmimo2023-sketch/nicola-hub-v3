-- Nicola Schaefer Hub v3 — Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'de', 'en')),
  brand_voice JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CONTENT ITEMS
-- ============================================================================
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('post', 'reel', 'story', 'carousel', 'video')),
  pillar TEXT NOT NULL CHECK (pillar IN ('emotional_mastery', 'systematic_method', 'valley_experience', 'transformation', 'community')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published', 'failed')),
  title TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  asset_ids UUID[] DEFAULT '{}',
  scheduled_date DATE,
  scheduled_time TIME,
  timezone TEXT DEFAULT 'Europe/Berlin',
  published_url TEXT,
  published_at TIMESTAMPTZ,
  failure_reason TEXT,
  ai_prompt TEXT,
  generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai', 'template')),
  template_id UUID,
  campaign_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ASSETS
-- ============================================================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'template', 'design')),
  folder TEXT DEFAULT 'general',
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  size BIGINT DEFAULT 0,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration REAL,
  pillar TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'archived')),
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CONTENT TEMPLATES
-- ============================================================================
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('emotional_mastery', 'systematic_method', 'valley_experience', 'transformation', 'community')),
  type TEXT NOT NULL CHECK (type IN ('post', 'reel', 'story', 'carousel', 'video')),
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'de', 'en')),
  description TEXT,
  hook_pattern TEXT,
  structure JSONB DEFAULT '[]',
  cta_pattern TEXT,
  hashtag_groups JSONB DEFAULT '[]',
  tone_guidance TEXT,
  example TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN ('engagement', 'followers', 'conversions', 'awareness')),
  pillar TEXT CHECK (pillar IN ('emotional_mastery', 'systematic_method', 'valley_experience', 'transformation', 'community')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CRM CONTACTS
-- ============================================================================
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  instagram_handle TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('instagram', 'whatsapp', 'referral', 'website', 'event', 'manual')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'nurturing')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium', 'vip')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  engagement_score INTEGER DEFAULT 0,
  deal_value DECIMAL DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- META CONNECTIONS
-- ============================================================================
CREATE TABLE meta_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  ig_user_id TEXT,
  ig_username TEXT,
  ig_followers_count INTEGER DEFAULT 0,
  ig_media_count INTEGER DEFAULT 0,
  pages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ANALYTICS SNAPSHOTS
-- ============================================================================
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_content_items_user ON content_items(user_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_scheduled ON content_items(scheduled_date, scheduled_time);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_folder ON assets(folder);
CREATE INDEX idx_crm_contacts_user ON crm_contacts(user_id);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_analytics_user_date ON analytics_snapshots(user_id, date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Content items: full CRUD for own data
CREATE POLICY "content_items_all_own" ON content_items FOR ALL USING (auth.uid() = user_id);

-- Assets: full CRUD for own data
CREATE POLICY "assets_all_own" ON assets FOR ALL USING (auth.uid() = user_id);

-- Templates: read all custom + system, write own
CREATE POLICY "templates_select_all" ON content_templates FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "templates_insert_own" ON content_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "templates_update_own" ON content_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "templates_delete_own" ON content_templates FOR DELETE USING (auth.uid() = user_id);

-- Campaigns: full CRUD for own data
CREATE POLICY "campaigns_all_own" ON campaigns FOR ALL USING (auth.uid() = user_id);

-- CRM: full CRUD for own data
CREATE POLICY "crm_all_own" ON crm_contacts FOR ALL USING (auth.uid() = user_id);

-- Meta connections: full CRUD for own data
CREATE POLICY "meta_all_own" ON meta_connections FOR ALL USING (auth.uid() = user_id);

-- Analytics: read own data
CREATE POLICY "analytics_select_own" ON analytics_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "analytics_insert_own" ON analytics_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "assets_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "assets_read" ON storage.objects FOR SELECT USING (bucket_id = 'assets');

-- ============================================================================
-- AUTO-UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER content_items_updated_at BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();