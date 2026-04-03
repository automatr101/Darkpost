import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAlias } from '@/lib/aliases';

/**
 * GET /api/feed
 * Paginated public feed. No auth required.
 * Params: category_slug, sort (new|trending), type (text|voice|all), cursor
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('category_slug');
  const sort = searchParams.get('sort') || 'new';
  const type = searchParams.get('type') || 'all';
  const cursor = searchParams.get('cursor');
  const limit = 20;

  const supabase = createClient();

  let query = supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .is('deleted_at', null)
    .limit(limit);

  // Filter by category
  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) {
      query = query.eq('category_id', cat.id);
    }
  }

  // Filter by post type
  if (type !== 'all') {
    query = query.eq('post_type', type);
  }

  // Sort
  if (sort === 'trending') {
    query = query.order('screenshot_count', { ascending: false })
                 .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask user_id for anonymous posts, generate aliases
  const maskedPosts = (posts || []).map((post) => {
    if (post.is_anon) {
      return {
        ...post,
        user_id: null,
        alias: getAlias(post.id),
        user: null,
      };
    }
    return {
      ...post,
      alias: null,
    };
  });

  const nextCursor = maskedPosts.length === limit
    ? maskedPosts[maskedPosts.length - 1].created_at
    : null;

  return NextResponse.json({
    data: maskedPosts,
    next_cursor: nextCursor,
  });
}
