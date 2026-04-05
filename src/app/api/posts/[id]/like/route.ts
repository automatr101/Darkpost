import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/posts/[id]/like
 * Toggle like on a post. Returns new likes_count and liked state.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body; // 'like' | 'unlike'

  // Get current likes_count
  const { data: post } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }

  const currentCount = post.likes_count ?? 0;
  const newCount = action === 'like' ? currentCount + 1 : Math.max(0, currentCount - 1);

  const { error } = await supabase
    .from('posts')
    .update({ likes_count: newCount })
    .eq('id', postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ likes_count: newCount, liked: action === 'like' });
}
