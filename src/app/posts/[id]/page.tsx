import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import PostDetailClient from './PostDetailClient';

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const supabase = createClient();
  const { data: post } = await supabase
    .from('posts')
    .select('*, user:users(display_name, username)')
    .eq('id', params.id)
    .single();

  if (!post) {
    return {
      title: 'Post Not Found | Darkpost',
    };
  }

  const isVoice = post.post_type === 'voice';
  const authorName = post.is_anon 
    ? (post.alias || 'Anonymous') 
    : (post.user?.display_name || post.user?.username || 'Unknown');

  const titlePrefix = isVoice ? '🎙 Voice Echo from' : 'Echo from';
  const title = `${titlePrefix} ${authorName} | Darkpost`;

  const description = post.content 
    ? `"${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}"`
    : `Listen to a securely encrypted voice note from ${authorName} on Darkpost.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://darkpost.vercel.app/posts/${params.id}`,
      siteName: 'Darkpost',
      images: [
        {
          url: 'https://darkpost.vercel.app/og-default.jpg', // You can replace this with a dynamic `/api/og` endpoint in the future
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  return <PostDetailClient params={params} />;
}
