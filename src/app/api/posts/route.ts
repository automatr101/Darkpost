import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { containsBlockedContent } from '@/lib/moderation';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { applyRateLimit } from '@/lib/rate-limit';

const postSchema = z.object({
  content: z.string().min(10, 'Confession must be at least 10 characters.').max(280, 'Confession must be 280 characters or fewer.').optional().nullable(),
  is_anon: z.boolean().default(true),
  category_id: z.string().uuid().optional().nullable(),
  post_type: z.enum(['text', 'voice']).default('text'),
  voice_url: z.string().url().optional().nullable(),
  waveform_data: z.array(z.number()).optional().nullable(),
  duration_seconds: z.number().max(30, 'Voice posts must be 30 seconds or shorter.').optional().nullable(),
}).refine(data => {
  if (data.post_type === 'text') return !!data.content;
  if (data.post_type === 'voice') return !!data.voice_url && !!data.waveform_data;
  return false;
}, { message: "Invalid payload for selected post_type" });

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

  // Rate limiting (5 posts per minute per IP)
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = applyRateLimit(`post_create_${ip}`, 5, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
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
    // Strict HTML sanitization
    content = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    // Content moderation
    if (containsBlockedContent(content)) {
      return NextResponse.json({ error: 'This post contains content that violates our guidelines.' }, { status: 400 });
    }
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
