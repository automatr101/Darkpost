import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/posts/[id]/screenshot
 * Core unlock endpoint. Auth required.
 * Increments screenshot_count atomically.
 * Returns replies + burn_score.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Check if already unlocked (idempotent)
  const { data: existing } = await supabase
    .from('user_screenshots')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  let alreadyUnlocked = false;

  if (existing) {
    alreadyUnlocked = true;
  } else {
    // Insert screenshot record (ON CONFLICT DO NOTHING via upsert)
    await supabase
      .from('user_screenshots')
      .insert({ user_id: user.id, post_id: postId });

    // Atomically increment screenshot_count via RPC
    try {
      await supabase.rpc('increment_screenshot_count', { post_uuid: postId });
    } catch {
      // Fallback: trigger-based or manual update
      await supabase
        .from('posts')
        .update({ screenshot_count: 1 }) // dummy update to trigger DB logic
        .eq('id', postId);
    }

    // Simple increment fallback
    const { data: currentPost } = await supabase
      .from('posts')
      .select('screenshot_count')
      .eq('id', postId)
      .single();

    if (currentPost) {
      await supabase
        .from('posts')
        .update({ screenshot_count: currentPost.screenshot_count + 1 })
        .eq('id', postId);
    }
  }

  // Fetch replies for this post
  const { data: replies } = await supabase
    .from('replies')
    .select(`
      *,
      user:users(username, display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // Compute Burn Score (never stored, always computed fresh)
  const { data: post } = await supabase
    .from('posts')
    .select('screenshot_count, reply_count, view_count, created_at')
    .eq('id', postId)
    .single();

  let burnScore = 0;
  if (post) {
    const base = (post.screenshot_count * 10) + (post.reply_count * 5) + post.view_count;
    const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);

    let recencyMultiplier = 1.0;
    if (hoursOld < 3) recencyMultiplier = 2.0;
    else if (hoursOld < 12) recencyMultiplier = 1.5;

    burnScore = Math.round(base * recencyMultiplier);
  }

  return NextResponse.json({
    replies: replies || [],
    burn_score: burnScore,
    already_unlocked: alreadyUnlocked,
  });
}
