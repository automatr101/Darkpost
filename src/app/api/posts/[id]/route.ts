import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

  // Verify the caller is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
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

  // Use admin client to bypass RLS for the actual deletion
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
    console.error('Delete error:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (count === 0) {
    // Row existed but wasn't deleted — ownership mismatch or RLS
    return NextResponse.json(
      { error: 'Delete failed: post may have already been removed.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: 'Confession incinerated from the archive.' });
}
