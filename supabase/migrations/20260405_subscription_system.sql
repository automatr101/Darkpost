-- ============================================================
-- Darkpost Subscription System — Database Migration
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/rqjypyuifvezjtdxkaxn/sql
-- ============================================================

-- 1. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
  tier                    TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'black')),
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT false,
  is_og                   BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(stripe_customer_id),
  UNIQUE(stripe_subscription_id)
);

-- 2. AUTO-UPDATE updated_at ON EVERY UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS POLICIES ON SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription only
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (Stripe webhook uses service role key)
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can update
DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.role() = 'service_role');

-- No deletes allowed
DROP POLICY IF EXISTS "No deletes on subscriptions" ON subscriptions;
CREATE POLICY "No deletes on subscriptions"
  ON subscriptions FOR DELETE
  USING (false);

-- ============================================================
-- 4. FEATURE GATES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_gates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature     TEXT UNIQUE NOT NULL,
  min_tier    TEXT NOT NULL CHECK (min_tier IN ('free', 'pro', 'black')),
  description TEXT
);

-- Public SELECT only (server-side reads without auth)
ALTER TABLE feature_gates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read feature gates" ON feature_gates;
CREATE POLICY "Public can read feature gates"
  ON feature_gates FOR SELECT
  USING (true);

-- ============================================================
-- 5. SEED FEATURE GATES
-- ============================================================

INSERT INTO feature_gates (feature, min_tier, description) VALUES
  ('custom_alias',               'pro',   'Set a custom alias instead of random Shadow #'),
  ('custom_font',                'pro',   'Choose a custom font for your posts'),
  ('pro_badge',                  'pro',   'Pro badge shown on your Enclave profile'),
  ('no_watermark',               'pro',   'Remove Darkpost watermark from screenshots'),
  ('voice_5min',                 'pro',   'Record voice confessions up to 5 minutes'),
  ('schedule_posts',             'pro',   'Schedule confessions to post at a future time'),
  ('drafts',                     'pro',   'Save posts as drafts'),
  ('edit_post',                  'pro',   'Edit a post within 5 minutes of posting'),
  ('confession_expiry',          'pro',   'Set confessions to expire after 1h / 6h / 24h'),
  ('pin_confession',             'pro',   'Pin 1 confession to top of Enclave'),
  ('see_who_screenshotted',      'pro',   'See which users screenshotted your posts'),
  ('post_analytics',             'pro',   'View analytics and Burn Score history on posts'),
  ('reply_anonymously',          'pro',   'Reply to confessions anonymously'),
  ('ghost_mode',                 'pro',   'Hide Enclave from non-followers and search'),
  ('ai_therapist',               'black', 'Get a private GPT-4o reply to your confession'),
  ('voice_effects',              'black', 'Apply voice effects: deeper, distorted, echo'),
  ('background_music',           'black', 'Add background music to voice posts'),
  ('animated_waveform',          'black', 'Animated waveform on voice posts'),
  ('custom_card_theme',          'black', 'Custom post card color and theme'),
  ('unlock_without_screenshot',  'black', 'Unlock replies without taking a screenshot'),
  ('black_badge',                'black', 'Black badge shown on Enclave profile'),
  ('og_badge',                   'black', 'OG badge for first 1,000 Black subscribers'),
  ('featured_explore',           'black', 'Featured on Explore page once per week'),
  ('boost_trending',             'black', 'Boost 1 confession to Trending per month')
ON CONFLICT (feature) DO NOTHING;
