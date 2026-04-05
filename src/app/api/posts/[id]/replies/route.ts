import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { applyRateLimit } from '@/lib/rate-limit';

const replySchema = z.object({
  content: z.string().min(1, 'Reply content is required.').max(280, 'Reply must be 280 characters or fewer.'),
});

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

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = applyRateLimit(`reply_create_${ip}`, 10, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const validated = replySchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
  }

  // Strict HTML sanitization
  const content = DOMPurify.sanitize(validated.data.content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

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

/**
 * DELETE /api/posts/[id]/replies?replyId=...
 * Delete a reply. Only the creator can delete their reply.
 */
export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { searchParams } = new URL(request.url);
  const replyId = searchParams.get('replyId');

  if (!replyId) {
    return NextResponse.json({ error: 'replyId is required' }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Soft delete or hard delete. Darkpost has deleted_at on some tables, but maybe not on replies.
  // Actually, in the GET method we check `.is('deleted_at', null)`, meaning soft deletes are used! 
  // Let's check if the column exists. If we aren't sure, hard delete is safer or we can do soft delete.
  // We'll soft delete to be safe: update({ deleted_at: new Date().toISOString() })
  
  const { data: existingReply, error: findError } = await supabase
    .from('replies')
    .select('user_id')
    .eq('id', replyId)
    .single();

  if (findError || !existingReply) {
    return NextResponse.json({ error: 'Reply not found.' }, { status: 404 });
  }

  if (existingReply.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized to delete this reply.' }, { status: 403 });
  }

  const { error } = await supabase
    .from('replies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', replyId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
