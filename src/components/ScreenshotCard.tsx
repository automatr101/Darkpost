'use client';

import type { Post } from '@/lib/types';

interface ScreenshotCardProps {
  post: Post;
}

/**
 * ScreenshotCard — rendered by html2canvas as a shareable JPEG.
 * ALL styles MUST be inline. No Tailwind classes.
 * html2canvas does NOT reliably render Tailwind.
 */
export default function ScreenshotCard({ post }: ScreenshotCardProps) {
  const displayName = post.is_anon
    ? post.alias || 'Anonymous'
    : post.user?.display_name || post.user?.username || 'Unknown';

  return (
    <div
      data-screenshot-target="true"
      style={{
        width: '1080px',
        height: '1080px',
        backgroundColor: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '900px',
          backgroundColor: '#111111',
          border: '1px solid #242424',
          borderRadius: '16px',
          padding: '40px',
          position: 'relative',
        }}
      >
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#2a2a2a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            {post.post_type === 'voice' ? '🎙' : '👻'}
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#F0ECE3' }}>
              {post.post_type === 'voice' && post.is_anon ? `🎙 ${displayName}` : displayName}
            </div>
            <div style={{ fontSize: '14px', color: '#6B6B6B' }}>via Darkpost</div>
          </div>
        </div>

        {/* Confession text */}
        {post.post_type === 'text' && post.content && (
          <div
            style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: '32px',
              color: '#F0ECE3',
              lineHeight: '1.4',
              textAlign: 'center',
              padding: '20px 0 32px',
            }}
          >
            &ldquo;{post.content}&rdquo;
          </div>
        )}

        {/* Voice waveform for voice posts */}
        {post.post_type === 'voice' && (
          <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
            <div style={{ fontSize: '16px', color: '#6B6B6B', marginBottom: '16px' }}>
              🎙 Voice Confession
            </div>
            <svg width="820" height="60" viewBox="0 0 820 60" style={{ display: 'block', margin: '0 auto' }}>
              {(post.waveform_data || Array.from({ length: 100 }, () => Math.random())).map((v, i) => (
                <rect
                  key={i}
                  x={i * 8.2}
                  y={30 - (v as number) * 25}
                  width="3"
                  height={(v as number) * 50}
                  rx="2"
                  fill="#E63946"
                />
              ))}
            </svg>
            <div style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px' }}>
              0:{String(post.duration_seconds || 0).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Category pill */}
        {post.category && (
          <div style={{ marginTop: '8px' }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '100px',
                backgroundColor: `${post.category.color_hex}15`,
                border: `1px solid ${post.category.color_hex}30`,
                color: `${post.category.color_hex}cc`,
              }}
            >
              {post.category.label}
            </span>
          </div>
        )}

        {/* Watermark — always inside the target element */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            fontFamily: 'Syne, sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            color: '#E63946',
          }}
        >
          darkpost.app
        </div>
      </div>
    </div>
  );
}
