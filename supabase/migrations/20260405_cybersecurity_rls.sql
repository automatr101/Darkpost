-- ============================================================
-- Darkpost Cybersecurity RLS Hardening
-- Run this in Supabase SQL Editor to enforce strict API access
-- ============================================================

-- 1. HARDEN POSTS TABLE
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public to select posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own posts
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own posts
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own posts
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- 2. HARDEN REPLIES TABLE
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Allow public to view replies
DROP POLICY IF EXISTS "Replies are viewable by everyone" ON replies;
CREATE POLICY "Replies are viewable by everyone"
  ON replies FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own replies
DROP POLICY IF EXISTS "Users can insert their own replies" ON replies;
CREATE POLICY "Users can insert their own replies"
  ON replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own replies
DROP POLICY IF EXISTS "Users can update their own replies" ON replies;
CREATE POLICY "Users can update their own replies"
  ON replies FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own replies
DROP POLICY IF EXISTS "Users can delete their own replies" ON replies;
CREATE POLICY "Users can delete their own replies"
  ON replies FOR DELETE
  USING (auth.uid() = user_id);

-- 3. HARDEN USERS TABLE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public to view users (needed for profiles and displaying avatars)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
