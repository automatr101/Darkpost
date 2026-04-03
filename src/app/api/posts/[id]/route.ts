import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * DELETE /api/posts/[id]
 * Soft delete a post (incinerate).
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

  // Check ownership
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (post.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized: You can only incinerate your own confessions.' }, { status: 403 });
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Confession incinerated from the archive.' });
}
