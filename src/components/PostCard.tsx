'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '@/components/AuroraBackground';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { Zap, Flame, Play, Pause, Mic, MessageCircle, Bookmark, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  currentUser?: User | null;
}

function getCategoryStyle(colorHex: string) {
  return {
    backgroundColor: `${colorHex}10`,
    borderColor: `${colorHex}25`,
    color: colorHex,
  };
}

const STORAGE_URL = `https://rqjypyuifvezjtdxkaxn.supabase.co/storage/v1/object/public/voice-posts/`;

export default function PostCard({ post, onDelete, currentUser }: PostCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isBookmarked, setIsBookmarked] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = JSON.parse(localStorage.getItem('dp_bookmarks') || '[]');
    return saved.includes(post.id);
  });
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Use a callback ref so listeners are attached as soon as the element mounts
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setAudioRef = useCallback((node: HTMLAudioElement | null) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = node;
    if (!node) return;

    const onTimeUpdate = () => {
      setProgress((node.currentTime / (node.duration || 1)) * 100);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };

    node.addEventListener('timeupdate', onTimeUpdate);
    node.addEventListener('play', onPlay);
    node.addEventListener('pause', onPause);
    node.addEventListener('ended', onEnded);
  }, []);

  const voiceSrc = post.voice_url
    ? (post.voice_url.startsWith('http') || post.voice_url.startsWith('blob:')
      ? post.voice_url
      : `${STORAGE_URL}${post.voice_url}`)
    : '';

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Auth gate: only logged-in users can play voice
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) { router.push('/login'); return; }
    const action = isLiked ? 'unlike' : 'like';
    setIsLiked(!isLiked);
    setLikeCount((c) => action === 'like' ? c + 1 : Math.max(0, c - 1));
    await fetch(`/api/posts/${post.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const saved: string[] = JSON.parse(localStorage.getItem('dp_bookmarks') || '[]');
    if (isBookmarked) {
      localStorage.setItem('dp_bookmarks', JSON.stringify(saved.filter((id) => id !== post.id)));
    } else {
      saved.push(post.id);
      localStorage.setItem('dp_bookmarks', JSON.stringify(saved));
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/posts/${post.id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleArchiveDeletion = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete?.(post.id);
      } else {
        const json = await res.json().catch(() => ({}));
        console.error('Delete failed:', json.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };



  const displayName = post.is_anon
    ? post.alias || 'Anonymous'
    : post.user?.display_name || post.user?.username || 'Unknown';

  const timeAgo = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : 'just now';



  return (
    <Link href={`/posts/${post.id}`} className="block">
      <motion.article
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group relative cursor-pointer overflow-hidden transition-all duration-500',
          'bg-[#151515] border border-white/5 hover:border-[#ff535b]/30',
          'rounded-[20px] md:rounded-[24px] p-5 md:p-6 self-stretch shadow-2xl',
          isHovered && 'shadow-[0_0_40px_rgba(255,83,91,0.05)]',
          isDeleting && 'opacity-50 pointer-events-none'
        )}
      >
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <AuroraBackground />
        </div>



        <div className="relative z-20">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 md:mb-6 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-[#1c1b1b] flex items-center justify-center text-sm md:text-lg border border-white/5 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  {post.is_anon ? '👻' : '👤'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-green-500 border-2 border-[#151515] rounded-full" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-[#F0ECE3] text-[13px] md:text-[14px] flex items-center gap-2">
                  {post.post_type === 'voice' && post.is_anon ? `🎙 ${displayName}` : displayName}
                  {post.is_anon && <Zap size={10} className="text-[#ff535b]" />}
                </h3>
                <p className="font-inter text-[#4A4A4A] text-[10px] md:text-[11px] uppercase tracking-tighter">
                  {timeAgo} • ARCHIVE
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {post.category && (
                <span
                  className="font-syne font-extrabold uppercase text-[8px] md:text-[9px] tracking-widest px-2 md:px-3 py-1 md:py-1.5 rounded-lg border backdrop-blur-md"
                  style={getCategoryStyle(post.category.color_hex)}
                >
                  {post.category.label}
                </span>
              )}
              {/* is_mine is set by FeedClient; for anon posts the server preserves it */}
              {post.is_mine && (
                <button
                  onClick={handleArchiveDeletion}
                  className="p-1 px-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 font-syne font-bold text-[8px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all pointer-events-auto"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Text content */}
          {post.post_type === 'text' && post.content && (
            <p className="font-dm-serif text-[17px] md:text-[20px] lg:text-[22px] text-[#e5e2e1] leading-[1.5] md:leading-[1.6] mb-6 md:mb-8 italic selection:bg-[#ff535b]/30 pointer-events-none">
              &ldquo;{post.content}&rdquo;
            </p>
          )}

          {/* Voice player */}
          {post.post_type === 'voice' && (
            <div className="relative group/voice mb-6 md:mb-8 pointer-events-auto">
              <audio ref={setAudioRef} src={voiceSrc} preload="metadata" />
              <div className="flex items-center gap-4 p-4 md:p-5 rounded-2xl md:rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl relative overflow-hidden transition-all group-hover/voice:border-[#ff535b]/20">
                {/* Progress fill */}
                <motion.div
                  className="absolute inset-0 bg-[#ff535b]/5 z-0"
                  style={{ width: `${progress}%`, transformOrigin: 'left' }}
                />

                <button
                  onClick={togglePlay}
                  className="relative z-10 w-10 h-10 md:w-11 md:h-11 rounded-full md:rounded-xl bg-[#ff535b] flex items-center justify-center text-white shadow-lg shadow-[#ff535b]/20 hover:scale-105 active:scale-95 transition-all outline-none"
                  title={currentUser ? (isPlaying ? 'Pause' : 'Play') : 'Login to listen'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-1" fill="currentColor" />}
                </button>

                <div className="flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mic className="w-3 h-3 text-[#ff535b]" />
                      <span className="font-syne font-extrabold text-[9px] text-[#4A4A4A] uppercase tracking-widest leading-none">
                        {currentUser ? 'Voice Archive' : '🔒 Login to Listen'}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-[#6B6B6B] tracking-tighter">
                      {isPlaying
                        ? `0:${String(Math.floor(audioRef.current?.currentTime || 0)).padStart(2, '0')}`
                        : `0:${String(Math.floor(post.duration_seconds || 0)).padStart(2, '0')}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 h-4 md:h-5">
                    {(post.waveform_data || Array.from({ length: 40 }, () => 0.2 + Math.random() * 0.8))
                      .slice(0, 40)
                      .map((v, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-full"
                          animate={{
                            height: isPlaying ? [`${v * 100}%`, `${v * 120}%`, `${v * 100}%`] : `${v * 100}%`,
                            backgroundColor: (i / 40) * 100 <= progress ? '#ff535b' : 'rgba(255,255,255,0.1)',
                          }}
                          transition={{
                            duration: 1,
                            repeat: isPlaying ? Infinity : 0,
                            delay: i * 0.02,
                          }}
                          style={{ minHeight: '2px' }}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Bar — 4 functional CTAs */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex gap-1.5 md:gap-2 items-center">

              {/* 🔥 Like — persists to DB */}
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-syne font-bold outline-none',
                  isLiked ? 'bg-[#ff535b]/10 text-[#ff535b]' : 'bg-white/5 text-[#4A4A4A] hover:text-[#ff535b] hover:bg-[#ff535b]/5'
                )}
              >
                <motion.div whileTap={{ scale: 1.4 }}>
                  <Flame size={15} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} />
                </motion.div>
                <span className="text-[11px] uppercase tracking-widest leading-none">{likeCount}</span>
              </button>

              {/* 🔖 Bookmark — localStorage */}
              <button
                onClick={handleBookmark}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-syne font-bold outline-none',
                  isBookmarked ? 'bg-[#fbbf24]/10 text-[#fbbf24]' : 'bg-white/5 text-[#4A4A4A] hover:text-[#fbbf24] hover:bg-[#fbbf24]/5'
                )}
              >
                <motion.div whileTap={{ scale: 1.2 }}>
                  <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} strokeWidth={2} />
                </motion.div>
              </button>

              {/* 💬 Comments — links to post detail */}
              <Link
                href={`/posts/${post.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-[#4A4A4A] hover:text-blue-400 hover:bg-blue-400/5 font-syne font-bold transition-all"
              >
                <MessageCircle size={15} strokeWidth={2} />
                <span className="text-[11px] uppercase tracking-widest leading-none">{post.reply_count || 0}</span>
              </Link>

            </div>

            {/* 🔗 Share — copies link, shows toast */}
            <button
              onClick={handleShare}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-syne font-bold text-[10px] uppercase tracking-widest outline-none border',
                copied
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-white/5 text-[#4A4A4A] border-white/5 hover:bg-white/10 hover:text-white'
              )}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check size={13} strokeWidth={3} />
                    <span className="hidden sm:inline">Copied!</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="share"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Share2 size={13} strokeWidth={2} />
                    <span className="hidden sm:inline">Share</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
