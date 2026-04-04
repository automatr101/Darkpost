'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Flag, 
  MoreHorizontal, 
  Flame,
  Info,
  Plus,
  Ghost,
  MessageCircle,
  Lock,
  Camera
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import type { Post } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isBurnt, setIsBurnt] = useState(false);
  const [activeTab, setActiveTab] = useState<'replies' | 'stats'>('replies');
  const [echoText, setEchoText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    async function getPostData() {
      // Get post
      const { data: postData } = await supabase
        .from('posts')
        .select('*, category:categories(*), user:users(*)')
        .eq('id', params.id)
        .single();
      
      if (!postData) {
         window.location.href = '/';
         return;
      }
      setPost(postData);

      // Check if owner or unlocked for current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && postData) {
        const isMine = postData.user_id === session.user.id;
        
        const { data: screenshot } = await supabase
          .from('user_screenshots')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('post_id', params.id)
          .maybeSingle();
        
        const unlocked = isMine || !!screenshot;
        setIsUnlocked(unlocked);
        if (unlocked) fetchReplies();
        
        setPost({ ...postData, is_mine: isMine });
      } else {
        setPost(postData);
      }
      setLoading(false);
    }
    
    getPostData();
  }, [params.id, supabase]);

  const fetchReplies = async () => {
    const { data: repliesData } = await supabase
      .from('replies')
      .select('*, user:users(*)')
      .eq('post_id', params.id)
      .order('created_at', { ascending: false });

    setReplies(repliesData || []);
  };

  const handleSnapshotUnlock = async () => {
    if (!post) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/unlock`, { method: 'POST' });
      const json = await res.json();
      
      if (json.action === 'burnt') {
        setIsBurnt(true);
      } else {
        setIsUnlocked(true);
        fetchReplies();
      }
    } catch {}
  };

  const handleEchoSubmit = async () => {
    if (!echoText.trim() || submitting || !post) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: echoText.trim() }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setReplies((prev) => [data, ...prev]);
        setEchoText('');
      } else if (res.status === 403) {
        alert('You must snapshot this confession first to reveal the echoes.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <Ghost size={40} className="text-[#2a2a2a] animate-pulse" />
      </div>
    );
  }

  if (isBurnt) {
     return (
        <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center p-6 text-center">
           <Flame size={64} className="text-[#ff535b] mb-6 animate-bounce" />
           <h1 className="font-syne font-extrabold text-3xl mb-4 text-[#ff535b] uppercase tracking-tighter">This memory has burnt out</h1>
           <p className="font-inter text-[#6B6B6B] max-w-sm">
              The archive has reclaimed this confession. It was too heavy for the digital world.
           </p>
           <Link href="/" className="mt-8 px-8 py-3 rounded-full bg-white/5 border border-white/5 font-syne font-bold text-sm uppercase">
              Keep Wandering
           </Link>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#F0ECE3] pb-32 md:pb-12">
      {/* Thread Header */}
      <header className="sticky top-0 z-30 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-syne font-bold text-lg uppercase tracking-tight">Archive Thread</h1>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 hover:bg-white/5 rounded-full"><Flag size={16} className="text-[#4A4A4A]" /></button>
           <button className="p-2 hover:bg-white/5 rounded-full"><MoreHorizontal size={16} className="text-[#4A4A4A]" /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8">
        <div className="px-4 mb-8">
           {post && (
             <PostCard 
               post={post} 
               isUnlocked={isUnlocked} 
               onDelete={() => window.location.href = '/'}
             />
           )}
        </div>

        {/* Info Banner */}
        {!isUnlocked && (
           <div className="px-4 mb-8">
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                 <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
                 <p className="font-inter text-[12px] text-blue-400/80 leading-relaxed">
                    Snapshots provide a chance to reveal the full thread. 
                    Warning: Each snapshot attempt has a <span className="font-bold text-[#ff535b]">30% chance</span> of burning the thread forever.
                 </p>
              </div>
           </div>
        )}

        {/* Thread Tabs */}
        <div className="px-4 mb-8">
           <div className="flex border-b border-white/5">
              <button 
                onClick={() => setActiveTab('replies')}
                className={cn(
                  "px-6 py-4 font-syne font-bold text-sm uppercase tracking-widest relative transition-all",
                  activeTab === 'replies' ? "text-white" : "text-[#4A4A4A] hover:text-[#6B6B6B]"
                )}
              >
                Consequences ({replies.length})
                {activeTab === 'replies' && (
                  <motion.div layoutId="tab-detail" className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff535b] rounded-t-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={cn(
                  "px-6 py-4 font-syne font-bold text-sm uppercase tracking-widest relative transition-all",
                  activeTab === 'stats' ? "text-white" : "text-[#4A4A4A] hover:text-[#6B6B6B]"
                )}
              >
                Thread Stats
                {activeTab === 'stats' && (
                  <motion.div layoutId="tab-detail" className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff535b] rounded-t-full" />
                )}
              </button>
           </div>
        </div>

        {/* Locked Overlay or Content */}
        {!isUnlocked && replies.length > 0 ? (
           <div className="px-4 relative py-12 md:py-20 overflow-hidden flex flex-col items-center">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#131313]/95 to-[#131313] z-10" />
              
              <div className="flex flex-col gap-4 w-full opacity-10 filter blur-xl select-none pointer-events-none">
                 {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 md:h-32 bg-white/5 rounded-2xl w-full" />
                 ))}
              </div>

              <div className="relative z-20 text-center w-full px-6">
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-7 h-7 md:w-8 md:h-8 text-[#4A4A4A]" />
                 </div>
                 <h3 className="font-syne font-extrabold text-xl md:text-2xl mb-4 tracking-tighter uppercase">Consequences Hidden</h3>
                 <p className="font-inter text-[#6B6B6B] max-w-[280px] mx-auto text-[13px] md:text-sm mb-8 leading-relaxed">
                    Revealing the consequences of this confession requires high risk.
                 </p>
                 <button 
                   onClick={handleSnapshotUnlock}
                   className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#F0ECE3] text-[#131313] font-syne font-extrabold text-sm uppercase transition-all active:scale-95 hover:bg-white hover:shadow-2xl shadow-[#ff535b]/10"
                 >
                    <Camera size={18} strokeWidth={3} />
                    Snapshot to reveal
                 </button>
              </div>
           </div>
        ) : (
           <div className="px-4 flex flex-col gap-4 mb-20 md:mb-0">
              {replies.length > 0 ? (
                 replies.map((reply, idx) => (
                    <motion.div 
                      key={reply.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-5 rounded-3xl bg-[#1c1b1b] border border-white/5 hover:border-white/10 transition-all"
                    >
                       <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-[10px]">
                             👤
                          </div>
                          <span className="font-syne font-black text-[11px] text-[#F0ECE3] uppercase tracking-widest">
                             @{reply.user?.username || 'phantom'}
                          </span>
                          <span className="text-[10px] text-[#4A4A4A] font-inter uppercase tracking-widest">
                             {formatDistanceToNow(new Date(reply.created_at))} ago
                          </span>
                       </div>
                       <p className="font-inter text-[14px] text-[#9A9A9A] leading-relaxed pl-8">
                          {reply.content}
                       </p>
                    </motion.div>
                 ))
              ) : (
                 <div className="py-20 text-center">
                    <MessageCircle size={48} className="text-[#1c1b1b] mx-auto mb-4" />
                    <p className="text-[#4A4A4A] font-inter uppercase tracking-widest text-[10px] font-bold">Silence in the chamber</p>
                 </div>
              )}
           </div>
        )}
      </main>

      {/* Reply Sticky Input */}
      {isUnlocked && (
         <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-2 bg-[#1c1b1b]/95 backdrop-blur-xl border border-white/10 rounded-full flex items-center shadow-2xl hover:border-[#ff535b]/30 transition-all group"
            >
               <input 
                 value={echoText}
                 onChange={(e) => setEchoText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleEchoSubmit()}
                 placeholder="Cast your echo..."
                 className="flex-1 bg-transparent px-5 md:px-6 py-2 outline-none text-sm font-inter placeholder:text-[#4A4A4A] text-white"
               />
               <button 
                 onClick={handleEchoSubmit}
                 disabled={!echoText.trim() || submitting}
                 className="bg-[#ff535b] p-3 rounded-full text-white hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-[#ff535b]/20 disabled:opacity-30 disabled:grayscale"
               >
                  {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={20} strokeWidth={3} />}
               </button>
            </motion.div>
         </div>
      )}
    </div>
  );
}
