-- ============================================================================
-- Migration: Fix missing ON DELETE CASCADE and add DELETE RLS policy
-- 
-- Problem: The foreign keys from replies, user_screenshots, and post_views
-- to posts(id) were created WITHOUT ON DELETE CASCADE, causing post deletion
-- to fail with a foreign key constraint violation. Additionally, the posts
-- table has no RLS DELETE policy.
-- ============================================================================

-- 1. Fix: Add ON DELETE CASCADE to replies → posts(id)
ALTER TABLE public.replies
  DROP CONSTRAINT IF EXISTS replies_post_id_fkey,
  ADD CONSTRAINT replies_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 2. Fix: Add ON DELETE CASCADE to user_screenshots → posts(id)
ALTER TABLE public.user_screenshots
  DROP CONSTRAINT IF EXISTS user_screenshots_post_id_fkey,
  ADD CONSTRAINT user_screenshots_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 3. Fix: Add ON DELETE CASCADE to post_views → posts(id)
ALTER TABLE public.post_views
  DROP CONSTRAINT IF EXISTS post_views_post_id_fkey,
  ADD CONSTRAINT post_views_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 4. Add missing RLS DELETE policy for posts
-- (Currently the schema only has SELECT, INSERT, UPDATE policies — no DELETE)
CREATE POLICY "Users can delete own posts."
  ON public.posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Add missing RLS DELETE policy for replies (user can delete their own replies)
CREATE POLICY "Users can delete own replies."
  ON public.replies
  FOR DELETE
  USING (auth.uid() = user_id);
