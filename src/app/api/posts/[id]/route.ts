import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/posts/[id]
 * Manually deletes all child rows (post_views, user_screenshots, replies)
 * before deleting the parent post, since the database foreign keys
 * do NOT have ON DELETE CASCADE.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  try {
    // 1. Authentication & Ownership Verification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Identify ownership and storage assets
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, voice_url')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Delete all child rows first, then the post (using Admin Client to bypass RLS)
    const adminSupabase = createAdminClient();

    // Delete child rows in order — these tables reference posts(id) without CASCADE
    const { error: viewsError } = await adminSupabase
      .from('post_views')
      .delete()
      .eq('post_id', postId);
    if (viewsError) {
      console.error('[DELETE API] Failed to delete post_views:', viewsError);
    }

    const { error: screenshotsError } = await adminSupabase
      .from('user_screenshots')
      .delete()
      .eq('post_id', postId);
    if (screenshotsError) {
      console.error('[DELETE API] Failed to delete user_screenshots:', screenshotsError);
    }

    const { error: repliesError } = await adminSupabase
      .from('replies')
      .delete()
      .eq('post_id', postId);
    if (repliesError) {
      console.error('[DELETE API] Failed to delete replies:', repliesError);
    }

    // Now delete the parent post
    const { error: deleteError } = await adminSupabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('[DELETE API] DB Error:', deleteError);
      return NextResponse.json({ 
        error: `Deletion failed: ${deleteError.message}`,
        details: deleteError.details
      }, { status: 500 });
    }

    // 3. Clean up Storage (S3/Supabase Storage)
    if (post.voice_url) {
      const filename = post.voice_url.split('/').pop();
      if (filename) {
        await adminSupabase.storage.from('voice-posts').remove([filename]);
      }
    }

    return NextResponse.json({ success: true, message: 'Post and all dependencies incinerated.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[DELETE API] Critical error:', message);
    return NextResponse.json({ error: 'Internal server error during deletion.' }, { status: 500 });
  }
}
