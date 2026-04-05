import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/posts/[id]
 * Hard delete a post (incinerate). Uses admin client to bypass RLS.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  try {
    // Verify the caller is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check ownership using the user client (respects RLS read)
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, voice_url')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only incinerate your own confessions.' },
        { status: 403 }
      );
    }

    // Use centralized admin client to bypass RLS for the actual deletion
    const adminSupabase = createAdminClient();

    // Delete audio from storage first
    if (post.voice_url) {
      const filename = post.voice_url.split('/').pop();
      if (filename) {
        await adminSupabase.storage.from('voice-posts').remove([filename]);
      }
    }

    // Hard delete the record
    const { error: deleteError, count } = await adminSupabase
      .from('posts')
      .delete({ count: 'exact' })
      .eq('id', postId)
      .eq('user_id', user.id); // double-check ownership even with admin client

    if (deleteError) {
      console.error('Delete database error:', deleteError);
      return NextResponse.json({ error: `Delete failed: ${deleteError.message}` }, { status: 500 });
    }

    if (count === 0) {
      console.warn('Delete attempt returned 0 rows affected:', { postId, userId: user.id });
      return NextResponse.json(
        { error: 'Delete failed: This confession may have already been removed or the record is currently locked.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Confession incinerated from the archive.' });
  } catch (err: any) {
    console.error('Unexpected delete error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred during incineration.' }, { status: 500 });
  }
}
