import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  try {
    // 1. Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Auth required to unlock' }, { status: 401 });
    }

    // 2. Get post to check owner
    const { data: post, error: getError } = await supabase
      .from('posts')
      .select('id, user_id, screenshot_count')
      .eq('id', postId)
      .single();

    if (getError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isMine = post.user_id === user.id;

    // 3. Roll for "Burn" (30% chance) - SKIP if owner
    const isBurnt = !isMine && Math.random() < 0.3;

    if (isBurnt) {
      // DELETE post (Burn)
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;

      return NextResponse.json({ 
        success: true, 
        action: 'burnt', 
        message: 'The soul was too heavy. This confession has been reduced to ashes.' 
      });
    }

    // 4. Record the screenshot/unlock
    const { error: unlockError } = await supabase
      .from('user_screenshots')
      .upsert({ 
        user_id: user.id, 
        post_id: postId,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id, post_id' });

    if (unlockError) throw unlockError;

    // 5. Increment screenshot counter
    const { error: updateError } = await supabase
      .from('posts')
      .update({ screenshot_count: (post.screenshot_count || 0) + 1 })
      .eq('id', postId);

    if (updateError) throw updateError;
    
    return NextResponse.json({ 
      success: true, 
      action: 'unlocked', 
      message: 'Snapshot captured. The thread is now visible.' 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
