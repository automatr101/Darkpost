import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/posts/[id]/replies
 * Returns replies. Any authenticated user can read.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data: replies, error } = await supabase
    .from('replies')
    .select(`*, user:users(username, display_name, avatar_url)`)
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: replies });
}

/**
 * POST /api/posts/[id]/replies
 * Post a reply. Any authenticated user can comment.
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

  const body = await request.json();
  const { content } = body;

  if (!content || content.length === 0) {
    return NextResponse.json({ error: 'Reply content is required.' }, { status: 400 });
  }
  if (content.length > 280) {
    return NextResponse.json({ error: 'Reply must be 280 characters or fewer.' }, { status: 400 });
  }

  const { data: reply, error } = await supabase
    .from('replies')
    .insert({ post_id: postId, user_id: user.id, content })
    .select(`*, user:users(username, display_name, avatar_url)`)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: reply }, { status: 201 });
}
