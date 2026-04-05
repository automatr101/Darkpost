import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/posts/[id]
 * Hard delete a post (incinerate). 
 * Includes exhaustive cascading deletion of all referencing data 
 * to satisfy foreign key constraints.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const postId = params.id;

  console.log(`[DELETE API] Starting incineration for postId: ${postId}`);

  try {
    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. Check Ownership (Respects RLS for read)
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, voice_url')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      console.error(`[DELETE API] Post not found or error:`, fetchError);
      return NextResponse.json({ error: 'Post not found or already incinerated.' }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      console.warn(`[DELETE API] Unauthorized delete attempt by user: ${user.id} on post: ${postId}`);
      return NextResponse.json(
        { error: 'Unauthorized: You can only incinerate your own confessions.' },
        { status: 403 }
      );
    }

    // 3. Admin Client for Deletion (Bypass RLS)
    const adminSupabase = createAdminClient();

    // --- EXHAUSTIVE CASCADING DELETION ---

    // A. user_screenshots (Database + Storage)
    const { data: screenshots, error: sFetchError } = await adminSupabase
      .from('user_screenshots')
      .select('id, image_url')
      .eq('post_id', postId);

    if (sFetchError) {
      console.error(`[DELETE API] Error fetching screenshots:`, sFetchError);
    } else if (screenshots && screenshots.length > 0) {
      console.log(`[DELETE API] Found ${screenshots.length} screenshots to delete.`);
      const filesToDelete = screenshots
        .map(s => s.image_url.split('/').pop())
        .filter(Boolean) as string[];

      if (filesToDelete.length > 0) {
        const { error: storageError } = await adminSupabase.storage.from('screenshots').remove(filesToDelete);
        if (storageError) console.error(`[DELETE API] Storage delete error:`, storageError);
      }
      const { error: sDeleteError } = await adminSupabase.from('user_screenshots').delete().eq('post_id', postId);
      if (sDeleteError) console.error(`[DELETE API] screenshot DB delete error:`, sDeleteError);
    }

    // B. replies
    const { error: rDeleteError } = await adminSupabase.from('replies').delete().eq('post_id', postId);
    if (rDeleteError) console.error(`[DELETE API] replies delete error:`, rDeleteError);

    // C. unlocked_posts
    const { error: uDeleteError } = await adminSupabase.from('unlocked_posts').delete().eq('post_id', postId);
    if (uDeleteError) console.error(`[DELETE API] unlocks delete error:`, uDeleteError);

    // D. potential other interaction tables
    const others = ['post_interactions', 'likes', 'bookmarks'];
    for (const table of others) {
      const { error: oError } = await adminSupabase.from(table).delete().eq('post_id', postId);
      if (oError && oError.code !== '42P01') { // 42P01 = table does not exist
        console.error(`[DELETE API] ${table} delete error:`, oError);
      }
    }

    // E. voice-posts storage
    if (post.voice_url) {
      const { error: vError } = await adminSupabase.storage.from('voice-posts').remove([post.voice_url.split('/').pop()!]);
      if (vError) console.error(`[DELETE API] voice-post storage error:`, vError);
    }

    // 4. Final Post Hard Delete
    const { error: deleteError, count } = await adminSupabase
      .from('posts')
      .delete({ count: 'exact' })
      .eq('id', postId)
      .eq('user_id', user.id); 

    if (deleteError) {
      console.error('[DELETE API] CRITICAL ERROR deleting post:', deleteError);
      return NextResponse.json({ 
        error: `Incineration failed: ${deleteError.message}. Code: ${deleteError.code}`,
        details: deleteError.details
      }, { status: 500 });
    }

    console.log(`[DELETE API] Successfully deleted ${count} rows for postId: ${postId}`);
    return NextResponse.json({ message: 'Confession and all data incinerated.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[DELETE API] Unexpected catch error:', errorMsg);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
