'use client';

import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '@/components/AuroraBackground';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { Camera, Lock, Unlock, Zap, Flame, Play, Pause, Volume2, Mic, MessageCircle, Ghost } from 'lucide-react';
import Link from 'next/link';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  isUnlocked?: boolean; // Added control for parents
}

function getCategoryStyle(colorHex: string) {
  return {
    backgroundColor: `${colorHex}10`,
    borderColor: `${colorHex}25`,
    color: colorHex,
  };
}

export default function PostCard({ post, onClick, onDelete, isUnlocked: externalUnlocked }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [internalUnlocked, setInternalUnlocked] = useState(false);
  const isUnlocked = externalUnlocked ?? internalUnlocked;
  
  const [isBurnt, setIsBurnt] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Playback failed', err);
        setIsPlaying(false);
      });
    }
  };

  const handleEngagement = (e: React.MouseEvent, type: 'like' | 'dislike') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'like') {
      setIsLiked(!isLiked);
      if (isDisliked) setIsDisliked(false);
    } else {
      setIsDisliked(!isDisliked);
      if (isLiked) setIsLiked(false);
    }
  };

  const handleArchiveDeletion = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to incinerate this confession? It will be purged from the archive forever.')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete?.(post.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
       const updateProgress = () => {
          if (audioRef.current) {
            setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
          }
       };
       const node = audioRef.current;
       node.addEventListener('timeupdate', updateProgress);
       node.addEventListener('play', () => setIsPlaying(true));
       node.addEventListener('pause', () => setIsPlaying(false));
       node.addEventListener('ended', () => {
          setIsPlaying(false);
          setProgress(0);
       });
       return () => {
          node.removeEventListener('timeupdate', updateProgress);
          node.removeEventListener('play', () => setIsPlaying(true));
          node.removeEventListener('pause', () => setIsPlaying(false));
          node.removeEventListener('ended', () => {
             setIsPlaying(false);
             setProgress(0);
          });
       };
    }
  }, []);

  const STORAGE_URL = `https://rqjypyuifvezjtdxkaxn.supabase.co/storage/v1/object/public/voice-posts/`;
  const voiceSrc = post.voice_url ? (post.voice_url.startsWith('http') || post.voice_url.startsWith('blob:') ? post.voice_url : `${STORAGE_URL}${post.voice_url}`) : '';

  const displayName = post.is_anon
    ? post.alias || 'Anonymous'
    : post.user?.display_name || post.user?.username || 'Unknown';

  const timeAgo = post.created_at 
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : 'just now';

  // Digital Snapshot Effect
  const handleSnapshot = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    if (isUnlocked) return; // Already unlocked

    setIsCapturing(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/unlock`, { method: 'POST' });
      const json = await res.json();
      
      // Simulate physical capture delay
      setTimeout(() => {
        setIsCapturing(false);
        
        if (json.action === 'burnt') {
          setIsBurnt(true);
        } else {
          setInternalUnlocked(true);
        }
      }, 150);

    } catch (err) {
      setIsCapturing(false);
    }
  };

  if (isBurnt) {
    return (
      <motion.div
        initial={{ opacity: 1, filter: 'blur(0px)' }}
        animate={{ opacity: 0, filter: 'blur(30px)' }}
        transition={{ duration: 1.5 }}
        className="w-full h-32 flex flex-col items-center justify-center border border-[#ff535b]/30 rounded-[24px] bg-[#1a0c0c] p-6 text-center"
      >
        <Flame className="text-[#ff535b] mb-2 animate-bounce" size={24} />
        <p className="font-syne font-bold text-[#ff535b] text-[12px] uppercase tracking-widest">
          This soul was too heavy. It has been reduced to ashes. (BURNT)
        </p>
      </motion.div>
    );
  }

  return (
    <Link href={`/posts/${post.id}`} className={cn("block", isUnlocked && "pointer-events-none")}>
      <motion.article
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative cursor-pointer overflow-hidden transition-all duration-500",
          "bg-[#151515] border border-white/5 hover:border-[#ff535b]/30",
          "rounded-[20px] md:rounded-[24px] p-5 md:p-6 self-stretch shadow-2xl",
          isCapturing && "brightness-150 scale-[1.02]",
          isUnlocked && "cursor-default border-[#ff535b]/10"
        )}
      >
        {/* Premium Aurora Background on Hover */}
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <AuroraBackground />
        </div>

        {/* Action Bar Overlay when unlocked to prevent navigation but allow interaction */}
        {isUnlocked && <div className="absolute inset-0 z-10 pointer-events-auto" onClick={(e) => e.stopPropagation()} />}

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover" />

        {/* Shutter Flash Overlay */}
        <AnimatePresence>
          {isCapturing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white"
            />
          )}
        </AnimatePresence>

        <div className="relative z-20">
          {/* Author header */}
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
               {post.is_mine && (
                  <button 
                    onClick={handleArchiveDeletion}
                    className="p-1 px-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 font-syne font-bold text-[8px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all pointer-events-auto"
                  >
                    Incinerate
                  </button>
               )}
            </div>
          </div>

          {/* Content Section with Premium Typography */}
          {post.post_type === 'text' && post.content && (
            <p className="font-dm-serif text-[17px] md:text-[20px] lg:text-[22px] text-[#e5e2e1] leading-[1.5] md:leading-[1.6] mb-6 md:mb-8 italic selection:bg-[#ff535b]/30 pointer-events-none">
              &ldquo;{post.content}&rdquo;
            </p>
          )}

          {/* Voice UI Overhaul */}
          {post.post_type === 'voice' && (
            <div className="relative group/voice mb-6 md:mb-8 pointer-events-auto">
              <audio ref={audioRef} src={voiceSrc} preload="metadata" />
              <div className="flex items-center gap-4 p-4 md:p-5 rounded-2xl md:rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl relative overflow-hidden transition-all group-hover/voice:border-[#ff535b]/20">
                {/* Visual Progress Background */}
                <motion.div 
                   className="absolute inset-0 bg-[#ff535b]/5 z-0" 
                   style={{ 
                     width: `${progress}%`,
                     transformOrigin: 'left' 
                   }}
                />

                <button 
                  onClick={togglePlay}
                  className="relative z-10 w-10 h-10 md:w-11 md:h-11 rounded-full md:rounded-xl bg-[#ff535b] flex items-center justify-center text-white shadow-lg shadow-[#ff535b]/20 hover:scale-105 active:scale-95 transition-all outline-none"
                >
                  {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-1" fill="currentColor" />}
                </button>

                <div className="flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mic className="w-3 h-3 text-[#ff535b]" />
                      <span className="font-syne font-extrabold text-[9px] text-[#4A4A4A] uppercase tracking-widest leading-none">Voice Archive</span>
                    </div>
                    <span className="font-mono text-[9px] text-[#6B6B6B] tracking-tighter">
                      {isPlaying ? `0:${String(Math.floor(audioRef.current?.currentTime || 0)).padStart(2, '0')}` : `0:${String(Math.floor(post.duration_seconds || 0)).padStart(2, '0')}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 h-4 md:h-5">
                    {(post.waveform_data || Array.from({ length: 40 }, () => 0.2 + Math.random() * 0.8)).slice(0, 40).map((v, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-full"
                        animate={{ 
                          height: isPlaying ? [`${v * 100}%`, `${v * 120}%`, `${v * 100}%`] : `${v * 100}%`,
                          backgroundColor: (i / 40) * 100 <= progress ? '#ff535b' : 'rgba(255,255,255,0.1)'
                        }}
                        transition={{ 
                           duration: 1, 
                           repeat: isPlaying ? Infinity : 0, 
                           delay: i * 0.02,
                        }}
                        style={{
                          minHeight: '2px',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Bar */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex gap-2 md:gap-4 items-center">
              {/* Soul (Like) */}
              <button 
                onClick={(e) => handleEngagement(e, 'like')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-syne font-bold outline-none",
                  isLiked ? "bg-[#ff535b]/10 text-[#ff535b]" : "bg-white/5 text-[#4A4A4A] hover:text-[#ff535b]"
                )}
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center">
                   <motion.div whileTap={{ scale: 1.4 }}>
                     <Flame size={14} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
                   </motion.div>
                </div>
                <span className="text-[12px] uppercase tracking-widest leading-none">
                  {(post.likes_count || 0) + (isLiked ? 1 : 0)}
                </span>
              </button>

              {/* Burial (Dislike) */}
              <button 
                onClick={(e) => handleEngagement(e, 'dislike')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-syne font-bold outline-none",
                  isDisliked ? "bg-[#ff535b]/10 text-[#ff535b]" : "bg-white/5 text-[#4A4A4A] hover:text-[#6B6B6B]"
                )}
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center">
                   <motion.div whileTap={{ scale: 1.4 }}>
                     <Ghost size={14} fill={isDisliked ? "currentColor" : "none"} strokeWidth={2.5} />
                   </motion.div>
                </div>
                <span className="text-[12px] uppercase tracking-widest leading-none">
                  {(post.dislikes_count || 0) + (isDisliked ? 1 : 0)}
                </span>
              </button>
              
              {/* Echo (Replies) */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-[#4A4A4A] font-syne font-bold group/stat">
                 <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/stat:text-blue-400 transition-colors">
                    <MessageCircle size={14} strokeWidth={2.5} />
                 </div>
                 <span className="text-[12px] uppercase tracking-widest leading-none">{post.reply_count || 0}</span>
              </div>
            </div>

            <button
               onClick={handleSnapshot}
               className={cn(
                 "flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 rounded-full transition-all duration-300 font-syne font-extrabold uppercase tracking-widest outline-none shadow-lg",
                 isUnlocked 
                    ? "bg-[#ff535b] text-white shadow-[#ff535b]/30" 
                    : "bg-[#1c1b1b] text-[#6B6B6B] border border-white/5 hover:bg-white/5 hover:text-white"
               )}
               style={{ fontSize: '9px' }}
            >
              {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
              <span className="hidden sm:inline">{isUnlocked ? "Unlocked" : "Snapshot"}</span>
            </button>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
