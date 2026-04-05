import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { containsBlockedContent } from '@/lib/moderation';

/**
 * POST /api/posts
 * Create a new post. Auth required.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Ensure public.users row exists for legacy test accounts created before triggers were added
  const { data: existingUser } = await supabase.from('users').select('id').eq('id', user.id).single();
  if (!existingUser) {
    await supabase.from('users').insert({ id: user.id, username: `user${Math.floor(Math.random() * 9000 + 1000)}` });
  }

  const body = await request.json();
  const { content, is_anon = true, category_id, post_type = 'text', voice_url, waveform_data, duration_seconds } = body;

  // Validate text posts
  if (post_type === 'text') {
    if (!content || content.length < 10) {
      return NextResponse.json({ error: 'Confession must be at least 10 characters.' }, { status: 400 });
    }
    if (content.length > 280) {
      return NextResponse.json({ error: 'Confession must be 280 characters or fewer.' }, { status: 400 });
    }

    // Content moderation
    if (containsBlockedContent(content)) {
      return NextResponse.json({ error: 'This post contains content that violates our guidelines.' }, { status: 400 });
    }
  }

  // Validate voice posts
  if (post_type === 'voice') {
    if (!voice_url) {
      return NextResponse.json({ error: 'Voice URL is required for voice posts.' }, { status: 400 });
    }
    if (!waveform_data || !Array.isArray(waveform_data)) {
      return NextResponse.json({ error: 'Waveform data is required for voice posts.' }, { status: 400 });
    }
    if (duration_seconds && duration_seconds > 30) {
      return NextResponse.json({ error: 'Voice posts must be 30 seconds or shorter.' }, { status: 400 });
    }
    // TODO: Post-MVP: transcribe voice posts and run moderation filter on the transcript.
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      post_type,
      content: post_type === 'text' ? content : null,
      voice_url: post_type === 'voice' ? voice_url : null,
      waveform_data: post_type === 'voice' ? waveform_data : null,
      duration_seconds: post_type === 'voice' ? duration_seconds : null,
      is_anon,
      category_id: category_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: post }, { status: 201 });
}
