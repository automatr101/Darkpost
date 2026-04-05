import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/posts/[id]
 * Hard delete a post (incinerate). 
 * Includes cascading deletion of associated screenshots to satisfy foreign key constraints.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  try {
    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. Check Ownership (Respects RLS for read)
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, voice_url')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found or already incinerated.' }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only incinerate your own confessions.' },
        { status: 403 }
      );
    }

    // 3. Admin Client for Deletion (Bypass RLS)
    const adminSupabase = createAdminClient();

    // --- CASCADING DELETION START ---

    // A. Handle associated screenshots
    const { data: screenshots, error: screenshotFetchError } = await adminSupabase
      .from('user_screenshots')
      .select('id, image_url')
      .eq('post_id', postId);

    if (!screenshotFetchError && screenshots && screenshots.length > 0) {
      // Delete screenshot files from Storage
      const filesToDelete = screenshots
        .map(s => s.image_url.split('/').pop())
        .filter(Boolean) as string[];

      if (filesToDelete.length > 0) {
        await adminSupabase.storage.from('screenshots').remove(filesToDelete);
      }

      // Delete screenshot records from Database
      await adminSupabase.from('user_screenshots').delete().eq('post_id', postId);
    }

    // B. Delete audio from storage if applicable
    if (post.voice_url) {
      const filename = post.voice_url.split('/').pop();
      if (filename) {
        await adminSupabase.storage.from('voice-posts').remove([filename]);
      }
    }

    // --- CASCADING DELETION END ---

    // 4. Final Post Hard Delete
    const { error: deleteError, count } = await adminSupabase
      .from('posts')
      .delete({ count: 'exact' })
      .eq('id', postId)
      .eq('user_id', user.id); // Extra safety check

    if (deleteError) {
      console.error('Delete database error:', deleteError);
      return NextResponse.json({ error: `Incineration failed: ${deleteError.message}` }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json(
        { error: 'Delete failed: Post could not be removed. It may be locked or already gone.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Confession and all associated data incinerated.' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected delete error:', errorMessage);
    return NextResponse.json({ error: 'An unexpected error occurred during incineration.' }, { status: 500 });
  }
}
