import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { generateBotPersona } from '@/lib/bot-personas';

/**
 * POST /api/admin/seed
 * Secure endpoint to seed artificial users and posts.
 * 
 * Header: x-admin-key: SHOULD MATCH DARKPOST_ADMIN_SECRET
 */
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  const expectedKey = process.env.DARKPOST_ADMIN_SECRET;

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items, distributeOverHours = 12 } = await request.json();

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'Invalid items list' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // We will process these items. 
  // However, since this is a serverless environment, we cannot run for 12 hours.
  // Instead, we will back-date or forward-date the posts, OR we will
  // assume the user will call this API in batches.
  
  // Strategy: For each item, create a unique bot and post.
  const results = [];
  
  for (const content of items) {
    const persona = generateBotPersona();
    
    // 1. Create a "Dummy" Auth User using the Admin Client
    // This allows us to have a valid user_id for the posts table relationship.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${persona.username}@bot.darkpost.app`,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        display_name: persona.displayName,
        is_bot: true,
      }
    });

    if (authError || !authData.user) {
      console.error('Failed to create bot user:', authError);
      continue;
    }

    const userId = authData.user.id;

    // 2. Update the public.users record (which was created by trigger)
    // to include the randomized persona details.
    await supabase.from('users').update({
      display_name: persona.displayName,
      bio: persona.bio,
      username: persona.username,
    }).eq('id', userId);

    // 3. Insert the post
    // For "randomized timing", we can randomize the created_at timestamp 
    // within the requested hour window if we want them to populate the past/future.
    // However, for "real activity starting from now", we'll just insert them.
    
    const { data: post, error: postError } = await supabase.from('posts').insert({
      user_id: userId,
      content,
      post_type: 'text',
      is_anon: true,
      category_id: null, // User can provide this if they want
    }).select().single();

    if (postError) {
      console.error('Post creation error:', postError);
    } else {
      results.push(post.id);
    }
  }

  return NextResponse.json({ 
    message: `Seeding started. Created ${results.length} bot posts.`,
    count: results.length 
  });
}
