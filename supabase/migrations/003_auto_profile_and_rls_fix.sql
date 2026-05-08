-- Nicola Hub v3 — Migration 003: Auto-create profile on signup + fix RLS
-- Run this in Supabase SQL Editor

-- ============================================================================
-- FUNCTION: Auto-create profile when a new user signs up
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, language, onboarding_completed, brand_voice)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'es',
    false,
    '{}'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FIX RLS: Allow service role to bypass RLS for API routes
-- ============================================================================

-- Profiles: ensure all operations work for own user
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATE: Add onboarding_completed column if missing (should exist from 001)
-- ============================================================================
-- This is a safety check; if the column already exists, it will be a no-op
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- ============================================================================
-- VERIFY: Make sure the profiles table has the correct structure
-- ============================================================================
-- The handle_new_user function will now automatically create a profile
-- for every new user who signs up, eliminating the race condition
-- where the onboarding wizard tries to update a non-existent profile.