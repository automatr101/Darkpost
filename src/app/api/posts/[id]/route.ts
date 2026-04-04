import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * DELETE /api/posts/[id]
 * Hard delete a post (incinerate).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check ownership and get file details to delete storage
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id, voice_url')
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (post.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized: You can only incinerate your own confessions.' }, { status: 403 });
  }

  // If there's a voice file, remove it completely from storage
  if (post.voice_url) {
    const filename = post.voice_url.split('/').pop();
    if (filename) {
      await supabase.storage.from('voice-posts').remove([filename]);
    }
  }

  // Hard delete the record
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Confession incinerated from the archive.' });
}
