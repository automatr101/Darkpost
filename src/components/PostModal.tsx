import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Ghost, Send, Camera, Lock, Sparkles } from 'lucide-react';
import ScreenshotCard from './ScreenshotCard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@/lib/types';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user?: { username: string; display_name: string | null; avatar_url: string | null };
}

interface PostModalProps {
  post: Post;
  onClose: () => void;
}

export default function PostModal({ post, onClose }: PostModalProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [burnScore, setBurnScore] = useState(0);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const screenshotRef = useRef<HTMLDivElement>(null);

  const displayName = post.is_anon
    ? post.alias || 'Anonymous'
    : post.user?.display_name || post.user?.username || 'Unknown';

  // Animate burn score counter
  useEffect(() => {
    if (!unlocked || burnScore === 0) return;

    const start = performance.now();
    const duration = 1000;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayedScore(Math.round(progress * burnScore));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [unlocked, burnScore]);

  async function handleScreenshotUnlock() {
    setLoading(true);
    try {
      if (screenshotRef.current) {
        const html2canvas = (await import('html2canvas')).default;
        await document.fonts.ready;
        const canvas = await html2canvas(screenshotRef.current, {
          scale: 2,
          backgroundColor: '#131313',
          width: 1080,
          height: 1080,
          useCORS: true,
        });

        const link = document.createElement('a');
        link.download = `darkpost-${post.id.slice(0, 8)}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        link.click();
      }
    } catch (err) {
      console.warn('Screenshot generation failed', err);
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/screenshot`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies || []);
        setBurnScore(data.burn_score || 0);
        setUnlocked(true);
      } else if (res.status === 401) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReplySubmit() {
    if (!replyText.trim() || replyText.length > 200) return;
    setSubmittingReply(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setReplies((prev) => [data, ...prev]);
        setReplyText('');
      }
    } catch {
      // Error
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#1c1b1b] rounded-[32px] md:rounded-[48px] border border-white/5 overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Branding */}
        <div className="absolute top-6 left-8 flex items-center gap-2 pointer-events-none opacity-20">
           <Sparkles size={16} className="text-[#ff535b]" />
           <span className="font-syne font-black uppercase tracking-[0.3em] text-[10px] text-white">Archive Core</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[#6B6B6B] hover:text-white hover:bg-white/10 transition-all z-20"
        >
          <X size={20} />
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar pt-16 md:pt-20 px-6 md:px-12 pb-12">
          {/* Confession Focus */}
          <div className="mb-10 text-center">
             <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-[#252424] border border-white/5 flex items-center justify-center text-3xl shadow-xl rotate-3">
                   {post.post_type === 'voice' ? '🎙' : '👻'}
                </div>
             </div>
             
             <h2 className="font-syne font-bold text-[#F0ECE3] text-xl md:text-2xl mb-2">
                {displayName}
             </h2>
             <div className="flex items-center justify-center gap-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="font-syne font-extrabold uppercase tracking-widest text-[10px] text-[#4A4A4A]">
                  RECORDED {formatDistanceToNow(new Date(post.created_at)).toUpperCase()} AGO
                </p>
             </div>

             {post.post_type === 'text' && (
                <blockquote className="font-dm-serif text-2xl md:text-3xl lg:text-4xl text-[#F0ECE3] leading-relaxed italic mb-8 px-4">
                  &ldquo;{post.content}&rdquo;
                </blockquote>
             )}

             {post.post_type === 'voice' && (
                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 mb-8">
                   <div className="flex items-center gap-1.5 h-12 w-full">
                      {(post.waveform_data || Array.from({ length: 50 }, () => 0.2 + Math.random() * 0.8)).map((v, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full bg-[#ff535b]/20"
                          style={{ height: `${(v as number) * 100}%`, minHeight: '4px' }}
                        />
                      ))}
                   </div>
                </div>
             )}

             {post.category && (
                <div className="flex justify-center">
                   <span 
                     className="px-4 py-2 rounded-xl font-syne font-black uppercase text-[10px] tracking-widest border"
                     style={{
                        backgroundColor: `${post.category.color_hex}10`,
                        borderColor: `${post.category.color_hex}30`,
                        color: post.category.color_hex
                     }}
                   >
                      {post.category.label}
                   </span>
                </div>
             )}
          </div>

          {/* Interaction Zone */}
          <div className="space-y-8">
            {!unlocked ? (
              <div className="flex flex-col items-center gap-6 p-10 rounded-[40px] bg-black/40 border border-dashed border-white/10">
                <div className="w-16 h-16 rounded-full bg-[#ff535b]/10 flex items-center justify-center text-[#ff535b]">
                   <Camera size={32} />
                </div>
                <div className="text-center">
                   <h3 className="font-syne font-bold text-lg text-white mb-2 text-balance">Capture this record to reveal the Echoes</h3>
                   <p className="text-[#6B6B6B] text-sm max-w-sm mx-auto">Snapshotted confessions revealed the community&apos;s response. Capture yours to join the circle.</p>
                </div>
                <button
                  onClick={handleScreenshotUnlock}
                  disabled={loading}
                  className={cn(
                    "w-full max-w-xs py-4 rounded-full font-syne font-black uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center justify-center gap-3",
                    loading ? "bg-white/5 text-[#4A4A4A]" : "bg-[#ff535b] text-white hover:scale-105 active:scale-95"
                  )}
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Lock size={18} />}
                  {loading ? 'Processing...' : 'Capture & Reveal'}
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Burn Score Pulse */}
                <div className="relative py-10 flex flex-col items-center overflow-hidden rounded-[40px] bg-[#ff535b]/5 border border-[#ff535b]/20">
                   <div className="absolute inset-0 bg-[#ff535b]/5 animate-pulse" />
                   <span className="relative z-10 font-syne font-black text-6xl md:text-7xl text-[#ff535b] tracking-tighter mb-2">
                     {displayedScore}
                   </span>
                   <span className="relative z-10 font-syne font-black uppercase tracking-[0.4em] text-[10px] text-[#ff535b]/60">Archive Heat Index</span>
                </div>

                {/* Comments Section */}
                <div>
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                         <MessageCircle size={18} className="text-[#6B6B6B]" />
                         <h4 className="font-syne font-bold text-[#F0ECE3] uppercase tracking-widest text-[12px]">The Echo Chamber ({replies.length})</h4>
                      </div>
                   </div>

                   {/* Commment Input */}
                   <div className="flex gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                         <Ghost size={20} className="text-[#4A4A4A]" />
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          maxLength={200}
                          placeholder="Cast your echo..."
                          className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white placeholder-[#4A4A4A] outline-none focus:border-[#ff535b]/30 focus:bg-white/[0.07] transition-all"
                        />
                        <button
                          onClick={handleReplySubmit}
                          disabled={!replyText.trim() || submittingReply}
                          className="w-12 h-12 rounded-2xl bg-[#ff535b] flex items-center justify-center text-white disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {replies.map((reply, idx) => (
                          <motion.div
                            key={reply.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx % 5 * 0.05 }}
                            className="group p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                          >
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                   <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px]">👤</div>
                                   <span className="font-syne font-black text-[#F0ECE3] text-[11px] uppercase tracking-widest">@{reply.user?.username || 'phantom'}</span>
                                </div>
                                <span className="text-[10px] text-[#4A4A4A] font-medium tracking-tighter">
                                  {formatDistanceToNow(new Date(reply.created_at))} ago
                                </span>
                             </div>
                             <p className="text-[#9A9A9A] text-[14px] leading-relaxed pl-8">
                                {reply.content}
                             </p>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {replies.length === 0 && (
                        <div className="text-center py-20 rounded-[40px] border border-dashed border-white/5">
                           <MessageCircle size={40} className="text-white/5 mx-auto mb-4" />
                           <p className="font-syne font-bold text-[#4A4A4A] uppercase tracking-widest text-[10px]">Absolute Silence in the Chamber</p>
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Hidden Screenshot Target */}
        <div ref={screenshotRef} className="fixed -left-[10000px] top-0">
           <ScreenshotCard post={post} />
        </div>
      </motion.div>
    </div>
  );
}
