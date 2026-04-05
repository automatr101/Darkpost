'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Flag, 
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  Flame,
  MoreHorizontal,
  X,
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import type { Post, Reply } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isBurnt, setIsBurnt] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<{ username?: string; display_name?: string } | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function getPostData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        // fetch profile
        const { data: profile } = await supabase
          .from('users')
          .select('username, display_name')
          .eq('id', session.user.id)
          .single();
        if (profile) setCurrentProfile(profile);
      }

      const { data: postData } = await supabase
        .from('posts')
        .select('*, category:categories(*), user:users(*)')
        .eq('id', params.id)
        .single();
      
      if (!postData) {
        setIsBurnt(true);
        setLoading(false);
        return;
      }

      const isMine = postData.user_id === session?.user?.id;
      setPost({ ...postData, is_mine: isMine });
      setLikeCount(postData.likes_count ?? 0);
      
      // Check bookmarks in localStorage
      const bookmarks = JSON.parse(localStorage.getItem('dp_bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(params.id));

      // Load replies (open to all logged-in users)
      if (session?.user) {
        fetchReplies();
      }
      
      setLoading(false);
    }
    
    getPostData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchReplies = async () => {
    const res = await fetch(`/api/posts/${params.id}/replies`);
    if (res.ok) {
      const { data } = await res.json();
      setReplies(data || []);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || submitting || !currentUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${params.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setReplies((prev) => [...prev, data]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const action = isLiked ? 'unlike' : 'like';
    setIsLiked(!isLiked);
    setLikeCount((c) => action === 'like' ? c + 1 : Math.max(0, c - 1));
    await fetch(`/api/posts/${params.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${params.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('dp_bookmarks') || '[]');
    if (isBookmarked) {
      const updated = bookmarks.filter((id: string) => id !== params.id);
      localStorage.setItem('dp_bookmarks', JSON.stringify(updated));
    } else {
      bookmarks.push(params.id);
      localStorage.setItem('dp_bookmarks', JSON.stringify(bookmarks));
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res = await fetch(`/api/posts/${params.id}/replies?replyId=${replyId}`, { method: 'DELETE' });
      if (res.ok) {
        setReplies((prev) => prev.filter(r => r.id !== replyId));
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#ff535b]/30 border-t-[#ff535b] rounded-full animate-spin" />
          <p className="font-inter text-[#4A4A4A] text-sm">Loading post...</p>
        </div>
      </div>
    );
  }

  if (isBurnt || !post) {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center p-6 text-center">
        <Flame size={64} className="text-[#ff535b] mb-6 animate-bounce" />
        <h1 className="font-syne font-extrabold text-3xl mb-4 text-[#ff535b] uppercase tracking-tighter">Post not found</h1>
        <p className="font-inter text-[#6B6B6B] max-w-sm">This post has been deleted or does not exist.</p>
        <Link href="/" className="mt-8 px-8 py-3 rounded-full bg-white/5 border border-white/5 font-syne font-bold text-sm uppercase">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#F0ECE3] pb-32 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#131313]/90 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-syne font-bold text-base uppercase tracking-tight">Post</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-white/5 rounded-full"><Flag size={16} className="text-[#4A4A4A]" /></button>
          <button className="p-2 hover:bg-white/5 rounded-full"><MoreHorizontal size={16} className="text-[#4A4A4A]" /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Post Card */}
        <div className="px-4 py-4 border-b border-white/5">
          <PostCard
            post={post}
            currentUser={currentUser}
            onDelete={() => { window.location.href = '/'; }}
          />
        </div>

        {/* Twitter-style Action Bar */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          {/* Comments count */}
          <button
            onClick={() => inputRef.current?.focus()}
            className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1d9bf0] transition-colors group"
          >
            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle size={20} />
            </div>
            <span className="font-inter text-sm">{replies.length}</span>
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-[#ff535b]' : 'text-[#6B6B6B] hover:text-[#ff535b]'}`}
          >
            <div className="p-2 rounded-full group-hover:bg-[#ff535b]/10 transition-colors">
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            </div>
            <span className="font-inter text-sm">{likeCount}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 transition-colors group ${isBookmarked ? 'text-[#fbbf24]' : 'text-[#6B6B6B] hover:text-[#fbbf24]'}`}
          >
            <div className="p-2 rounded-full group-hover:bg-[#fbbf24]/10 transition-colors">
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
            </div>
          </button>

          {/* Share / Copy Link */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-[#6B6B6B] hover:text-green-400 transition-colors group"
          >
            <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
              <Share2 size={20} />
            </div>
            <AnimatePresence mode="wait">
              {copied && (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-inter text-xs text-green-400"
                >
                  Copied!
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Comment Input (Twitter-style) */}
        {currentUser ? (
          <div className="px-4 py-3 border-b border-white/5 flex items-start gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff535b] to-[#1c1b1b] flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(currentProfile?.display_name || currentProfile?.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <input
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCommentSubmit()}
                placeholder="Add a comment..."
                className="w-full bg-transparent outline-none font-inter text-sm text-white placeholder:text-[#4A4A4A] py-2 border-b border-white/5 focus:border-[#ff535b]/30 transition-colors"
                maxLength={280}
              />
              <div className="flex items-center justify-between">
                <span className="font-inter text-[10px] text-[#4A4A4A]">
                  {commentText.length > 0 && `${commentText.length}/280`}
                </span>
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff535b] text-white font-syne font-bold text-xs uppercase tracking-wider disabled:opacity-30 disabled:grayscale hover:bg-[#ff6b72] transition-all active:scale-95"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  Reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 border-b border-white/5 text-center">
            <p className="font-inter text-[#4A4A4A] text-sm mb-3">Sign in to comment</p>
            <Link href="/login" className="px-6 py-2 rounded-full bg-[#ff535b] text-white font-syne font-bold text-xs uppercase tracking-wider hover:bg-[#ff6b72] transition-all">
              Sign In
            </Link>
          </div>
        )}

        {/* Comments Section */}
        <div className="flex flex-col">
          {replies.length === 0 ? (
            <div className="py-20 text-center">
              <MessageCircle size={40} className="text-[#2a2a2a] mx-auto mb-3" />
              <p className="text-[#4A4A4A] font-inter text-sm">No comments yet. Be first.</p>
            </div>
          ) : (
            replies.map((reply, idx) => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="px-4 py-4 border-b border-white/5 flex gap-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#1c1b1b] border border-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                  {(reply.user?.display_name || reply.user?.username || '?')[0]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-syne font-bold text-[13px] text-[#F0ECE3]">
                      {reply.user?.display_name || reply.user?.username || 'Anonymous'}
                    </span>
                    <span className="font-inter text-[11px] text-[#4A4A4A]">
                      @{reply.user?.username || 'anon'}
                    </span>
                    <span className="font-inter text-[11px] text-[#353534]">·</span>
                    <span className="font-inter text-[11px] text-[#353534]">
                      {formatDistanceToNow(new Date(reply.created_at))} ago
                    </span>
                    {currentUser?.id === reply.user_id && (
                      <button onClick={() => handleDeleteReply(reply.id)} className="ml-2 text-red-500 hover:text-red-400 p-1">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <p className="font-inter text-[14px] text-[#C0BCBA] leading-relaxed">{reply.content}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
