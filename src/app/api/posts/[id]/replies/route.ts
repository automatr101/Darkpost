import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/posts/[id]/replies
 * Returns replies. 403 if user has not screenshotted.
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

  // Check ownership or screenshot gate
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  const isMine = post?.user_id === user.id;

  const { data: screenshot } = await supabase
    .from('user_screenshots')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (!screenshot && !isMine) {
    return NextResponse.json({ error: 'Screenshot to unlock replies' }, { status: 403 });
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
 * Post a reply. 403 if not screenshotted.
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

  // Check ownership or screenshot gate
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  const isMine = post?.user_id === user.id;

  const { data: screenshot } = await supabase
    .from('user_screenshots')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (!screenshot && !isMine) {
    return NextResponse.json({ error: 'Screenshot to unlock replies' }, { status: 403 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || content.length === 0) {
    return NextResponse.json({ error: 'Reply content is required.' }, { status: 400 });
  }
  if (content.length > 200) {
    return NextResponse.json({ error: 'Reply must be 200 characters or fewer.' }, { status: 400 });
  }

  const { data: reply, error } = await supabase
    .from('replies')
    .insert({ post_id: postId, user_id: user.id, content })
    .select(`*, user:users(username, display_name, avatar_url)`)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Post-MVP: notify post owner when reply is added (push notification + in-app bell).

  return NextResponse.json({ data: reply }, { status: 201 });
}
