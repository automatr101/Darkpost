'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '@/components/AuroraBackground';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { Zap, Flame, Play, Pause, Mic, MessageCircle, Bookmark, Share2, Check, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  currentUser?: User | null;
}

const STORAGE_URL = `https://rqjypyuifvezjtdxkaxn.supabase.co/storage/v1/object/public/voice-posts/`;

export default function PostCard({ post, onClick, onDelete, currentUser }: PostCardProps) {
  const router = useRouter();
  
  // Interactive states
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  
  // Data states
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isBookmarked, setIsBookmarked] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = JSON.parse(localStorage.getItem('dp_bookmarks') || '[]');
    return saved.includes(post.id);
  });
  const [copied, setCopied] = useState(false);
  
  // Deletion flow state
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'confirm' | 'deleting'>('idle');

  // Audio setup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setAudioRef = useCallback((node: HTMLAudioElement | null) => {
    if (audioRef.current) audioRef.current.pause();
    
    audioRef.current = node;
    if (!node) return;

    node.addEventListener('timeupdate', () => setProgress((node.currentTime / (node.duration || 1)) * 100));
    node.addEventListener('play', () => setIsPlaying(true));
    node.addEventListener('pause', () => setIsPlaying(false));
    node.addEventListener('ended', () => { setIsPlaying(false); setProgress(0); });
  }, []);

  const voiceSrc = post.voice_url
    ? (post.voice_url.startsWith('http') || post.voice_url.startsWith('blob:')
      ? post.voice_url
      : `${STORAGE_URL}${post.voice_url}`)
    : '';

  // --- Handlers ---
  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return router.push('/login');
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
    if (!currentUser) return router.push('/login');
    
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
    if (navigator.share) {
      try { await navigator.share({ title: 'Darkpost', text: 'Listen to this echo', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Delete Flow ---
  const initiateDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteStatus('confirm');
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteStatus('idle');
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDeleteStatus('deleting');
    setIsHidden(true); // Optimistic exit

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE', headers: { 'Cache-Control': 'no-cache' }});
      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        onDelete?.(post.id);
      } else {
        setIsHidden(false);
        setDeleteStatus('idle');
        alert(`Failed to incinerate mapping: ${result.error || 'Server Context Error'}`);
      }
    } catch {
      setIsHidden(false);
      setDeleteStatus('idle');
      alert('Network disruption during incineration.');
    }
  };

  // --- Render details ---
  const displayName = post.is_anon ? post.alias || 'Anonymous' : post.user?.display_name || post.user?.username || 'Unknown';
  const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'just now';

  return (
    <AnimatePresence mode="popLayout">
      {!isHidden && (
        <Link href={`/posts/${post.id}`} className="block outline-none" onClick={onClick}>
          <motion.article
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(8px)', transition: { duration: 0.3 } }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'group relative overflow-hidden transition-all duration-500',
              'bg-[#101010] border border-white/5 hover:border-primary-red/30',
              'rounded-[24px] p-5 md:p-7 shadow-2xl flex flex-col',
              isHovered && 'shadow-[0_0_50px_rgba(255,83,91,0.06)]'
            )}
          >
            {/* Ambient Base Effect */}
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <AuroraBackground />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Top Header */}
              <div className="flex items-start justify-between mb-5 pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#1c1b1b] flex items-center justify-center text-lg md:text-xl border border-white/10 group-hover:rotate-6 transition-transform duration-300 shadow-inner">
                      {post.is_anon ? '👻' : '👤'}
                    </div>
                    {post.is_anon && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#101010] rounded-full shadow-sm" />}
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-[#F0ECE3] text-[14px] md:text-[15px] flex items-center gap-2">
                      {post.post_type === 'voice' && post.is_anon ? `🎙 ${displayName}` : displayName}
                      {post.is_anon && <Zap size={10} className="text-primary-red drop-shadow-md" />}
                    </h3>
                    <p className="font-inter text-[#6B6B6B] text-[10px] md:text-[11px] uppercase tracking-[0.15em] mt-0.5">
                      {timeAgo}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                  {post.category && (
                    <span
                      className="font-syne font-extrabold uppercase text-[8px] md:text-[9px] tracking-widest px-2.5 py-1 rounded-lg border backdrop-blur-md"
                      style={{ backgroundColor: `${post.category.color_hex}15`, borderColor: `${post.category.color_hex}30`, color: post.category.color_hex }}
                    >
                      {post.category.label}
                    </span>
                  )}
                  {/* Delete / Inline Confirmation UI */}
                  {post.is_mine && (
                    <AnimatePresence mode="wait">
                      {deleteStatus === 'idle' ? (
                        <motion.button
                          key="idle"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={initiateDelete}
                          className="p-1.5 md:p-2 rounded-lg bg-white/5 text-[#888] hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                          title="Delete Post"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </motion.button>
                      ) : deleteStatus === 'confirm' ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded-lg p-1 backdrop-blur-md shadow-lg"
                        >
                          <button onClick={confirmDelete} className="px-3 py-1 bg-red-500 text-white font-syne font-bold text-[9px] rounded uppercase tracking-wider hover:bg-red-600 transition-colors">
                            Confirm
                          </button>
                          <button onClick={cancelDelete} className="p-1 text-red-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                            <X size={12} strokeWidth={3} />
                          </button>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Payload: Text */}
              {post.post_type === 'text' && post.content && (
                <div className="flex-1 pointer-events-none">
                  <p className="font-dm-serif text-[18px] md:text-[23px] text-[#E0E0E0] md:text-[#ECECEC] leading-relaxed mb-6 italic selection:bg-primary-red/30">
                    &ldquo;{post.content}&rdquo;
                  </p>
                </div>
              )}

              {/* Payload: Voice */}
              {post.post_type === 'voice' && (
                <div className="relative group/voice mb-6 mt-auto pointer-events-auto">
                  <audio ref={setAudioRef} src={voiceSrc} preload="metadata" />
                  <div className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-[20px] bg-black/50 border border-white/5 backdrop-blur-xl overflow-hidden transition-all group-hover/voice:border-primary-red/30 group-hover/voice:shadow-lg">
                    {/* Progress Background */}
                    <motion.div className="absolute inset-0 bg-primary-red/10 z-0" style={{ width: `${progress}%`, originX: 0 }} />

                    <button
                      onClick={togglePlay}
                      className="relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full md:rounded-[14px] bg-primary-red flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,83,91,0.4)] hover:scale-105 active:scale-95 transition-transform outline-none"
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-0.5" fill="currentColor" />}
                    </button>

                    <div className="flex-1 relative z-10">
                      <div className="flex justify-between items-center mb-1.5 md:mb-2">
                        <span className="font-syne font-extrabold text-[9px] md:text-[10px] text-[#A0A0A0] uppercase tracking-[0.2em]">
                          {currentUser ? 'Encrypted Audio' : '🔒 Login Required'}
                        </span>
                        <span className="font-mono text-[10px] text-[#555] tracking-tight">
                          {isPlaying ? `0:${String(Math.floor(audioRef.current?.currentTime || 0)).padStart(2, '0')}` : `0:${String(Math.floor(post.duration_seconds || 0)).padStart(2, '0')}`}
                        </span>
                      </div>
                      
                      <div className="flex items-end gap-0.5 md:gap-1 h-5 md:h-6">
                        {(post.waveform_data || Array.from({ length: 36 }, () => 0.2 + Math.random() * 0.8)).slice(0, 36).map((v, i) => (
                           <motion.div
                             key={i}
                             className="flex-1 rounded-full origin-bottom"
                             animate={{ 
                               height: isPlaying ? [`${v * 80}%`, `${v * 110}%`, `${v * 80}%`] : `${v * 100}%`,
                               backgroundColor: (i / 36) * 100 <= progress ? '#ff535b' : '#333'
                             }}
                             transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, delay: i * 0.02, ease: "easeInOut" }}
                             style={{ minHeight: '3px' }}
                           />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/5 pointer-events-auto">
                <div className="flex gap-1 md:gap-2 mt-3">
                  <button onClick={handleLike} className={cn('flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-all font-syne font-bold text-[11px] md:text-[12px] outline-none', isLiked ? 'bg-primary-red/10 text-primary-red' : 'bg-[#1a1a1a] text-[#7A7A7A] hover:text-primary-red hover:bg-[#1f1a1a]')}>
                    <motion.div whileTap={{ scale: 1.3 }}><Flame size={14} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2.5} /></motion.div>
                    <span>{likeCount}</span>
                  </button>
                  
                  <button onClick={handleBookmark} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all outline-none', isBookmarked ? 'bg-amber-500/10 text-amber-500' : 'bg-[#1a1a1a] text-[#7A7A7A] hover:text-amber-500 hover:bg-[#1f1f1a]')}>
                    <motion.div whileTap={{ scale: 1.2 }}><Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} strokeWidth={2} /></motion.div>
                  </button>

                  <Link href={`/posts/${post.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1a1a] text-[#7A7A7A] hover:text-blue-400 hover:bg-blue-400/10 font-syne font-bold outline-none transition-colors">
                    <MessageCircle size={14} strokeWidth={2.5} />
                    <span className="text-[11px] md:text-[12px]">{post.reply_count || 0}</span>
                  </Link>
                </div>

                <button onClick={handleShare} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] text-[#888] hover:text-white hover:bg-white/10 transition-all font-syne font-bold text-[10px] uppercase tracking-widest outline-none">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5 text-green-400"><Check size={14} strokeWidth={3} /><span className="hidden sm:inline">Copied!</span></motion.span>
                    ) : (
                      <motion.span key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5"><Share2 size={13} strokeWidth={2} /><span className="hidden sm:inline">Share</span></motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </motion.article>
        </Link>
      )}
    </AnimatePresence>
  );
}
