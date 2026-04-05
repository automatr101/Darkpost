import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { applyRateLimit } from '@/lib/rate-limit';

const postSchema = z.object({
  post_type: z.enum(['text', 'voice']),
  content: z.string().min(10).max(280).optional(),
  is_anon: z.boolean().default(true),
  category_id: z.string().uuid().nullable().optional(),
  voice_url: z.string().optional(),
  waveform_data: z.array(z.number()).optional(),
  duration_seconds: z.number().int().optional(),
});

function containsBlockedContent(text: string): boolean {
  const blockedTerms = ['badword1', 'badword2']; // Example terms
  return blockedTerms.some(term => text.toLowerCase().includes(term));
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Rate limiting (5 posts per minute per IP)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = applyRateLimit(`post_create_${ip}`, 5, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Ensure public.users row exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: `Profile check failed: ${profileError.message}` }, { status: 500 });
    }

    if (!profile) {
      const { error: insertProfileError } = await supabase
        .from('users')
        .insert({ 
          id: user.id, 
          username: `user${Math.floor(Math.random() * 9000 + 1000)}` 
        });
      
      if (insertProfileError) {
        console.error('Profile insert error:', insertProfileError);
        return NextResponse.json({ error: `Failed to initialize user profile: ${insertProfileError.message}` }, { status: 500 });
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const validated = postSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    let { content } = validated.data;
    const { is_anon, category_id, post_type, voice_url, waveform_data, duration_seconds } = validated.data;

    if (post_type === 'text' && content) {
      content = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      if (containsBlockedContent(content)) {
        return NextResponse.json({ error: 'This post contains content that violates our guidelines.' }, { status: 400 });
      }
    }

    // Final Post Insert
    const { error: insertError } = await supabase
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
      });

    if (insertError) {
      console.error('Post insert error:', insertError);
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Confession posted.' }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected post error:', errorMessage);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
