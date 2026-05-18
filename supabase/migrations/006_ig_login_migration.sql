-- Nicola Hub v3 — Instagram Login Migration
-- Migrate from Facebook Login (graph.facebook.com) to Instagram Login (graph.instagram.com)
-- Adds token_type, token_refreshed_at columns and removes pages column

-- Add token_type column (default to instagram_login for new connections)
ALTER TABLE meta_connections ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'instagram_login';

-- Add token_refreshed_at column for tracking token refreshes
ALTER TABLE meta_connections ADD COLUMN IF NOT EXISTS token_refreshed_at TIMESTAMPTZ;

-- Remove pages column (no longer needed with Instagram Login — no Facebook Pages)
ALTER TABLE meta_connections DROP COLUMN IF EXISTS pages;

-- Add index on token_type for efficient queries
CREATE INDEX IF NOT EXISTS idx_meta_connections_token_type ON meta_connections(token_type);

-- Add index on expires_at for token refresh queries
CREATE INDEX IF NOT EXISTS idx_meta_connections_expires_at ON meta_connections(expires_at);

-- Update existing connections to mark as instagram_login type (if any exist)
-- This can be changed to 'facebook_login' if you want to keep old connections
-- UPDATE meta_connections SET token_type = 'facebook_login' WHERE token_type IS NULL;